const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const {
  getColumns,
  getColumnById,
  createColumn,
  updateColumn,
  deleteColumn,
  moveColumn,
  reorderColumns,
} = require('../controllers/columnController');

/**
 * @swagger
 * tags:
 *   name: Columns
 *   description: API to manage kanban columns
 */

/**
 * @swagger
 * /api/columns:
 *   get:
 *     summary: Retrieve a list of columns
 *     tags: [Columns]
 *     responses:
 *       200:
 *         description: A list of columns.
 */
// GET /api/columns
router.get('/', getColumns);

/**
 * @swagger
 * /api/columns/{id}:
 *   get:
 *     summary: Get a column by ID
 *     tags: [Columns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Column ID
 *     responses:
 *       200:
 *         description: Column data
 *       404:
 *         description: Column not found
 */
// GET /api/columns/:id
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid column id')],
  validate,
  getColumnById
);

/**
 * @swagger
 * /api/columns:
 *   post:
 *     summary: Create a new column
 *     tags: [Columns]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Column name
 *     responses:
 *       201:
 *         description: Created column
 */
// POST /api/columns
router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('name is required')],
  validate,
  createColumn
);

/**
 * @swagger
 * /api/columns/{id}:
 *   put:
 *     summary: Update a column by ID
 *     tags: [Columns]
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
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated column
 *       404:
 *         description: Column not found
 */
// PUT /api/columns/:id
router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid column id'),
    body('name').trim().notEmpty().withMessage('name is required'),
  ],
  validate,
  updateColumn
);

/**
 * @swagger
 * /api/columns/{id}:
 *   delete:
 *     summary: Delete a column by ID
 *     tags: [Columns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Column deleted successfully
 *       404:
 *         description: Column not found
 */
// DELETE /api/columns/:id
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid column id')],
  validate,
  deleteColumn
);

/**
 * @swagger
 * /api/columns/reorder:
 *   patch:
 *     summary: Reorder columns
 *     tags: [Columns]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orders:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     order:
 *                       type: number
 *     responses:
 *       200:
 *         description: Columns reordered successfully
 */
// PATCH /api/columns/reorder  — must come BEFORE /:id routes
router.patch(
  '/reorder',
  [body('orders').isArray({ min: 1 }).withMessage('orders must be a non-empty array')],
  validate,
  reorderColumns
);

/**
 * @swagger
 * /api/columns/{id}/move:
 *   patch:
 *     summary: Move a column left or right
 *     tags: [Columns]
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
 *             required:
 *               - direction
 *             properties:
 *               direction:
 *                 type: string
 *                 enum: [left, right]
 *     responses:
 *       200:
 *         description: Column moved successfully
 */
// PATCH /api/columns/:id/move
router.patch(
  '/:id/move',
  [
    param('id').isMongoId().withMessage('Invalid column id'),
    body('direction').isIn(['left', 'right']).withMessage('direction must be left or right'),
  ],
  validate,
  moveColumn
);

module.exports = router;
