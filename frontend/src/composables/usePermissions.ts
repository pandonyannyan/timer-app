import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'

export function usePermissions() {
  const authStore = useAuthStore()

  const currentRole = computed(() => authStore.role)

  const canManageTimers = computed(() => {
    return currentRole.value === 'admin' || currentRole.value === 'manager'
  })

  return {
    currentRole,

    // Доступно всем авторизованным активным пользователям
    canRestartTimer: computed(() => authStore.isAuthenticated && authStore.isActiveUser),
    canStopTimer: computed(() => authStore.isAuthenticated && authStore.isActiveUser),

    // admin + manager
    canCreateTimer: canManageTimers,
    canEditTimer: canManageTimers,
    canDeleteTimer: canManageTimers,

    // на будущее, для раздела пользователей
    canManageUsers: computed(() => {
      return currentRole.value === 'admin'
    }),
  }
}