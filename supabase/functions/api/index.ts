import { createClient, type SupabaseClient } from '@supabase/supabase-js'

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

type TimerCreateRequest = {
  title: string
  description?: string
  imageUrl?: string | null
  durationSeconds: number
  minDurationSeconds?: number | null
  timeShiftSeconds?: number
  soundEnabled?: boolean
}

type TimerUpdateRequest = {
  title?: string | null
  description?: string | null
  imageUrl?: string | null
  durationSeconds?: number | null
  minDurationSeconds?: number | null
  timeShiftSeconds?: number | null
  soundEnabled?: boolean | null
}

type TimerCreateRow = {
  title: string
  description: string
  image_url: string | null
  duration_seconds: number
  min_duration_seconds: number | null
  time_shift_seconds: number
  status: TimerStatus
  last_run_by: string
  created_by: string
  updated_by: string
}

type TimerUpdateRow = {
  title?: string
  description?: string
  image_url?: string
  duration_seconds?: number
  min_duration_seconds?: number
  time_shift_seconds?: number
  updated_by: string
}

type TimerLogAction = 'created' | 'updated' | 'restarted' | 'stopped' | 'deleted' | 'role_changed'

type SupabaseClientResult =
  | {
      error: Response
      token: null
      supabase: null
    }
  | {
      error: null
      token: string
      supabase: SupabaseClient
    }

