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

    async toggleTodo(todo) {
      try {
        const { data } = await api.put(`/todos/${todo.id}`, {
          is_completed: !todo.is_completed,
        });
        const idx = this.items.findIndex((t) => t.id === todo.id);
        if (idx !== -1) this.items[idx] = data.data.todo;
        return { success: true };
      } catch (err) {
        return {
          success: false,
          message: err.response?.data?.message || 'Failed to update todo',
        };
      }
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
