import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 2000 },
    photos: { type: [String], default: [] },
    helpfulBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    ownerResponse: {
      text: { type: String, default: '' },
      respondedAt: { type: Date, default: null },
    },
    isHidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ user: 1, restaurant: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);
