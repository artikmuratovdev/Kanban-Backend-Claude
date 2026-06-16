const mongoose = require('mongoose');

const columnSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Column name is required'],
      trim: true,
      maxlength: [100, 'Column name cannot exceed 100 characters'],
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'user_id is required'],
    },
    order: {
      type: Number,
      required: true,
      min: [1, 'Order must be at least 1'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.__v;
      },
    },
    toObject: { virtuals: true },
  }
);

// Virtual: task count (populated when needed)
columnSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'column_id',
  options: { sort: { order: 1 } },
});

// Virtual: count only
columnSchema.virtual('count', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'column_id',
  count: true,
});

// Index for fast ordering
columnSchema.index({ order: 1 });

module.exports = mongoose.model('Column', columnSchema);
