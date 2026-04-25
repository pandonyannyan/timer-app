export type TimerStatus = 'active' | 'stopped'

export type TimerViewStatus = 'active' | 'stopped' | 'signal' | 'completed'

export interface Timer {
  id: string
  title: string
  description: string
  imageUrl?: string
  durationSeconds: number
  timeShiftSeconds: number
  startedAt: string
  status: TimerStatus
  soundEnabled: boolean
}
