import { defineStore } from 'pinia';

let nextId = 1;

export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: [],
  }),
  actions: {
    push(message, type = 'info', timeout = 3500) {
      const id = nextId++;
      this.toasts.push({ id, message, type });
      if (timeout > 0) {
        setTimeout(() => this.dismiss(id), timeout);
      }
      return id;
    },
    success(message) {
      return this.push(message, 'success');
    },
    error(message) {
      return this.push(message, 'error');
    },
    info(message) {
      return this.push(message, 'info');
    },
    dismiss(id) {
      this.toasts = this.toasts.filter((t) => t.id !== id);
    },
  },
});
