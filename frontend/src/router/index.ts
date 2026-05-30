import { createRouter, createWebHistory } from 'vue-router'
import TimersPage from '../pages/TimersPage.vue'
import LoginTestPage from '../pages/LoginTestPage.vue'
import LoginPage from '../pages/LoginPage.vue'
import { useAuthStore } from '../stores/auth'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'timers',
      component: TimersPage,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/login-test',
      name: 'login-test',
      component: LoginTestPage,
      meta: {
        public: true,
      },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
      meta: {
        public: true,
      },
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (!authStore.isInitialized) {
    await authStore.initialize()
  }

  const isPublicRoute = to.meta.public === true
  const requiresAuth = to.meta.requiresAuth === true

  if (requiresAuth && !authStore.isAuthenticated) {
    return {
      path: '/login',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  if (to.name === 'login' && authStore.isAuthenticated) {
    return '/'
  }

  if (!isPublicRoute && !requiresAuth) {
    return '/'
  }

  return true
})