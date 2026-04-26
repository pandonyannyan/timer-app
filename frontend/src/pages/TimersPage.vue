<template>
  <div class="timers-page">
    <h1 class="title">Командный трекер</h1>

    <TimersToolbar
      v-model:search-query="searchQuery"
      v-model:status-filter="statusFilter"
      :is-reorder-mode="isReorderMode"
      @toggle-reorder="toggleReorderMode"
    />

    <TimersTable
      :timers="visibleTimers"
      :sort-by="sortBy"
      :sort-direction="sortDirection"
      :is-reorder-mode="isReorderMode"
      @change-sort="changeSort"
      @reorder="handleReorder"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import TimersToolbar from '../components/timers/TimersToolbar.vue'
import TimersTable from '../components/timers/TimersTable.vue'
import { useTimersStore } from '../stores/timers'
import { useNow } from '../utils/useNow'
import { isTimerCompleted } from '../utils/completedTimers'
import type { Timer, TimerViewStatus } from '../types/timer'

type StatusFilter = 'all' | 'active'
type SortBy = 'title' | 'remaining'
type SortDirection = 'asc' | 'desc'

const timersStore = useTimersStore()
const { now } = useNow()

const pageOpenedAt = Date.now()

const searchQuery = ref('')
const statusFilter = ref<StatusFilter>('all')
const sortBy = ref<SortBy | null>(null)
const sortDirection = ref<SortDirection>('asc')

const isReorderMode = ref(false)
const reorderDraftTimers = ref<Timer[]>([])

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

    if (isTimerCompleted(timer.id)) {
      return 'completed'
    }

    return 'signal'
  }

  return 'active'
}

function sortTimersByOrder(timers: Timer[]) {
  return [...timers].sort((a, b) => a.sortOrder - b.sortOrder)
}

const visibleTimers = computed(() => {
  if (isReorderMode.value) {
    return reorderDraftTimers.value
  }

  const query = searchQuery.value.trim().toLowerCase()

  let result = timersStore.timers.filter(timer => {
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

  if (sortBy.value) {
    result = [...result].sort((a, b) => {
      let compare = 0

      if (sortBy.value === 'title') {
        compare = a.title.localeCompare(b.title, 'ru')
      }

      if (sortBy.value === 'remaining') {
        compare = getRemaining(a) - getRemaining(b)
      }

      return sortDirection.value === 'asc' ? compare : -compare
    })

    return result
  }

  return sortTimersByOrder(result)
})

function changeSort(nextSortBy: SortBy) {
  if (isReorderMode.value) return

  if (sortBy.value === nextSortBy) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }

  sortBy.value = nextSortBy
  sortDirection.value = 'asc'
}

function toggleReorderMode() {
  if (isReorderMode.value) {
    timersStore.reorderTimers(reorderDraftTimers.value.map(timer => timer.id))
    reorderDraftTimers.value = []
    isReorderMode.value = false
    return
  }

  searchQuery.value = ''
  statusFilter.value = 'all'
  sortBy.value = null
  sortDirection.value = 'asc'

  reorderDraftTimers.value = sortTimersByOrder(timersStore.timers)
  isReorderMode.value = true
}

function handleReorder(nextTimers: Timer[]) {
  reorderDraftTimers.value = nextTimers
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