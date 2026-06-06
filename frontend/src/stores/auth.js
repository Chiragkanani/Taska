import { defineStore } from 'pinia';
import api from '../services/api';

function loadUser() {
  try {
    return JSON.parse(localStorage.getItem('taska_user')) || null;
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('taska_token') || null,
    user: loadUser(),
    loading: false,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    persist(token, user) {
      this.token = token;
      this.user = user;
      localStorage.setItem('taska_token', token);
      localStorage.setItem('taska_user', JSON.stringify(user));
    },

    async register(payload) {
      this.loading = true;
      try {
        const { data } = await api.post('/auth/register', payload);
        this.persist(data.data.token, data.data.user);
        return { success: true };
      } catch (err) {
        return {
          success: false,
          message: err.response?.data?.message || 'Registration failed',
        };
      } finally {
        this.loading = false;
      }
    },

    async login(payload) {
      this.loading = true;
      try {
        const { data } = await api.post('/auth/login', payload);
        this.persist(data.data.token, data.data.user);
        return { success: true };
      } catch (err) {
        return {
          success: false,
          message: err.response?.data?.message || 'Login failed',
        };
      } finally {
        this.loading = false;
      }
    },

    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('taska_token');
      localStorage.removeItem('taska_user');
    },
  },
});
