const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    column_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Column',
      required: [true, 'column_id is required'],
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

// Compound index: fast queries per column, sorted by order
taskSchema.index({ column_id: 1, order: 1 });

module.exports = mongoose.model('Task', taskSchema);
