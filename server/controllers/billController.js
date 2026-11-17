import { z } from 'zod';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';

const billSchema = z.object({
  restaurantId: z.string().min(1, 'Restaurant ID is required'),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        qty: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(99),
      })
    )
    .min(1, 'Select at least one dish to estimate your bill'),
});

const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

export const calculate = async (req, res, next) => {
  try {
    const { restaurantId, items } = billSchema.parse(req.body);

    const restaurant = await Restaurant.findById(restaurantId).lean();
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const menuIds = items.map((i) => i.menuItemId);
    const menuDocs = await MenuItem.find({
      _id: { $in: menuIds },
      restaurant: restaurantId,
    }).lean();

    const menuMap = new Map(menuDocs.map((m) => [String(m._id), m]));

    let subtotal = 0;
    let gstTotal = 0;
    const calculatedItems = [];

    for (const entry of items) {
      const dish = menuMap.get(String(entry.menuItemId));
      if (!dish) {
        return res.status(400).json({
          message: `Menu item ${entry.menuItemId} does not belong to this restaurant`,
        });
      }

      const lineTotal = round2(dish.price * entry.qty);
      const effectiveGstRate =
        dish.gstRate !== null && dish.gstRate !== undefined ? dish.gstRate : restaurant.gstRate ?? 5;
      const gstAmount = round2((lineTotal * effectiveGstRate) / 100);

      subtotal = round2(subtotal + lineTotal);
      gstTotal = round2(gstTotal + gstAmount);

      calculatedItems.push({
        menuItemId: dish._id,
        name: dish.name,
        unitPrice: dish.price,
        qty: entry.qty,
        lineTotal,
        gstRate: effectiveGstRate,
        gstAmount,
      });
    }

    const serviceChargeRate = restaurant.serviceChargeRate || 0;
    const serviceCharge = round2((subtotal * serviceChargeRate) / 100);
    const grandTotal = round2(subtotal + gstTotal + serviceCharge);

    res.json({
      restaurant: {
        _id: restaurant._id,
        name: restaurant.name,
        gstRate: restaurant.gstRate ?? 5,
        serviceChargeRate,
      },
      items: calculatedItems,
      subtotal,
      gstTotal,
      serviceChargeRate,
      serviceCharge,
      grandTotal,
      disclaimer: 'Estimated Bill — not an official invoice',
    });
  } catch (err) {
    next(err);
  }
};
