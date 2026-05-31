<template>
  <div class="timers-page">
    <header class="page-header">
      <div>
        <h1 class="title">Командный трекер</h1>

        <p class="user-info">
          {{ authStore.profile?.email }}
          <span v-if="authStore.profile?.role">
            · {{ roleLabel }}
          </span>
        </p>
      </div>

      <button
        class="logout-button"
        type="button"
        :disabled="authStore.isLoading"
        @click="handleLogout"
      >
        Выйти
      </button>
    </header>

    <TimersToolbar
      v-model:search-query="searchQuery"
      v-model:status-filter="statusFilter"
      :is-reorder-mode="isReorderMode"
      :can-reorder-pinned-timers="canReorderPinnedTimers"
      @toggle-reorder="toggleReorderMode"
    />

    <TimersTable
      :timers="visibleTimers"
      :is-reorder-mode="isReorderMode"
      :pinned-timer-ids="currentPinnedTimerIds"
      @toggle-pin="togglePinnedTimer"
      @reorder="handleReorder"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import TimersToolbar from '../components/timers/TimersToolbar.vue'
import TimersTable from '../components/timers/TimersTable.vue'
import { useAuthStore } from '../stores/auth'
import { useTimersStore } from '../stores/timers'
import { usePinnedTimers } from '../composables/usePinnedTimers'
import { useNow } from '../utils/useNow'
import { isTimerCompleted } from '../utils/completedTimers'
import type { Timer, TimerViewStatus } from '../types/timer'

type StatusFilter = 'all' | 'active'

const router = useRouter()
const authStore = useAuthStore()
const timersStore = useTimersStore()
const { now } = useNow()

onMounted(async () => {
  await timersStore.loadTimers()
})

const {
  pinnedTimerIds,
  pinnedCount,
  isTimerPinned,
  togglePinnedTimer,
  reorderPinnedTimers,
} = usePinnedTimers()

const pageOpenedAt = Date.now()

const searchQuery = ref('')
const statusFilter = ref<StatusFilter>('all')

const isReorderMode = ref(false)
const reorderDraftPinnedTimerIds = ref<string[]>([])

const canReorderPinnedTimers = computed(() => pinnedCount.value > 1)

const roleLabel = computed(() => {
  if (authStore.profile?.role === 'admin') return 'admin'
  if (authStore.profile?.role === 'manager') return 'manager'
  if (authStore.profile?.role === 'member') return 'member'

  return 'Пользователь'
})

const currentPinnedTimerIds = computed(() => {
  return isReorderMode.value
    ? reorderDraftPinnedTimerIds.value
    : pinnedTimerIds.value
})

const viewStatusPriority: Record<TimerViewStatus, number> = {
  signal: 0,
  warning: 1,
  active: 2,
  stopped: 3,
  completed: 4,
}

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

function getEffectiveDuration(timer: Timer) {
  return Math.max(0, timer.durationSeconds - timer.timeShiftSeconds)
}

function getEffectiveMinDuration(timer: Timer) {
  if (timer.minDurationSeconds === null) return null

  return Math.max(0, timer.minDurationSeconds - timer.timeShiftSeconds)
}

function getElapsed(timer: Timer) {
  const startedAtMs = new Date(timer.startedAt).getTime()

  return Math.floor((now.value - startedAtMs) / 1000)
}

function getRemaining(timer: Timer) {
  if (timer.status === 'stopped') return 0

  return getEffectiveDuration(timer) - getElapsed(timer)
}

function isMinDurationReached(timer: Timer) {
  if (timer.status === 'stopped') return false

  const effectiveMinDuration = getEffectiveMinDuration(timer)

  if (effectiveMinDuration === null) return false

  const elapsed = getElapsed(timer)
  const effectiveDuration = getEffectiveDuration(timer)

  return elapsed >= effectiveMinDuration && elapsed < effectiveDuration
}

function getViewStatus(timer: Timer): TimerViewStatus {
  if (timer.status === 'stopped') return 'stopped'

  const remaining = getRemaining(timer)

  if (remaining <= 0) {
    const finishedAt =
      new Date(timer.startedAt).getTime() + getEffectiveDuration(timer) * 1000

    if (finishedAt <= pageOpenedAt) {
      return 'completed'
    }

    if (isTimerCompleted(timer.id, timer.startedAt)) {
      return 'completed'
    }

    return 'signal'
  }

  if (isMinDurationReached(timer)) {
    return 'warning'
  }

  return 'active'
}

function sortPinnedTimers(timers: Timer[], pinnedIds: string[]) {
  const timerMap = new Map(timers.map(timer => [timer.id, timer]))

  return pinnedIds
    .map(timerId => timerMap.get(timerId))
    .filter((timer): timer is Timer => Boolean(timer))
}

function sortUnpinnedTimers(timers: Timer[]) {
  return [...timers].sort((a, b) => {
    const aViewStatus = getViewStatus(a)
    const bViewStatus = getViewStatus(b)

    const statusDifference =
      viewStatusPriority[aViewStatus] - viewStatusPriority[bViewStatus]

    if (statusDifference !== 0) {
      return statusDifference
    }

    const remainingDifference = getRemaining(a) - getRemaining(b)

    if (remainingDifference !== 0) {
      return remainingDifference
    }

    return a.title.localeCompare(b.title, 'ru')
  })
}

const filteredTimers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return timersStore.timers.filter(timer => {
    const viewStatus = getViewStatus(timer)

    if (statusFilter.value === 'active') {
      if (
        viewStatus !== 'active' &&
        viewStatus !== 'warning' &&
        viewStatus !== 'signal'
      ) {
        return false
      }
    }

    if (!query) return true

    return (
      timer.title.toLowerCase().includes(query) ||
      timer.description.toLowerCase().includes(query)
    )
  })
})

const visibleTimers = computed(() => {
  if (isReorderMode.value) {
    return sortPinnedTimers(timersStore.timers, reorderDraftPinnedTimerIds.value)
  }

  const pinnedTimers = sortPinnedTimers(filteredTimers.value, pinnedTimerIds.value)
  const unpinnedTimers = sortUnpinnedTimers(
    filteredTimers.value.filter(timer => !isTimerPinned(timer.id)),
  )

  return [...pinnedTimers, ...unpinnedTimers]
})

function toggleReorderMode() {
  if (!canReorderPinnedTimers.value) return

  if (isReorderMode.value) {
    reorderPinnedTimers(reorderDraftPinnedTimerIds.value)
    reorderDraftPinnedTimerIds.value = []
    isReorderMode.value = false
    return
  }

  searchQuery.value = ''
  statusFilter.value = 'all'

  reorderDraftPinnedTimerIds.value = [...pinnedTimerIds.value]
  isReorderMode.value = true
}

function handleReorder(nextTimers: Timer[]) {
  reorderDraftPinnedTimerIds.value = nextTimers.map(timer => timer.id)
}
</script>

<style scoped>
.timers-page {
  width: 100%;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin: 0 0 24px;
}

.title {
  margin: 0;
  color: #111827;
  font-size: 28px;
  font-weight: 700;
}

.user-info {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.logout-button {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #111827;
  cursor: pointer;
}

.logout-button:hover:not(:disabled) {
  background: #f9fafb;
}

.logout-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>