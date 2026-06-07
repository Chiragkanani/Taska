const { validationResult } = require('express-validator');
const db = require('../config/db');

const TODO_COLUMNS =
  'id, user_id, title, description, is_completed, priority, due_date, created_at, updated_at';

// Normalize a DB row into the JSON shape the client expects.
function serializeTodo(row) {
  return { ...row, is_completed: !!row.is_completed };
}

// Coerce an incoming due_date into 'YYYY-MM-DD' or null.
function normalizeDueDate(value) {
  if (value === undefined || value === null || value === '') return null;
  return String(value).slice(0, 10);
}

// GET /api/todos
exports.getTodos = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ${TODO_COLUMNS} FROM todos
       WHERE user_id = ?
       ORDER BY is_completed ASC,
                CASE WHEN due_date IS NULL THEN 1 ELSE 0 END,
                due_date ASC,
                FIELD(priority, 'high', 'medium', 'low'),
                created_at DESC`,
      [req.user.id]
    );

    return res.json({
      success: true,
      message: 'Todos fetched successfully',
      data: { todos: rows.map(serializeTodo) },
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

  const { title, description, priority, due_date } = req.body;

  try {
    const [result] = await db.query(
      'INSERT INTO todos (user_id, title, description, priority, due_date) VALUES (?, ?, ?, ?, ?)',
      [
        req.user.id,
        title,
        description || null,
        priority || 'medium',
        normalizeDueDate(due_date),
      ]
    );

    const [rows] = await db.query(
      `SELECT ${TODO_COLUMNS} FROM todos WHERE id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Todo created successfully',
      data: { todo: serializeTodo(rows[0]) },
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
  const { title, description, is_completed, priority, due_date } = req.body;

  try {
    const [existing] = await db.query(
      `SELECT ${TODO_COLUMNS} FROM todos WHERE id = ? AND user_id = ?`,
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
    const newPriority = priority !== undefined ? priority : current.priority;
    const newDueDate =
      due_date !== undefined ? normalizeDueDate(due_date) : current.due_date;

    await db.query(
      `UPDATE todos
       SET title = ?, description = ?, is_completed = ?, priority = ?, due_date = ?
       WHERE id = ? AND user_id = ?`,
      [
        newTitle,
        newDescription,
        newCompleted,
        newPriority,
        newDueDate,
        todoId,
        req.user.id,
      ]
    );

    const [rows] = await db.query(
      `SELECT ${TODO_COLUMNS} FROM todos WHERE id = ?`,
      [todoId]
    );

    return res.json({
      success: true,
      message: 'Todo updated successfully',
      data: { todo: serializeTodo(rows[0]) },
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
