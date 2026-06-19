const Task = require('../models/Task');
const Column = require('../models/Column');

// GET /api/tasks
// Query: ?column_id=<id>  (optional filter by column)
const getTasks = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { user_id: req.user._id };
    
    if (req.query.column_id) {
      filter.column_id = req.query.column_id;
    }

    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const tasks = await Task.find(filter)
      .sort({ column_id: 1, order: 1 })
      .skip(skip)
      .limit(limit)
      .populate('column_id', 'name');

    const total = await Task.countDocuments(filter);

    res.json({
      success: true,
      data: tasks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/tasks/:id
const getTaskById = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, user_id: req.user._id };
    
    const task = await Task.findOne(filter).populate('column_id', 'name');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found or unauthorized' });
    }

    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/tasks
// Body: { title, description?, column_id }
// Auto-assigns order = last in column + 1
const createTask = async (req, res) => {
  try {
    const { title, description, column_id } = req.body;

    // Check column exists
    const colFilter = req.user.role === 'admin' ? { _id: column_id } : { _id: column_id, user_id: req.user._id };
    const column = await Column.findOne(colFilter);
    if (!column) {
      return res.status(404).json({ success: false, message: 'Column not found or unauthorized' });
    }

    const targetUserId = column.user_id;

    // Auto order
    const last = await Task.findOne({ column_id, user_id: targetUserId }).sort({ order: -1 }).select('order');
    const order = last ? last.order + 1 : 1;

    const task = await Task.create({ title, description, column_id, order, user_id: targetUserId });
    await task.populate('column_id', 'name');

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/tasks/:id
// Body: { title?, description?, column_id?, order? }
// Full update — handles column change + order shift
const updateTask = async (req, res) => {
  try {
    const { title, description, column_id, order } = req.body;

    const filter = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, user_id: req.user._id };
    const task = await Task.findOne(filter);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found or unauthorized' });
    }

    const targetUserId = task.user_id;

    const oldColumnId = task.column_id.toString();
    const newColumnId = column_id ? column_id.toString() : oldColumnId;
    const isMovingColumn = oldColumnId !== newColumnId;

    // Validate target column if changing
    if (isMovingColumn) {
      const targetColumn = await Column.findOne({ _id: newColumnId, user_id: targetUserId });
      if (!targetColumn) {
        return res.status(404).json({ success: false, message: 'Target column not found or unauthorized' });
      }
    }

    // Determine final order
    let finalOrder = order;
    if (isMovingColumn && !order) {
      // Append to end of target column
      const last = await Task.findOne({ column_id: newColumnId, user_id: targetUserId }).sort({ order: -1 }).select('order');
      finalOrder = last ? last.order + 1 : 1;
    }

    // If moving column: shift old column down
    if (isMovingColumn) {
      await Task.updateMany(
        { column_id: oldColumnId, user_id: targetUserId, order: { $gt: task.order } },
        { $inc: { order: -1 } }
      );

      // Shift new column up to make room
      if (finalOrder) {
        await Task.updateMany(
          { column_id: newColumnId, user_id: targetUserId, order: { $gte: finalOrder } },
          { $inc: { order: 1 } }
        );
      }
    } else if (order && order !== task.order) {
      // Reordering within same column
      if (order > task.order) {
        await Task.updateMany(
          { column_id: oldColumnId, user_id: targetUserId, order: { $gt: task.order, $lte: order } },
          { $inc: { order: -1 } }
        );
      } else {
        await Task.updateMany(
          { column_id: oldColumnId, user_id: targetUserId, order: { $gte: order, $lt: task.order } },
          { $inc: { order: 1 } }
        );
      }
    }

    // Apply updates
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (column_id) task.column_id = newColumnId;
    if (finalOrder) task.order = finalOrder;

    await task.save();
    await task.populate('column_id', 'name');

    res.json({ success: true, data: task });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/tasks/:id
// Shifts order of remaining tasks in column
const deleteTask = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, user_id: req.user._id };
    const task = await Task.findOne(filter);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found or unauthorized' });
    }

    const targetUserId = task.user_id;
    const { column_id, order } = task;
    await task.deleteOne();

    // Shift down tasks that came after deleted task
    await Task.updateMany(
      { column_id, user_id: targetUserId, order: { $gt: order } },
      { $inc: { order: -1 } }
    );

    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/tasks/:id
// Body: { column_id, order }
// Single task reorder — handles column change + order shift
const reorderTask = async (req, res) => {
  try {
    const { column_id, order } = req.body;

    if (order === undefined || !column_id) {
      return res.status(400).json({ success: false, message: 'order and column_id are required' });
    }

    const filter = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, user_id: req.user._id };
    const task = await Task.findOne(filter);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found or unauthorized' });
    }

    const targetUserId = task.user_id;
    const oldColumnId = task.column_id.toString();
    const newColumnId = column_id.toString();
    const isMovingColumn = oldColumnId !== newColumnId;

    if (isMovingColumn) {
      const targetColumn = await Column.findOne({ _id: newColumnId, user_id: targetUserId });
      if (!targetColumn) {
        return res.status(404).json({ success: false, message: 'Target column not found or unauthorized' });
      }
    }

    // Shifting logic
    if (isMovingColumn) {
      await Task.updateMany(
        { column_id: oldColumnId, user_id: targetUserId, order: { $gt: task.order } },
        { $inc: { order: -1 } }
      );
      await Task.updateMany(
        { column_id: newColumnId, user_id: targetUserId, order: { $gte: order } },
        { $inc: { order: 1 } }
      );
    } else if (order !== task.order) {
      if (order > task.order) {
        await Task.updateMany(
          { column_id: oldColumnId, user_id: targetUserId, order: { $gt: task.order, $lte: order } },
          { $inc: { order: -1 } }
        );
      } else {
        await Task.updateMany(
          { column_id: oldColumnId, user_id: targetUserId, order: { $gte: order, $lt: task.order } },
          { $inc: { order: 1 } }
        );
      }
    }

    task.column_id = newColumnId;
    task.order = order;
    await task.save();
    await task.populate('column_id', 'name');

    res.json({ success: true, message: 'Task position updated successfully', data: task });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  reorderTask,
};
