import { computed, ref, watch } from 'vue'

const STORAGE_KEY = 'timer-app:pinned-timer-ids'

const pinnedTimerIds = ref<string[]>(loadPinnedTimerIds())

function loadPinnedTimerIds(): string[] {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEY)

    if (!rawValue) {
      return []
    }

    const parsedValue = JSON.parse(rawValue)

    return Array.isArray(parsedValue)
      ? parsedValue.filter((value): value is string => typeof value === 'string')
      : []
  } catch {
    return []
  }
}

watch(
  pinnedTimerIds,
  (value) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  },
  { deep: true },
)

export function usePinnedTimers() {
  const pinnedCount = computed(() => pinnedTimerIds.value.length)

  function isTimerPinned(timerId: string): boolean {
    return pinnedTimerIds.value.includes(timerId)
  }

  function pinTimer(timerId: string): void {
    if (isTimerPinned(timerId)) {
      return
    }

    pinnedTimerIds.value = [...pinnedTimerIds.value, timerId]
  }

  function unpinTimer(timerId: string): void {
    pinnedTimerIds.value = pinnedTimerIds.value.filter((id) => id !== timerId)
  }

  function togglePinnedTimer(timerId: string): void {
    if (isTimerPinned(timerId)) {
      unpinTimer(timerId)
      return
    }

    pinTimer(timerId)
  }

  function reorderPinnedTimers(timerIds: string[]): void {
    pinnedTimerIds.value = [...timerIds]
  }

  function removePinnedTimer(timerId: string): void {
    unpinTimer(timerId)
  }

  return {
    pinnedTimerIds,
    pinnedCount,
    isTimerPinned,
    pinTimer,
    unpinTimer,
    togglePinnedTimer,
    reorderPinnedTimers,
    removePinnedTimer,
  }
}