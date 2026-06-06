<script setup>
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useToastStore } from '../stores/toast';

const auth = useAuthStore();
const toast = useToastStore();
const router = useRouter();

const form = reactive({ name: '', email: '', password: '' });

async function handleSubmit() {
  if (form.password.length < 6) {
    toast.error('Password must be at least 6 characters');
    return;
  }
  const result = await auth.register({ ...form });
  if (result.success) {
    toast.success('Account created successfully!');
    router.push('/dashboard');
  } else {
    toast.error(result.message);
  }
}
</script>

<template>
  <div class="flex min-h-full items-center justify-center bg-gradient-to-br from-brand-50 via-slate-50 to-white px-4 py-12">
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-xl font-extrabold text-white shadow-lg shadow-brand-600/30">
          T
        </div>
        <h1 class="text-2xl font-bold text-slate-900">Create your account</h1>
        <p class="mt-1 text-sm text-slate-500">Start organizing your tasks with Taska</p>
      </div>

      <form class="card space-y-5 p-7" @submit.prevent="handleSubmit">
        <div>
          <label class="label" for="name">Full name</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            autocomplete="name"
            class="input"
            placeholder="Jane Doe"
          />
        </div>

        <div>
          <label class="label" for="email">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            autocomplete="email"
            class="input"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label class="label" for="password">Password</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            autocomplete="new-password"
            class="input"
            placeholder="At least 6 characters"
          />
        </div>

        <button type="submit" class="btn-primary w-full" :disabled="auth.loading">
          <span v-if="auth.loading" class="spinner"></span>
          {{ auth.loading ? 'Creating account...' : 'Create account' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-slate-500">
        Already have an account?
        <router-link to="/login" class="font-semibold text-brand-600 hover:text-brand-700">
          Sign in
        </router-link>
      </p>
    </div>
  </div>
</template>
