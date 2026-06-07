import { defineStore } from 'pinia';
import api from '../services/api';

export const useTodoStore = defineStore('todos', {
  state: () => ({
    items: [],
    loading: false,
  }),
  getters: {
    completedCount: (state) => state.items.filter((t) => t.is_completed).length,
    pendingCount: (state) => state.items.filter((t) => !t.is_completed).length,
    overdueCount: (state) => {
      const today = new Date().toISOString().slice(0, 10);
      return state.items.filter(
        (t) => !t.is_completed && t.due_date && t.due_date < today
      ).length;
    },
  },
  actions: {
    async fetchTodos() {
      this.loading = true;
      try {
        const { data } = await api.get('/todos');
        this.items = data.data.todos;
        return { success: true };
      } catch (err) {
        return {
          success: false,
          message: err.response?.data?.message || 'Failed to load todos',
        };
      } finally {
        this.loading = false;
      }
    },

    async createTodo(payload) {
      try {
        const { data } = await api.post('/todos', payload);
        this.items.unshift(data.data.todo);
        return { success: true };
      } catch (err) {
        return {
          success: false,
          message: err.response?.data?.message || 'Failed to create todo',
        };
      }
    },

    async updateTodo(id, payload) {
      try {
        const { data } = await api.put(`/todos/${id}`, payload);
        const idx = this.items.findIndex((t) => t.id === id);
        if (idx !== -1) this.items[idx] = data.data.todo;
        return { success: true };
      } catch (err) {
        return {
          success: false,
          message: err.response?.data?.message || 'Failed to update todo',
        };
      }
    },

    async toggleTodo(todo) {
      return this.updateTodo(todo.id, { is_completed: !todo.is_completed });
    },

    async deleteTodo(id) {
      try {
        await api.delete(`/todos/${id}`);
        this.items = this.items.filter((t) => t.id !== id);
        return { success: true };
      } catch (err) {
        return {
          success: false,
          message: err.response?.data?.message || 'Failed to delete todo',
        };
      }
    },
  },
});
