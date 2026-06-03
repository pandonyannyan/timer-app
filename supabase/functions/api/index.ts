import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
}

type UserRole = 'admin' | 'manager' | 'member'

type CurrentUser = {
  id: string
  email: string | null
  role: UserRole
  is_active: boolean
}

type TimerStatus = 'active' | 'stopped'

type TimerRow = {
  id: string
  title: string
  description: string
  image_url: string | null
  duration_seconds: number
  min_duration_seconds: number | null
  time_shift_seconds: number
  started_at: string
  last_run_by: string | null
  status: TimerStatus
  created_at: string
  updated_at: string
}

type TimerResponse = {
  id: string
  title: string
  description: string
  imageUrl: string | null
  durationSeconds: number
  minDurationSeconds: number | null
  timeShiftSeconds: number
  startedAt: string
  lastRunBy: string | null
  status: TimerStatus
  createdAt: string
  updatedAt: string
  soundEnabled: boolean
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function errorResponse(message: string, status: number): Response {
  return jsonResponse({ detail: message }, status)
}

function createSupabaseClient(req: Request) {
  const authHeader = req.headers.get('Authorization')

  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return {
      error: errorResponse('Missing bearer token', 401),
      token: null,
      supabase: null,
    }
  }

  const token = authHeader.slice('Bearer '.length).trim()

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      error: errorResponse('Supabase environment is not configured', 500),
      token: null,
      supabase: null,
    }
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })

  return {
    error: null,
    token,
    supabase,
  }
}

async function getCurrentUser(req: Request): Promise<CurrentUser | Response> {
  const clientResult = createSupabaseClient(req)

  if (clientResult.error) {
    return clientResult.error
  }

  const { token, supabase } = clientResult

  const { data: authData, error: authError } = await supabase.auth.getUser(token)

  if (authError || !authData.user) {
    return errorResponse('Invalid bearer token', 401)
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role, is_active')
    .eq('id', authData.user.id)
    .single()

  if (profileError || !profile) {
    return errorResponse('Profile not found', 403)
  }

  if (!profile.is_active) {
    return errorResponse('User is inactive', 403)
  }

  return {
    id: profile.id,
    email: profile.email ?? authData.user.email ?? null,
    role: profile.role,
    is_active: profile.is_active,
  }
}

function mapTimerResponse(timer: TimerRow): TimerResponse {
  return {
    id: timer.id,
    title: timer.title,
    description: timer.description,
    imageUrl: timer.image_url,
    durationSeconds: timer.duration_seconds,
    minDurationSeconds: timer.min_duration_seconds,
    timeShiftSeconds: timer.time_shift_seconds,
    startedAt: timer.started_at,
    lastRunBy: timer.last_run_by,
    status: timer.status,
    createdAt: timer.created_at,
    updatedAt: timer.updated_at,
    soundEnabled: true,
  }
}

async function getTimers(req: Request): Promise<Response> {
  const currentUser = await getCurrentUser(req)

  if (currentUser instanceof Response) {
    return currentUser
  }

  const clientResult = createSupabaseClient(req)

  if (clientResult.error) {
    return clientResult.error
  }

  const { supabase } = clientResult

  const { data, error } = await supabase
    .from('timers')
    .select(
      [
        'id',
        'title',
        'description',
        'image_url',
        'duration_seconds',
        'min_duration_seconds',
        'time_shift_seconds',
        'started_at',
        'last_run_by',
        'status',
        'created_at',
        'updated_at',
      ].join(', '),
    )
    .order('created_at', { ascending: true })

  if (error) {
    return errorResponse('Failed to load timers', 500)
  }

  const timerRows = (data ?? []) as unknown as TimerRow[]
  const timers = timerRows.map(mapTimerResponse)

  return jsonResponse(timers)
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    })
  }

  const url = new URL(req.url)
  const pathname = url.pathname

  if (req.method === 'GET' && pathname.endsWith('/health')) {
    return jsonResponse({ status: 'ok' })
  }

  if (req.method === 'GET' && pathname.endsWith('/me')) {
    const currentUser = await getCurrentUser(req)

    if (currentUser instanceof Response) {
      return currentUser
    }

    return jsonResponse(currentUser)
  }

  if (req.method === 'GET' && pathname.endsWith('/timers')) {
    return await getTimers(req)
  }

  return jsonResponse(
    {
      error: 'Not found',
      method: req.method,
      path: pathname,
    },
    404,
  )
})