import { ref } from 'vue'

const TIMER_SOUND_DISABLED_IDS_KEY = 'timer_sound_disabled_ids'
const GLOBAL_SOUND_ENABLED_KEY = 'timer_global_sound_enabled'

function loadSoundDisabledTimers(): string[] {
  const raw = localStorage.getItem(TIMER_SOUND_DISABLED_IDS_KEY)

  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)

    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function loadGlobalSoundEnabled(): boolean {
  const raw = localStorage.getItem(GLOBAL_SOUND_ENABLED_KEY)

  if (raw === null) return true

  return raw === 'true'
}

export const globalSoundEnabled = ref(loadGlobalSoundEnabled())
export const soundDisabledTimerIds = ref<string[]>(loadSoundDisabledTimers())

export function getSoundDisabledTimers(): string[] {
  return soundDisabledTimerIds.value
}

export function isSoundEnabled(timerId: string): boolean {
  return !soundDisabledTimerIds.value.includes(timerId)
}

export function setGlobalSoundEnabled(enabled: boolean) {
  globalSoundEnabled.value = enabled
  localStorage.setItem(GLOBAL_SOUND_ENABLED_KEY, String(enabled))
}

export function toggleGlobalSound(): boolean {
  const nextValue = !globalSoundEnabled.value

  setGlobalSoundEnabled(nextValue)

  return nextValue
}

export function toggleTimerSound(timerId: string): boolean {
  const isDisabled = soundDisabledTimerIds.value.includes(timerId)

  const nextDisabledIds = isDisabled
    ? soundDisabledTimerIds.value.filter(id => id !== timerId)
    : [...soundDisabledTimerIds.value, timerId]

  soundDisabledTimerIds.value = nextDisabledIds
  localStorage.setItem(TIMER_SOUND_DISABLED_IDS_KEY, JSON.stringify(nextDisabledIds))

  return isDisabled
}