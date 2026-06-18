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

    const tasks = await Task.find(filter)
      .sort({ column_id: 1, order: 1 })
      .populate('column_id', 'name');

    res.json({ success: true, data: tasks });
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

// PATCH /api/tasks/reorder
// Body: { tasks: [{ id, column_id, order }] }
// Bulk reorder — drag & drop support across columns
const reorderTasks = async (req, res) => {
  try {
    const { tasks } = req.body;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ success: false, message: 'tasks array is required' });
    }

    // First ensure all tasks belong to user and target columns belong to user
    const taskIds = tasks.map(t => t.id);
    const colIds = [...new Set(tasks.map(t => t.column_id))];

    const filterTask = req.user.role === 'admin' ? { _id: { $in: taskIds } } : { _id: { $in: taskIds }, user_id: req.user._id };
    const userTasksCount = await Task.countDocuments(filterTask);
    if (userTasksCount !== taskIds.length) {
       return res.status(403).json({ success: false, message: 'One or more tasks are unauthorized' });
    }

    const filterCol = req.user.role === 'admin' ? { _id: { $in: colIds } } : { _id: { $in: colIds }, user_id: req.user._id };
    const userColsCount = await Column.countDocuments(filterCol);
    if (userColsCount !== colIds.length) {
       return res.status(403).json({ success: false, message: 'One or more target columns are unauthorized' });
    }

    const bulkOps = tasks.map(({ id, column_id, order }) => {
      const filter = req.user.role === 'admin' ? { _id: id } : { _id: id, user_id: req.user._id };
      return {
        updateOne: {
          filter,
          update: { $set: { column_id, order } },
        },
      };
    });

    await Task.bulkWrite(bulkOps);

    res.json({ success: true, message: 'Tasks reordered successfully' });
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
  reorderTasks,
};
