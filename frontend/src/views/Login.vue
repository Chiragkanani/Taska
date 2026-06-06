<script setup>
import { reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useToastStore } from '../stores/toast';

const auth = useAuthStore();
const toast = useToastStore();
const router = useRouter();
const route = useRoute();

const form = reactive({ email: '', password: '' });

async function handleSubmit() {
  const result = await auth.login({ ...form });
  if (result.success) {
    toast.success('Welcome back!');
    router.push(route.query.redirect || '/dashboard');
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
        <h1 class="text-2xl font-bold text-slate-900">Welcome back</h1>
        <p class="mt-1 text-sm text-slate-500">Sign in to continue to Taska</p>
      </div>

      <form class="card space-y-5 p-7" @submit.prevent="handleSubmit">
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
            autocomplete="current-password"
            class="input"
            placeholder="********"
          />
        </div>

        <button type="submit" class="btn-primary w-full" :disabled="auth.loading">
          <span v-if="auth.loading" class="spinner"></span>
          {{ auth.loading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-slate-500">
        Don't have an account?
        <router-link to="/register" class="font-semibold text-brand-600 hover:text-brand-700">
          Create one
        </router-link>
      </p>
    </div>
  </div>
</template>
