import { computed, ref } from 'vue'

type UserRole = 'admin' | 'manager' | 'member'

// Для проверки прав можно временно менять роль:
//
// const currentRole = ref<UserRole>('admin')
// const currentRole = ref<UserRole>('manager')
// const currentRole = ref<UserRole>('member')
//
// Потом это место заменим на реальную роль пользователя из БД / auth.
const currentRole = ref<UserRole>('admin')

export function usePermissions() {
  const canManageTimers = computed(() => {
    return currentRole.value === 'admin' || currentRole.value === 'manager'
  })

  return {
    currentRole,

    // Доступно всем ролям
    canRestartTimer: computed(() => true),
    canStopTimer: computed(() => true),

    // admin + manager
    canCreateTimer: canManageTimers,
    canEditTimer: canManageTimers,
    canDeleteTimer: canManageTimers,

    // только admin
    canReorderTimers: computed(() => {
      return currentRole.value === 'admin'
    }),

    // на будущее, для раздела пользователей
    canManageUsers: computed(() => {
      return currentRole.value === 'admin'
    }),
  }
}