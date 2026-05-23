<template>
  <div class="timers-page">
    <h1 class="title">Командный трекер</h1>

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
import { computed, ref } from 'vue'
import TimersToolbar from '../components/timers/TimersToolbar.vue'
import TimersTable from '../components/timers/TimersTable.vue'
import { useTimersStore } from '../stores/timers'
import { usePinnedTimers } from '../composables/usePinnedTimers'
import { useNow } from '../utils/useNow'
import { isTimerCompleted } from '../utils/completedTimers'
import type { Timer, TimerViewStatus } from '../types/timer'

type StatusFilter = 'all' | 'active'

const timersStore = useTimersStore()
const { now } = useNow()

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

const currentPinnedTimerIds = computed(() => {
  return isReorderMode.value
    ? reorderDraftPinnedTimerIds.value
    : pinnedTimerIds.value
})

const viewStatusPriority: Record<TimerViewStatus, number> = {
  signal: 0,
  active: 1,
  stopped: 2,
  completed: 3,
}

function getRemaining(timer: Timer) {
  if (timer.status === 'stopped') return 0

  const effectiveDuration = timer.durationSeconds - timer.timeShiftSeconds
  const startedAtMs = new Date(timer.startedAt).getTime()
  const elapsed = Math.floor((now.value - startedAtMs) / 1000)

  return effectiveDuration - elapsed
}

function getViewStatus(timer: Timer): TimerViewStatus {
  if (timer.status === 'stopped') return 'stopped'

  const remaining = getRemaining(timer)

  if (remaining <= 0) {
    const finishedAt =
      new Date(timer.startedAt).getTime() + (timer.durationSeconds - timer.timeShiftSeconds) * 1000

    if (finishedAt <= pageOpenedAt) {
      return 'completed'
    }

    if (isTimerCompleted(timer.id, timer.startedAt)) {
      return 'completed'
    }

    return 'signal'
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
      if (viewStatus !== 'active' && viewStatus !== 'signal') {
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

.title {
  margin: 0 0 24px;
  color: #111827;
  font-size: 28px;
  font-weight: 700;
}
</style>