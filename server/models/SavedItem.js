import mongoose from 'mongoose';

const savedItemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    itemType: {
      type: String,
      enum: ['restaurant', 'dish', 'post', 'review'],
      required: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Collection',
      default: null,
    },
  },
  { timestamps: true }
);

savedItemSchema.index({ user: 1, itemType: 1, itemId: 1 }, { unique: true });

export default mongoose.model('SavedItem', savedItemSchema);
