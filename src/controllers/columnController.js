const Column = require('../models/Column');
const Task = require('../models/Task');

// GET /api/columns
// Returns all columns sorted by order, with task count
const getColumns = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { user_id: req.user._id };

    const columns = await Column.find(filter)
      .sort({ order: 1 })
      .populate('count');

    res.json({ success: true, data: columns });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/columns/:id
// Returns single column with its tasks
const getColumnById = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, user_id: req.user._id };

    const column = await Column.findOne(filter)
      .populate({ path: 'tasks', options: { sort: { order: 1 } } })
      .populate('count');

    if (!column) {
      return res.status(404).json({ success: false, message: 'Column not found or unauthorized' });
    }

    res.json({ success: true, data: column });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/columns
// Body: { name }
// Auto-assigns order = last + 1
const createColumn = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin cannot create data' });
    }

    const { name } = req.body;

    // Find current max order for this user
    const last = await Column.findOne({ user_id: req.user._id }).sort({ order: -1 }).select('order');
    const order = last ? last.order + 1 : 1;

    const column = await Column.create({ name, order, user_id: req.user._id });

    res.status(201).json({ success: true, data: column });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/columns/:id
// Body: { name }  — only name is editable via this route
const updateColumn = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin cannot modify data' });
    }

    const { name } = req.body;

    const column = await Column.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      { name },
      { new: true, runValidators: true }
    ).populate('count');

    if (!column) {
      return res.status(404).json({ success: false, message: 'Column not found or unauthorized' });
    }

    res.json({ success: true, data: column });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/columns/:id
// Also deletes all tasks inside that column
const deleteColumn = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin cannot delete data' });
    }

    const column = await Column.findOne({ _id: req.params.id, user_id: req.user._id });
    if (!column) {
      return res.status(404).json({ success: false, message: 'Column not found or unauthorized' });
    }

    const deletedOrder = column.order;

    // Delete column tasks
    await Task.deleteMany({ column_id: req.params.id, user_id: req.user._id });

    // Delete column
    await column.deleteOne();

    // Shift orders of columns that came after deleted one
    await Column.updateMany(
      { user_id: req.user._id, order: { $gt: deletedOrder } },
      { $inc: { order: -1 } }
    );

    res.json({ success: true, message: 'Column and its tasks deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/columns/:id/move
// Body: { direction: "left" | "right" }
// Swaps order with adjacent column
const moveColumn = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin cannot modify data' });
    }

    const { direction } = req.body;

    if (!['left', 'right'].includes(direction)) {
      return res.status(400).json({ success: false, message: 'direction must be "left" or "right"' });
    }

    const column = await Column.findOne({ _id: req.params.id, user_id: req.user._id });
    if (!column) {
      return res.status(404).json({ success: false, message: 'Column not found or unauthorized' });
    }

    const targetOrder = direction === 'left' ? column.order - 1 : column.order + 1;

    const sibling = await Column.findOne({ user_id: req.user._id, order: targetOrder });
    if (!sibling) {
      return res.status(400).json({ success: false, message: `No column to move ${direction}` });
    }

    // Swap orders
    const temp = column.order;
    column.order = sibling.order;
    sibling.order = temp;

    await column.save();
    await sibling.save();

    res.json({ success: true, data: { moved: column, swapped: sibling } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/columns/reorder
// Body: { orders: [{ id, order }] }
// Bulk reorder — drag & drop support
const reorderColumns = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin cannot modify data' });
    }

    const { orders } = req.body;

    if (!Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({ success: false, message: 'orders array is required' });
    }

    const bulkOps = orders.map(({ id, order }) => ({
      updateOne: {
        filter: { _id: id, user_id: req.user._id },
        update: { $set: { order } },
      },
    }));

    await Column.bulkWrite(bulkOps);

    const columns = await Column.find({ user_id: req.user._id }).sort({ order: 1 }).populate('count');

    res.json({ success: true, data: columns });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  getColumns,
  getColumnById,
  createColumn,
  updateColumn,
  deleteColumn,
  moveColumn,
  reorderColumns,
};
