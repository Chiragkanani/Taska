const { validationResult } = require('express-validator');
const db = require('../config/db');

// GET /api/todos
exports.getTodos = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, user_id, title, description, is_completed, created_at FROM todos WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    const todos = rows.map((t) => ({ ...t, is_completed: !!t.is_completed }));

    return res.json({
      success: true,
      message: 'Todos fetched successfully',
      data: { todos },
    });
  } catch (err) {
    console.error('Get todos error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch todos',
      data: {},
    });
  }
};

// POST /api/todos
exports.createTodo = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: errors.array()[0].msg,
      data: { errors: errors.array() },
    });
  }

  const { title, description } = req.body;

  try {
    const [result] = await db.query(
      'INSERT INTO todos (user_id, title, description) VALUES (?, ?, ?)',
      [req.user.id, title, description || null]
    );

    const [rows] = await db.query(
      'SELECT id, user_id, title, description, is_completed, created_at FROM todos WHERE id = ?',
      [result.insertId]
    );

    const todo = { ...rows[0], is_completed: !!rows[0].is_completed };

    return res.status(201).json({
      success: true,
      message: 'Todo created successfully',
      data: { todo },
    });
  } catch (err) {
    console.error('Create todo error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to create todo',
      data: {},
    });
  }
};

// PUT /api/todos/:id
exports.updateTodo = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: errors.array()[0].msg,
      data: { errors: errors.array() },
    });
  }

  const todoId = req.params.id;
  const { title, description, is_completed } = req.body;

  try {
    const [existing] = await db.query(
      'SELECT id, title, description, is_completed FROM todos WHERE id = ? AND user_id = ?',
      [todoId, req.user.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found',
        data: {},
      });
    }

    const current = existing[0];
    const newTitle = title !== undefined ? title : current.title;
    const newDescription =
      description !== undefined ? description : current.description;
    const newCompleted =
      is_completed !== undefined ? (is_completed ? 1 : 0) : current.is_completed;

    await db.query(
      'UPDATE todos SET title = ?, description = ?, is_completed = ? WHERE id = ? AND user_id = ?',
      [newTitle, newDescription, newCompleted, todoId, req.user.id]
    );

    const [rows] = await db.query(
      'SELECT id, user_id, title, description, is_completed, created_at FROM todos WHERE id = ?',
      [todoId]
    );

    const todo = { ...rows[0], is_completed: !!rows[0].is_completed };

    return res.json({
      success: true,
      message: 'Todo updated successfully',
      data: { todo },
    });
  } catch (err) {
    console.error('Update todo error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update todo',
      data: {},
    });
  }
};

// DELETE /api/todos/:id
exports.deleteTodo = async (req, res) => {
  const todoId = req.params.id;

  try {
    const [result] = await db.query(
      'DELETE FROM todos WHERE id = ? AND user_id = ?',
      [todoId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found',
        data: {},
      });
    }

    return res.json({
      success: true,
      message: 'Todo deleted successfully',
      data: {},
    });
  } catch (err) {
    console.error('Delete todo error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete todo',
      data: {},
    });
  }
};
