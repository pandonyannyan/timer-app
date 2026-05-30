import { supabase } from './supabaseClient'
import type { Timer } from '../types/timer'

interface TimerRow {
  id: string
  title: string
  description: string
  image_url: string | null
  duration_seconds: number
  min_duration_seconds: number | null
  time_shift_seconds: number
  started_at: string
  last_run_by: string | null
  status: 'active' | 'stopped'
  created_at: string
  updated_at: string
}

function mapTimer(row: TimerRow): Timer {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url ?? undefined,
    durationSeconds: row.duration_seconds,
    minDurationSeconds: row.min_duration_seconds,
    timeShiftSeconds: row.time_shift_seconds,
    startedAt: row.started_at,
    lastRunBy: row.last_run_by ?? '',
    status: row.status,
    soundEnabled: true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getSupabaseTimers(): Promise<Timer[]> {
  const { data, error } = await supabase
    .from('timers')
    .select(`
      id,
      title,
      description,
      image_url,
      duration_seconds,
      min_duration_seconds,
      time_shift_seconds,
      started_at,
      last_run_by,
      status,
      created_at,
      updated_at
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map(mapTimer)
}