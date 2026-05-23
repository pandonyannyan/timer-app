import { computed, ref } from 'vue'
import { pinnedTimerService } from '../services/pinnedTimerService'

const pinnedTimerIds = ref<string[]>(pinnedTimerService.getPinnedTimers())

export function usePinnedTimers() {
  const pinnedCount = computed(() => pinnedTimerIds.value.length)

  function isTimerPinned(timerId: string): boolean {
    return pinnedTimerIds.value.includes(timerId)
  }

  function pinTimer(timerId: string): void {
    pinnedTimerIds.value = pinnedTimerService.pinTimer(timerId)
  }

  function unpinTimer(timerId: string): void {
    pinnedTimerIds.value = pinnedTimerService.unpinTimer(timerId)
  }

  function togglePinnedTimer(timerId: string): void {
    if (isTimerPinned(timerId)) {
      unpinTimer(timerId)
      return
    }

    pinTimer(timerId)
  }

  function reorderPinnedTimers(timerIds: string[]): void {
    pinnedTimerIds.value = pinnedTimerService.reorderPinnedTimers(timerIds)
  }

  function removePinnedTimer(timerId: string): void {
    pinnedTimerIds.value = pinnedTimerService.removePinnedTimer(timerId)
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