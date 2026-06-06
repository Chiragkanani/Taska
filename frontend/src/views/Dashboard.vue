<script setup>
import { reactive, ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useTodoStore } from '../stores/todos';
import { useToastStore } from '../stores/toast';

const auth = useAuthStore();
const todoStore = useTodoStore();
const toast = useToastStore();
const router = useRouter();

const form = reactive({ title: '', description: '' });
const creating = ref(false);
const togglingId = ref(null);
const deletingId = ref(null);
const filter = ref('all');

const initials = computed(() => {
  const name = auth.user?.name || '';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
});

const filteredTodos = computed(() => {
  if (filter.value === 'active') {
    return todoStore.items.filter((t) => !t.is_completed);
  }
  if (filter.value === 'completed') {
    return todoStore.items.filter((t) => t.is_completed);
  }
  return todoStore.items;
});

onMounted(async () => {
  const result = await todoStore.fetchTodos();
  if (!result.success) toast.error(result.message);
});

async function handleCreate() {
  if (!form.title.trim()) {
    toast.error('Please enter a title');
    return;
  }
  creating.value = true;
  const result = await todoStore.createTodo({
    title: form.title.trim(),
    description: form.description.trim(),
  });
  creating.value = false;
  if (result.success) {
    toast.success('Todo added');
    form.title = '';
    form.description = '';
  } else {
    toast.error(result.message);
  }
}

async function handleToggle(todo) {
  togglingId.value = todo.id;
  const result = await todoStore.toggleTodo(todo);
  togglingId.value = null;
  if (!result.success) toast.error(result.message);
}

async function handleDelete(todo) {
  deletingId.value = todo.id;
  const result = await todoStore.deleteTodo(todo.id);
  deletingId.value = null;
  if (result.success) {
    toast.success('Todo deleted');
  } else {
    toast.error(result.message);
  }
}

function handleLogout() {
  auth.logout();
  toast.info('Signed out');
  router.push('/login');
}

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
</script>

<template>
  <div class="min-h-full">
    <!-- Top bar -->
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
        <div class="flex items-center gap-2.5">
          <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-lg font-extrabold text-white">
            T
          </div>
          <span class="text-lg font-bold text-slate-900">Taska</span>
        </div>
        <div class="flex items-center gap-3">
          <div class="hidden text-right sm:block">
            <p class="text-sm font-semibold text-slate-900">{{ auth.user?.name }}</p>
            <p class="text-xs text-slate-500">{{ auth.user?.email }}</p>
          </div>
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
            {{ initials || 'U' }}
          </div>
          <button class="btn-secondary px-3 py-2" @click="handleLogout">Logout</button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <!-- Heading + stats -->
      <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Your tasks</h1>
          <p class="mt-1 text-sm text-slate-500">
            {{ todoStore.pendingCount }} pending &middot; {{ todoStore.completedCount }} completed
          </p>
        </div>
        <div class="inline-flex rounded-lg bg-slate-100 p-1 text-sm font-medium">
          <button
            v-for="f in ['all', 'active', 'completed']"
            :key="f"
            class="rounded-md px-3 py-1.5 capitalize transition"
            :class="filter === f ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
            @click="filter = f"
          >
            {{ f }}
          </button>
        </div>
      </div>

      <!-- Create form -->
      <form class="card mb-8 space-y-4 p-5" @submit.prevent="handleCreate">
        <div>
          <label class="label" for="title">Title</label>
          <input
            id="title"
            v-model="form.title"
            type="text"
            class="input"
            placeholder="What needs to be done?"
          />
        </div>
        <div>
          <label class="label" for="description">Description <span class="font-normal text-slate-400">(optional)</span></label>
          <textarea
            id="description"
            v-model="form.description"
            rows="2"
            class="input resize-none"
            placeholder="Add some details..."
          ></textarea>
        </div>
        <div class="flex justify-end">
          <button type="submit" class="btn-primary" :disabled="creating">
            <span v-if="creating" class="spinner"></span>
            {{ creating ? 'Adding...' : 'Add task' }}
          </button>
        </div>
      </form>

      <!-- Loading state -->
      <div v-if="todoStore.loading" class="flex items-center justify-center py-16 text-slate-400">
        <span class="spinner mr-2 text-brand-600"></span> Loading tasks...
      </div>

      <!-- Empty state -->
      <div
        v-else-if="filteredTodos.length === 0"
        class="card flex flex-col items-center justify-center px-6 py-16 text-center"
      >
        <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl">
          &#9776;
        </div>
        <p class="text-base font-semibold text-slate-700">No tasks here</p>
        <p class="mt-1 text-sm text-slate-500">
          {{ filter === 'all' ? 'Add your first task to get started.' : 'Nothing in this view.' }}
        </p>
      </div>

      <!-- Todo list -->
      <ul v-else class="space-y-3">
        <li
          v-for="todo in filteredTodos"
          :key="todo.id"
          class="card flex items-start gap-4 p-4 transition hover:shadow-md"
        >
          <button
            class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition"
            :class="todo.is_completed ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 hover:border-brand-500'"
            :disabled="togglingId === todo.id"
            @click="handleToggle(todo)"
            :aria-label="todo.is_completed ? 'Mark incomplete' : 'Mark complete'"
          >
            <span v-if="togglingId === todo.id" class="spinner h-3 w-3"></span>
            <svg v-else-if="todo.is_completed" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.3 3.29 6.8-6.79a1 1 0 011.4 0z" clip-rule="evenodd" />
            </svg>
          </button>

          <div class="min-w-0 flex-1">
            <p
              class="break-words font-semibold"
              :class="todo.is_completed ? 'text-slate-400 line-through' : 'text-slate-900'"
            >
              {{ todo.title }}
            </p>
            <p
              v-if="todo.description"
              class="mt-0.5 break-words text-sm"
              :class="todo.is_completed ? 'text-slate-400 line-through' : 'text-slate-600'"
            >
              {{ todo.description }}
            </p>
            <p class="mt-2 text-xs text-slate-400">{{ formatDate(todo.created_at) }}</p>
          </div>

          <button
            class="btn-danger shrink-0 px-3 py-2"
            :disabled="deletingId === todo.id"
            @click="handleDelete(todo)"
          >
            <span v-if="deletingId === todo.id" class="spinner h-3 w-3"></span>
            <span v-else>Delete</span>
          </button>
        </li>
      </ul>
    </main>
  </div>
</template>