type SupabaseServiceClientResult =
  | {
      error: Response
      supabase: null
    }
  | {
      error: null
      supabase: SupabaseClient
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

function createSupabaseClient(req: Request): SupabaseClientResult {
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

function createSupabaseServiceClient(): SupabaseServiceClientResult {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return {
      error: errorResponse('Supabase service role key is not configured', 500),
      supabase: null,
    }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

  return {
    error: null,
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

function requireTimerManager(currentUser: CurrentUser): Response | null {
  if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
    return errorResponse('Not enough permissions', 403)
  }

  return null
}

function getTimerIdFromPath(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean)
  const timersIndex = parts.lastIndexOf('timers')

  if (timersIndex === -1 || timersIndex + 1 >= parts.length) {
    return null
  }

  return parts[timersIndex + 1]
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function parseJsonBody(req: Request): Promise<Record<string, unknown> | Response> {
  try {
    const body = await req.json()

    if (!isRecord(body)) {
      return errorResponse('Invalid JSON body', 400)
    }

    return body
  } catch {
    return errorResponse('Invalid JSON body', 400)
  }
}

function validateTimerCreatePayload(body: Record<string, unknown>): TimerCreateRequest | Response {
  const title = body.title
  const description = body.description ?? ''
  const imageUrl = body.imageUrl ?? null
  const durationSeconds = body.durationSeconds
  const minDurationSeconds = body.minDurationSeconds ?? null
  const timeShiftSeconds = body.timeShiftSeconds ?? 0
  const soundEnabled = body.soundEnabled ?? true

  if (typeof title !== 'string' || title.trim().length === 0 || title.length > 120) {
    return errorResponse('Invalid title', 400)
  }

  if (typeof description !== 'string') {
    return errorResponse('Invalid description', 400)
  }

  if (imageUrl !== null && typeof imageUrl !== 'string') {
    return errorResponse('Invalid imageUrl', 400)
  }

  if (typeof durationSeconds !== 'number' || !Number.isInteger(durationSeconds) || durationSeconds <= 0) {
    return errorResponse('Invalid durationSeconds', 400)
  }

  if (
    minDurationSeconds !== null &&
    (typeof minDurationSeconds !== 'number' ||
      !Number.isInteger(minDurationSeconds) ||
      minDurationSeconds < 0)
  ) {
    return errorResponse('Invalid minDurationSeconds', 400)
  }

  if (typeof timeShiftSeconds !== 'number' || !Number.isInteger(timeShiftSeconds) || timeShiftSeconds < 0) {
    return errorResponse('Invalid timeShiftSeconds', 400)
  }

  if (typeof soundEnabled !== 'boolean') {
    return errorResponse('Invalid soundEnabled', 400)
  }

  return {
    title,
    description,
    imageUrl,
    durationSeconds,
    minDurationSeconds,
    timeShiftSeconds,
    soundEnabled,
  }
}

function validateTimerUpdatePayload(body: Record<string, unknown>): TimerUpdateRequest | Response {
  const payload: TimerUpdateRequest = {}

  if ('title' in body && body.title !== null) {
    if (typeof body.title !== 'string' || body.title.trim().length === 0 || body.title.length > 120) {
      return errorResponse('Invalid title', 400)
    }

    payload.title = body.title
  }

  if ('description' in body && body.description !== null) {
    if (typeof body.description !== 'string') {
      return errorResponse('Invalid description', 400)
    }

    payload.description = body.description
  }

  if ('imageUrl' in body && body.imageUrl !== null) {
    if (typeof body.imageUrl !== 'string') {
      return errorResponse('Invalid imageUrl', 400)
    }

    payload.imageUrl = body.imageUrl
  }

  if ('durationSeconds' in body && body.durationSeconds !== null) {
    if (
      typeof body.durationSeconds !== 'number' ||
      !Number.isInteger(body.durationSeconds) ||
      body.durationSeconds <= 0
    ) {
      return errorResponse('Invalid durationSeconds', 400)
    }

    payload.durationSeconds = body.durationSeconds
  }

  if ('minDurationSeconds' in body && body.minDurationSeconds !== null) {
    if (
      typeof body.minDurationSeconds !== 'number' ||
      !Number.isInteger(body.minDurationSeconds) ||
      body.minDurationSeconds < 0
    ) {
      return errorResponse('Invalid minDurationSeconds', 400)
    }

    payload.minDurationSeconds = body.minDurationSeconds
  }

  if ('timeShiftSeconds' in body && body.timeShiftSeconds !== null) {
    if (
      typeof body.timeShiftSeconds !== 'number' ||
      !Number.isInteger(body.timeShiftSeconds) ||
      body.timeShiftSeconds < 0
    ) {
      return errorResponse('Invalid timeShiftSeconds', 400)
    }

    payload.timeShiftSeconds = body.timeShiftSeconds
  }

  if ('soundEnabled' in body && body.soundEnabled !== null) {
    if (typeof body.soundEnabled !== 'boolean') {
      return errorResponse('Invalid soundEnabled', 400)
    }

    payload.soundEnabled = body.soundEnabled
  }

  return payload
}

function mapTimerCreatePayload(payload: TimerCreateRequest, userId: string): TimerCreateRow {
  return {
    title: payload.title,
    description: payload.description ?? '',
    image_url: payload.imageUrl ?? null,
    duration_seconds: payload.durationSeconds,
    min_duration_seconds: payload.minDurationSeconds ?? null,
    time_shift_seconds: payload.timeShiftSeconds ?? 0,
    status: 'active',
    last_run_by: userId,
    created_by: userId,
    updated_by: userId,
  }
}

function mapTimerUpdatePayload(payload: TimerUpdateRequest, userId: string): TimerUpdateRow {
  const updateData: TimerUpdateRow = {
    updated_by: userId,
  }

  if (payload.title !== undefined && payload.title !== null) {
    updateData.title = payload.title
  }

  if (payload.description !== undefined && payload.description !== null) {
    updateData.description = payload.description
  }

  if (payload.imageUrl !== undefined && payload.imageUrl !== null) {
    updateData.image_url = payload.imageUrl
  }

  if (payload.durationSeconds !== undefined && payload.durationSeconds !== null) {
    updateData.duration_seconds = payload.durationSeconds
  }

  if (payload.minDurationSeconds !== undefined && payload.minDurationSeconds !== null) {
    updateData.min_duration_seconds = payload.minDurationSeconds
  }

  if (payload.timeShiftSeconds !== undefined && payload.timeShiftSeconds !== null) {
    updateData.time_shift_seconds = payload.timeShiftSeconds
  }

  return updateData
}

async function logTimerAction(params: {
  timerId: string
  userId: string
  action: TimerLogAction
  oldStatus: TimerStatus | null
  newStatus: TimerStatus | null
  details: Record<string, unknown>
}): Promise<Response | null> {
  const serviceClientResult = createSupabaseServiceClient()

  if (serviceClientResult.error) {
    return serviceClientResult.error
  }

  const { supabase } = serviceClientResult

  const { error } = await supabase.from('timer_logs').insert({
    timer_id: params.timerId,
    user_id: params.userId,
    action: params.action,
    old_status: params.oldStatus,
    new_status: params.newStatus,
    details: params.details,
  })

  if (error) {
    return errorResponse('Failed to write timer log', 500)
  }

  return null
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

async function createTimer(req: Request): Promise<Response> {
  const currentUser = await getCurrentUser(req)

  if (currentUser instanceof Response) {
    return currentUser
  }

  const permissionError = requireTimerManager(currentUser)

  if (permissionError) {
    return permissionError
  }

  const body = await parseJsonBody(req)

  if (body instanceof Response) {
    return body
  }

  const payload = validateTimerCreatePayload(body)

  if (payload instanceof Response) {
    return payload
  }

  const serviceClientResult = createSupabaseServiceClient()

  if (serviceClientResult.error) {
    return serviceClientResult.error
  }

  const { supabase } = serviceClientResult

  const createData = mapTimerCreatePayload(payload, currentUser.id)

  const { data, error } = await supabase
    .from('timers')
    .insert(createData)
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
    .single()

  if (error || !data) {
    return errorResponse('Failed to create timer', 500)
  }

  const createdTimer = data as unknown as TimerRow

  const logError = await logTimerAction({
    timerId: createdTimer.id,
    userId: currentUser.id,
    action: 'created',
    oldStatus: null,
    newStatus: createdTimer.status,
    details: {},
  })

  if (logError) {
    return logError
  }

  return jsonResponse(mapTimerResponse(createdTimer), 201)
}

async function updateTimer(req: Request, timerId: string): Promise<Response> {
  const currentUser = await getCurrentUser(req)

  if (currentUser instanceof Response) {
    return currentUser
  }

  const permissionError = requireTimerManager(currentUser)

  if (permissionError) {
    return permissionError
  }

  const body = await parseJsonBody(req)

  if (body instanceof Response) {
    return body
  }

  const payload = validateTimerUpdatePayload(body)

  if (payload instanceof Response) {
    return payload
  }

  const updateData = mapTimerUpdatePayload(payload, currentUser.id)
  const updatedFields = Object.keys(updateData).filter((key) => key !== 'updated_by')

  if (updatedFields.length === 0) {
    return errorResponse('No fields to update', 400)
  }

  const serviceClientResult = createSupabaseServiceClient()

  if (serviceClientResult.error) {
    return serviceClientResult.error
  }

  const { supabase } = serviceClientResult

  const { data: existingTimer, error: existingTimerError } = await supabase
    .from('timers')
    .select('id, status')
    .eq('id', timerId)
    .single()

  if (existingTimerError || !existingTimer) {
    return errorResponse('Timer not found', 404)
  }

  const { data, error } = await supabase
    .from('timers')
    .update(updateData)
    .eq('id', timerId)
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
    .single()

  if (error || !data) {
    return errorResponse('Failed to update timer', 500)
  }

  const updatedTimer = data as unknown as TimerRow
  const oldStatus = (existingTimer as { status: TimerStatus }).status

  const logError = await logTimerAction({
    timerId,
    userId: currentUser.id,
    action: 'updated',
    oldStatus,
    newStatus: updatedTimer.status,
    details: {
      updatedFields,
    },
  })

  if (logError) {
    return logError
  }

  return jsonResponse(mapTimerResponse(updatedTimer))
}

async function deleteTimer(req: Request, timerId: string): Promise<Response> {
  const currentUser = await getCurrentUser(req)

  if (currentUser instanceof Response) {
    return currentUser
  }

  const permissionError = requireTimerManager(currentUser)

  if (permissionError) {
    return permissionError
  }

  const serviceClientResult = createSupabaseServiceClient()

  if (serviceClientResult.error) {
    return serviceClientResult.error
  }

  const { supabase } = serviceClientResult

  const { data: existingTimer, error: existingTimerError } = await supabase
    .from('timers')
    .select('id, status')
    .eq('id', timerId)
    .single()

  if (existingTimerError || !existingTimer) {
    return errorResponse('Timer not found', 404)
  }

  const oldStatus = (existingTimer as { status: TimerStatus }).status

  const logError = await logTimerAction({
    timerId,
    userId: currentUser.id,
    action: 'deleted',
    oldStatus,
    newStatus: null,
    details: {},
  })

  if (logError) {
    return logError
  }

  const { error } = await supabase.from('timers').delete().eq('id', timerId)

  if (error) {
    return errorResponse('Failed to delete timer', 500)
  }

  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  })
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

  if (req.method === 'POST' && pathname.endsWith('/timers')) {
    return await createTimer(req)
  }

  if (req.method === 'PATCH') {
    const timerId = getTimerIdFromPath(pathname)

    if (timerId && pathname.endsWith(`/timers/${timerId}`)) {
      return await updateTimer(req, timerId)
    }
  }

  if (req.method === 'DELETE') {
    const timerId = getTimerIdFromPath(pathname)

    if (timerId && pathname.endsWith(`/timers/${timerId}`)) {
      return await deleteTimer(req, timerId)
    }
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