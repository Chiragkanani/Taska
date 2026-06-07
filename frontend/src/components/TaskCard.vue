<script setup>
import { reactive, ref, computed } from 'vue';

const props = defineProps({
  todo: { type: Object, required: true },
  toggling: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  deleting: { type: Boolean, default: false },
});

const emit = defineEmits(['toggle', 'save', 'delete']);

const editing = ref(false);
const confirmingDelete = ref(false);
const form = reactive({ title: '', description: '', priority: 'medium', due_date: '' });

const priorityMeta = {
  high: { label: 'High', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  medium: { label: 'Medium', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  low: { label: 'Low', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
};

const meta = computed(() => priorityMeta[props.todo.priority] || priorityMeta.medium);

const today = new Date().toISOString().slice(0, 10);
const isOverdue = computed(
  () => !props.todo.is_completed && props.todo.due_date && props.todo.due_date < today
);
const isDueToday = computed(
  () => !props.todo.is_completed && props.todo.due_date === today
);

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const dueLabel = computed(() => {
  if (!props.todo.due_date) return '';
  if (isDueToday.value) return 'Due today';
  if (isOverdue.value) return `Overdue · ${formatDate(props.todo.due_date)}`;
  return `Due ${formatDate(props.todo.due_date)}`;
});

function startEdit() {
  form.title = props.todo.title;
  form.description = props.todo.description || '';
  form.priority = props.todo.priority || 'medium';
  form.due_date = props.todo.due_date || '';
  confirmingDelete.value = false;
  editing.value = true;
}

function cancelEdit() {
  editing.value = false;
}

function submitEdit() {
  if (!form.title.trim()) return;
  emit('save', props.todo, {
    title: form.title.trim(),
    description: form.description.trim(),
    priority: form.priority,
    due_date: form.due_date || null,
  });
  editing.value = false;
}
</script>

<template>
  <li
    class="card p-4 transition hover:shadow-md"
    :class="isOverdue ? 'ring-red-200' : ''"
  >
    <!-- Edit mode -->
    <form v-if="editing" class="space-y-3" @submit.prevent="submitEdit">
      <input v-model="form.title" type="text" class="input" placeholder="Task title" />
      <textarea
        v-model="form.description"
        rows="2"
        class="input resize-none"
        placeholder="Description (optional)"
      ></textarea>
      <div class="flex flex-col gap-3 sm:flex-row">
        <div class="flex-1">
          <label class="label">Priority</label>
          <select v-model="form.priority" class="select">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div class="flex-1">
          <label class="label">Due date</label>
          <input v-model="form.due_date" type="date" class="input" />
        </div>
      </div>
      <div class="flex justify-end gap-2">
        <button type="button" class="btn-secondary px-3 py-2" @click="cancelEdit">Cancel</button>
        <button type="submit" class="btn-primary px-4 py-2" :disabled="saving">
          <span v-if="saving" class="spinner"></span>
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </form>

    <!-- Display mode -->
    <div v-else class="flex items-start gap-4">
      <button
        class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition"
        :class="todo.is_completed ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 hover:border-brand-500'"
        :disabled="toggling"
        @click="emit('toggle', todo)"
        :aria-label="todo.is_completed ? 'Mark incomplete' : 'Mark complete'"
      >
        <span v-if="toggling" class="spinner h-3 w-3"></span>
        <svg v-else-if="todo.is_completed" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.3 3.29 6.8-6.79a1 1 0 011.4 0z" clip-rule="evenodd" />
        </svg>
      </button>

      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <p
            class="break-words font-semibold"
            :class="todo.is_completed ? 'text-slate-400 line-through' : 'text-slate-900'"
          >
            {{ todo.title }}
          </p>
          <span class="badge" :class="meta.badge">
            <span class="h-1.5 w-1.5 rounded-full" :class="meta.dot"></span>
            {{ meta.label }}
          </span>
        </div>

        <p
          v-if="todo.description"
          class="mt-0.5 break-words text-sm"
          :class="todo.is_completed ? 'text-slate-400 line-through' : 'text-slate-600'"
        >
          {{ todo.description }}
        </p>

        <div class="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span
            v-if="todo.due_date"
            class="chip"
            :class="isOverdue
              ? 'bg-red-50 text-red-600'
              : isDueToday
                ? 'bg-amber-50 text-amber-700'
                : 'bg-slate-100 text-slate-600'"
          >
            <svg class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M6 2a1 1 0 011 1v1h6V3a1 1 0 112 0v1h1a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h1V3a1 1 0 011-1zM4 8v7h12V8H4z" clip-rule="evenodd" />
            </svg>
            {{ dueLabel }}
          </span>
          <span class="text-slate-400">Added {{ formatDate(todo.created_at) }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex shrink-0 items-center gap-1">
        <template v-if="confirmingDelete">
          <button
            class="btn-danger px-3 py-2"
            :disabled="deleting"
            @click="emit('delete', todo)"
          >
            <span v-if="deleting" class="spinner h-3 w-3"></span>
            <span v-else>Confirm</span>
          </button>
          <button class="btn-secondary px-3 py-2" @click="confirmingDelete = false">Cancel</button>
        </template>
        <template v-else>
          <button
            class="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-brand-600"
            aria-label="Edit task"
            @click="startEdit"
          >
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-8.5 8.5a2 2 0 01-.878.51l-3 .857a.5.5 0 01-.617-.617l.857-3a2 2 0 01.51-.878l8.5-8.5z" />
            </svg>
          </button>
          <button
            class="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
            aria-label="Delete task"
            @click="confirmingDelete = true"
          >
            <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2h12a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM6 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </button>
        </template>
      </div>
    </div>
  </li>
</template>
