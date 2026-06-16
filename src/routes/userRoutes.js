const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createUser, getUsers } = require('../controllers/userController');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API to manage users (Admin only)
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Retrieve a list of users (Admin only)
 *     tags: [Users]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: A list of users.
 */
router.get('/', auth, getUsers);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user and generate API Key (Admin only)
 *     tags: [Users]
 *     security:
 *       - ApiKeyAuth: []
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
 *                 description: User's name
 *     responses:
 *       201:
 *         description: Created user with API key
 */
router.post('/', auth, createUser);

module.exports = router;
