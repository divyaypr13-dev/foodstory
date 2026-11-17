import mongoose from 'mongoose';

const menuItemSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', maxlength: 500 },
    price: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      enum: ['starter', 'main', 'dessert', 'beverage'],
      required: true,
    },
    foodType: {
      type: String,
      enum: ['veg', 'non-veg', 'vegan', 'jain'],
      default: 'veg',
    },
    image: { type: String, default: '' },
    isAvailable: { type: Boolean, default: true },
    gstRate: { type: Number, default: null, min: 0, max: 28 },
    tags: { type: [String], default: [] },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

menuItemSchema.index({ name: 'text', description: 'text', tags: 'text' });

export default mongoose.model('MenuItem', menuItemSchema);
