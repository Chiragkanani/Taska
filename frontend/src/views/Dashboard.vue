<script setup>
import { reactive, ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useTodoStore } from '../stores/todos';
import { useToastStore } from '../stores/toast';
import TaskCard from '../components/TaskCard.vue';

const auth = useAuthStore();
const todoStore = useTodoStore();
const toast = useToastStore();
const router = useRouter();

const form = reactive({ title: '', description: '', priority: 'medium', due_date: '' });
const creating = ref(false);
const togglingId = ref(null);
const savingId = ref(null);
const deletingId = ref(null);

const filter = ref('all');
const search = ref('');
const sort = ref('smart');

const initials = computed(() => {
  const name = auth.user?.name || '';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
});

const priorityRank = { high: 0, medium: 1, low: 2 };

const visibleTodos = computed(() => {
  let list = [...todoStore.items];

  if (filter.value === 'active') list = list.filter((t) => !t.is_completed);
  if (filter.value === 'completed') list = list.filter((t) => t.is_completed);

  const q = search.value.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q)
    );
  }

  const far = '9999-12-31';
  if (sort.value === 'due') {
    list.sort((a, b) => (a.due_date || far).localeCompare(b.due_date || far));
  } else if (sort.value === 'priority') {
    list.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
  } else if (sort.value === 'newest') {
    list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  } else if (sort.value === 'oldest') {
    list.sort((a, b) => a.created_at.localeCompare(b.created_at));
  } else {
    // smart: incomplete first, then soonest due, then priority
    list.sort((a, b) => {
      if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
      const due = (a.due_date || far).localeCompare(b.due_date || far);
      if (due !== 0) return due;
      return priorityRank[a.priority] - priorityRank[b.priority];
    });
  }

  return list;
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
    priority: form.priority,
    due_date: form.due_date || null,
  });
  creating.value = false;
  if (result.success) {
    toast.success('Task added');
    form.title = '';
    form.description = '';
    form.priority = 'medium';
    form.due_date = '';
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

async function handleSave(todo, payload) {
  savingId.value = todo.id;
  const result = await todoStore.updateTodo(todo.id, payload);
  savingId.value = null;
  if (result.success) {
    toast.success('Task updated');
  } else {
    toast.error(result.message);
  }
}

async function handleDelete(todo) {
  deletingId.value = todo.id;
  const result = await todoStore.deleteTodo(todo.id);
  deletingId.value = null;
  if (result.success) {
    toast.success('Task deleted');
  } else {
    toast.error(result.message);
  }
}

function handleLogout() {
  auth.logout();
  toast.info('Signed out');
  router.push('/login');
}
</script>

<template>
  <div class="min-h-full">
    <!-- Top bar -->
    <header class="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-3.5 sm:px-6">
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
      <!-- Greeting -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900">
          Hi {{ (auth.user?.name || 'there').split(' ')[0] }} 👋
        </h1>
        <p class="mt-1 text-sm text-slate-500">Here's what's on your plate.</p>
      </div>

      <!-- Stats -->
      <div class="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="stat-card">
          <span class="text-xs font-medium text-slate-500">Total</span>
          <span class="text-2xl font-bold text-slate-900">{{ todoStore.items.length }}</span>
        </div>
        <div class="stat-card">
          <span class="text-xs font-medium text-slate-500">Pending</span>
          <span class="text-2xl font-bold text-brand-600">{{ todoStore.pendingCount }}</span>
        </div>
        <div class="stat-card">
          <span class="text-xs font-medium text-slate-500">Completed</span>
          <span class="text-2xl font-bold text-emerald-600">{{ todoStore.completedCount }}</span>
        </div>
        <div class="stat-card">
          <span class="text-xs font-medium text-slate-500">Overdue</span>
          <span class="text-2xl font-bold" :class="todoStore.overdueCount ? 'text-red-600' : 'text-slate-900'">
            {{ todoStore.overdueCount }}
          </span>
        </div>
      </div>

      <!-- Create form -->
      <form class="card mb-6 space-y-4 p-5" @submit.prevent="handleCreate">
        <div>
          <label class="label" for="title">New task</label>
          <input
            id="title"
            v-model="form.title"
            type="text"
            class="input"
            placeholder="What needs to be done?"
          />
        </div>
        <textarea
          v-model="form.description"
          rows="2"
          class="input resize-none"
          placeholder="Add some details... (optional)"
        ></textarea>
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div class="flex-1">
            <label class="label" for="priority">Priority</label>
            <select id="priority" v-model="form.priority" class="select">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div class="flex-1">
            <label class="label" for="due">Due date</label>
            <input id="due" v-model="form.due_date" type="date" class="input" />
          </div>
          <button type="submit" class="btn-primary sm:px-6" :disabled="creating">
            <span v-if="creating" class="spinner"></span>
            {{ creating ? 'Adding...' : 'Add task' }}
          </button>
        </div>
      </form>

      <!-- Toolbar -->
      <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="relative sm:max-w-xs sm:flex-1">
          <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 103.4 9.82l3.14 3.14a1 1 0 001.42-1.42l-3.14-3.14A5.5 5.5 0 009 3.5zM5.5 9a3.5 3.5 0 117 0 3.5 3.5 0 01-7 0z" clip-rule="evenodd" />
          </svg>
          <input v-model="search" type="text" class="input pl-9" placeholder="Search tasks..." />
        </div>
        <div class="flex items-center gap-2">
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
          <select v-model="sort" class="select w-auto py-1.5 text-sm">
            <option value="smart">Smart</option>
            <option value="due">Due date</option>
            <option value="priority">Priority</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="todoStore.loading" class="flex items-center justify-center py-16 text-slate-400">
        <span class="spinner mr-2 text-brand-600"></span> Loading tasks...
      </div>

      <!-- Empty state -->
      <div
        v-else-if="visibleTodos.length === 0"
        class="card flex flex-col items-center justify-center px-6 py-16 text-center"
      >
        <div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl">
          &#9776;
        </div>
        <p class="text-base font-semibold text-slate-700">No tasks here</p>
        <p class="mt-1 text-sm text-slate-500">
          {{ search ? 'No tasks match your search.' : filter === 'all' ? 'Add your first task to get started.' : 'Nothing in this view.' }}
        </p>
      </div>

      <!-- Todo list -->
      <ul v-else class="space-y-3">
        <TaskCard
          v-for="todo in visibleTodos"
          :key="todo.id"
          :todo="todo"
          :toggling="togglingId === todo.id"
          :saving="savingId === todo.id"
          :deleting="deletingId === todo.id"
          @toggle="handleToggle"
          @save="handleSave"
          @delete="handleDelete"
        />
      </ul>
    </main>
  </div>
</template>
