const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  reorderTask,
} = require('../controllers/taskController');

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: API to manage kanban tasks
 */

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Retrieve a list of tasks
 *     tags: [Tasks]
 *     parameters:
 *       - in: query
 *         name: column_id
 *         schema:
 *           type: string
 *         description: Filter tasks by column ID
 *     responses:
 *       200:
 *         description: A list of tasks.
 */
// GET /api/tasks?column_id=<id>
router.get(
  '/',
  [query('column_id').optional().isMongoId().withMessage('Invalid column_id')],
  validate,
  getTasks
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get a task by ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task data
 *       404:
 *         description: Task not found
 */
// GET /api/tasks/:id
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid task id')],
  validate,
  getTaskById
);

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - column_id
 *             properties:
 *               title:
 *                 type: string
 *                 description: Task title
 *               description:
 *                 type: string
 *                 description: Task description
 *               column_id:
 *                 type: string
 *                 description: ID of the column this task belongs to
 *     responses:
 *       201:
 *         description: Created task
 */
// POST /api/tasks
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('title is required'),
    body('description').optional().trim(),
    body('column_id').isMongoId().withMessage('column_id must be a valid MongoDB id'),
  ],
  validate,
  createTask
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update a task by ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               column_id:
 *                 type: string
 *               order:
 *                 type: number
 *     responses:
 *       200:
 *         description: Updated task
 *       404:
 *         description: Task not found
 */
// PUT /api/tasks/:id
router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid task id'),
    body('title').optional().trim().notEmpty().withMessage('title cannot be empty'),
    body('description').optional().trim(),
    body('column_id').optional().isMongoId().withMessage('column_id must be a valid MongoDB id'),
    body('order').optional().isInt({ min: 1 }).withMessage('order must be a positive integer'),
  ],
  validate,
  updateTask
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a task by ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       404:
 *         description: Task not found
 */
// DELETE /api/tasks/:id
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid task id')],
  validate,
  deleteTask
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   patch:
 *     summary: Update task position (drag & drop)
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               order:
 *                 type: number
 *               column_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Task position updated successfully
 */
// PATCH /api/tasks/:id
router.patch(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid task id'),
    body('order').isInt({ min: 1 }).withMessage('order must be a positive integer'),
    body('column_id').isMongoId().withMessage('column_id must be a valid MongoDB id'),
  ],
  validate,
  reorderTask
);

module.exports = router;
