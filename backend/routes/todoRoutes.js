const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/authMiddleware');
const {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
} = require('../controllers/todoController');

const router = express.Router();

// All todo routes require a valid JWT.
router.use(auth);

router.get('/', getTodos);

router.post(
  '/',
  [body('title').trim().notEmpty().withMessage('Title is required')],
  createTodo
);

router.put(
  '/:id',
  [
    body('title')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Title cannot be empty'),
    body('is_completed')
      .optional()
      .isBoolean()
      .withMessage('is_completed must be a boolean'),
  ],
  updateTodo
);

router.delete('/:id', deleteTodo);

module.exports = router;
