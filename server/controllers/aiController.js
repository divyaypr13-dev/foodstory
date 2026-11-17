import { GoogleGenAI, Type } from '@google/genai';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';

// Rate limit: 1 req / 10s / user, 30 / day
const userRateMap = new Map();
// Cache: 30 min TTL
const aiCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000;

function checkRateLimit(userId) {
  const key = String(userId);
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  const entry = userRateMap.get(key) || { lastReq: 0, day: today, count: 0 };

  if (entry.day !== today) {
    entry.day = today;
    entry.count = 0;
  }
  if (now - entry.lastReq < 10_000) {
    return { allowed: false, message: 'Please wait 10 seconds between AI recommendation requests.' };
  }
  if (entry.count >= 30) {
    return { allowed: false, message: 'Daily limit of 30 AI recommendation requests reached.' };
  }

  entry.lastReq = now;
  entry.count += 1;
  userRateMap.set(key, entry);
  return { allowed: true };
}

function getCached(cacheKey) {
  const hit = aiCache.get(cacheKey);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    aiCache.delete(cacheKey);
    return null;
  }
  return hit.data;
}

function setCache(cacheKey, data) {
  aiCache.set(cacheKey, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function callGeminiWithTimeout(prompt, schema) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY missing');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Gemini request timed out after 5s')), 5000)
  );

  const generatePromise = ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  });

  const response = await Promise.race([generatePromise, timeoutPromise]);
  return JSON.parse((response.text ?? '{}').trim());
}

export const recommendRestaurants = async (req, res, next) => {
  try {
    const rate = checkRateLimit(req.user._id);
    if (!rate.allowed) {
      return res.status(429).json({ message: rate.message });
    }

    const { lat, lng, craving } = req.body || {};
    const latBucket = lat ? Number(lat).toFixed(2) : 'none';
    const lngBucket = lng ? Number(lng).toFixed(2) : 'none';
    const moodKey = (craving || 'any').trim().toLowerCase().slice(0, 40);
    const cacheKey = `rest:${req.user._id}:${latBucket}:${lngBucket}:${moodKey}`;

    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    let candidates = [];
    if (lat !== undefined && lng !== undefined && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng))) {
      candidates = await Restaurant.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
            distanceField: 'distanceMeters',
            maxDistance: 25000,
            spherical: true,
          },
        },
        { $limit: 10 },
      ]);
    }

    if (!candidates.length) {
      candidates = await Restaurant.find({})
        .sort({ ratingAvg: -1, ratingCount: -1 })
        .limit(10)
        .lean();
    }

    if (!candidates.length) {
      return res.json({ recommendations: [], fallback: true, label: 'Popular near you' });
    }

    // Compact context with NO PII
    const compactContext = candidates.map((r) => ({
      id: String(r._id),
      name: r.name,
      cuisines: r.cuisineTags || [],
      rating: r.ratingAvg || 0,
      costLevel: r.costLevel || 2,
    }));

    const candidateMap = new Map(candidates.map((r) => [String(r._id), r]));

    try {
      const prompt = `Pick the best 3 restaurants from the candidate list for a diner${
        craving ? ` craving "${craving.slice(0, 80)}"` : ''
      }. Return ONLY valid JSON matching the schema with valid IDs from the list and a short 1-sentence reason for each.\nCandidates: ${JSON.stringify(
        compactContext
      )}`;

      const schema = {
        type: Type.OBJECT,
        properties: {
          picks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                reason: { type: Type.STRING },
              },
              required: ['id', 'reason'],
            },
          },
        },
        required: ['picks'],
      };

      const parsed = await callGeminiWithTimeout(prompt, schema);
      const validPicks = (parsed.picks || [])
        .filter((p) => candidateMap.has(String(p.id)))
        .slice(0, 3)
        .map((p) => ({
          restaurant: candidateMap.get(String(p.id)),
          reason: p.reason,
        }));

      if (validPicks.length > 0) {
        const result = { recommendations: validPicks, fallback: false, label: 'Curated for you' };
        setCache(cacheKey, result);
        return res.json(result);
      }
      throw new Error('No valid restaurant IDs returned by AI');
    } catch {
      const fallbackRecs = candidates.slice(0, 3).map((r) => ({
        restaurant: r,
        reason: `Rated ${r.ratingAvg ? r.ratingAvg.toFixed(1) : 'New'} with ${(r.cuisineTags || []).slice(0, 2).join(', ') || 'local'} specialties.`,
      }));
      const result = {
        recommendations: fallbackRecs,
        fallback: true,
        label: 'Popular near you',
      };
      setCache(cacheKey, result);
      return res.json(result);
    }
  } catch (err) {
    next(err);
  }
};

export const recommendDishes = async (req, res, next) => {
  try {
    const rate = checkRateLimit(req.user._id);
    if (!rate.allowed) {
      return res.status(429).json({ message: rate.message });
    }

    const { craving, foodType } = req.body || {};
    const moodKey = (craving || 'any').trim().toLowerCase().slice(0, 40);
    const cacheKey = `dish:${req.user._id}:${foodType || 'all'}:${moodKey}`;

    const cached = getCached(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const filter = { isAvailable: true };
    if (foodType && ['veg', 'non-veg', 'vegan', 'jain'].includes(foodType)) {
      filter.foodType = foodType;
    }

    const candidates = await MenuItem.find(filter)
      .sort({ ratingAvg: -1, createdAt: -1 })
      .limit(10)
      .populate('restaurant', 'name city ratingAvg')
      .lean();

    if (!candidates.length) {
      return res.json({ recommendations: [], fallback: true, label: 'Popular near you' });
    }

    // Compact context with NO PII
    const compactContext = candidates.map((d) => ({
      id: String(d._id),
      name: d.name,
      category: d.category,
      foodType: d.foodType,
      price: d.price,
      tags: d.tags || [],
      restaurantName: d.restaurant?.name || '',
    }));

    const candidateMap = new Map(candidates.map((d) => [String(d._id), d]));

    try {
      const prompt = `Pick the best 3 dishes from the candidate list for a diner${
        craving ? ` looking for "${craving.slice(0, 80)}"` : ''
      }. Return ONLY valid JSON matching the schema with valid IDs from the list and a short 1-sentence reason for each.\nCandidates: ${JSON.stringify(
        compactContext
      )}`;

      const schema = {
        type: Type.OBJECT,
        properties: {
          picks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                reason: { type: Type.STRING },
              },
              required: ['id', 'reason'],
            },
          },
        },
        required: ['picks'],
      };

      const parsed = await callGeminiWithTimeout(prompt, schema);
      const validPicks = (parsed.picks || [])
        .filter((p) => candidateMap.has(String(p.id)))
        .slice(0, 3)
        .map((p) => ({
          dish: candidateMap.get(String(p.id)),
          reason: p.reason,
        }));

      if (validPicks.length > 0) {
        const result = { recommendations: validPicks, fallback: false, label: 'Curated dishes' };
        setCache(cacheKey, result);
        return res.json(result);
      }
      throw new Error('No valid dish IDs returned by AI');
    } catch {
      const fallbackRecs = candidates.slice(0, 3).map((d) => ({
        dish: d,
        reason: `${d.category} favorite (${d.foodType}) from ${d.restaurant?.name || 'local kitchen'}.`,
      }));
      const result = {
        recommendations: fallbackRecs,
        fallback: true,
        label: 'Popular near you',
      };
      setCache(cacheKey, result);
      return res.json(result);
    }
  } catch (err) {
    next(err);
  }
};
