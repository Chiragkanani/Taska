<script setup>
import { useToastStore } from '../stores/toast';

const toast = useToastStore();

const styles = {
  success: 'bg-emerald-600',
  error: 'bg-red-600',
  info: 'bg-slate-800',
};
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
    <transition-group name="toast" tag="div" class="flex w-full max-w-sm flex-col gap-2">
      <div
        v-for="t in toast.toasts"
        :key="t.id"
        :class="styles[t.type]"
        class="pointer-events-auto flex items-start justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg"
      >
        <span>{{ t.message }}</span>
        <button
          class="shrink-0 text-white/80 hover:text-white"
          @click="toast.dismiss(t.id)"
          aria-label="Dismiss"
        >
          &times;
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-12px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
