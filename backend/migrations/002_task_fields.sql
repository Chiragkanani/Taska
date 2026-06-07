-- Migration 002: add priority, due_date, and updated_at to todos.
-- Safe to run on an existing deployment; only adds columns/indexes.
--
-- Apply with:
--   mysql -u root -p taska < backend/migrations/002_task_fields.sql
-- or from a MySQL shell:
--   USE taska; SOURCE backend/migrations/002_task_fields.sql;

USE taska;

-- priority: low | medium | high (defaults to medium for existing rows)
ALTER TABLE todos
  ADD COLUMN priority ENUM('low','medium','high') NOT NULL DEFAULT 'medium' AFTER is_completed;

-- optional due date
ALTER TABLE todos
  ADD COLUMN due_date DATE NULL AFTER priority;

-- track last update (back-fills existing rows with their created_at)
ALTER TABLE todos
  ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

UPDATE todos SET updated_at = created_at WHERE updated_at IS NOT NULL;

-- helps when sorting/filtering by due date
CREATE INDEX idx_todos_due_date ON todos (due_date);
