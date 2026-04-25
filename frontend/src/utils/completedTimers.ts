const KEY = 'completed_signal_timer_ids'

export function getCompletedTimers(): string[] {
  const raw = localStorage.getItem(KEY)
  return raw ? JSON.parse(raw) : []
}

export function addCompletedTimer(id: string) {
  const list = getCompletedTimers()

  if (!list.includes(id)) {
    list.push(id)
    localStorage.setItem(KEY, JSON.stringify(list))
  }
}

export function isTimerCompleted(id: string): boolean {
  return getCompletedTimers().includes(id)
}
