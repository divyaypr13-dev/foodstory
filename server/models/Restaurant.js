import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', maxlength: 1500 },
    cuisineTags: { type: [String], default: [] },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [77.5946, 12.9716], // [lng, lat]
      },
    },
    photos: { type: [String], default: [] },
    openTime: { type: String, default: '09:00' },
    closeTime: { type: String, default: '22:30' },
    contactNumber: { type: String, default: '' },
    email: { type: String, default: '', lowercase: true, trim: true },
    costLevel: { type: Number, min: 1, max: 4, default: 2 },
    facilities: {
      parking: { type: Boolean, default: false },
      wifi: { type: Boolean, default: false },
      outdoorSeating: { type: Boolean, default: false },
      wheelchairAccessible: { type: Boolean, default: false },
      petFriendly: { type: Boolean, default: false },
    },
    foodTypes: {
      type: [String],
      enum: ['veg', 'non-veg', 'vegan', 'jain'],
      default: ['veg', 'non-veg'],
    },
    gstRate: { type: Number, default: 5, min: 0, max: 28 },
    serviceChargeRate: { type: Number, default: 0, min: 0, max: 25 },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'approved', 'rejected'],
      default: 'unverified',
    },
    verificationNotes: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    profileViews: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

restaurantSchema.index({ location: '2dsphere' });
restaurantSchema.index({ name: 'text', description: 'text', cuisineTags: 'text', city: 'text' });

export default mongoose.model('Restaurant', restaurantSchema);
