import { createRouter, createWebHistory } from 'vue-router'
import TimersPage from '../pages/TimersPage.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'timers',
      component: TimersPage,
    },
  ],
})
