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

async function getCurrentUser(req: Request): Promise<CurrentUser | Response> {
  const authHeader = req.headers.get('Authorization')

  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return errorResponse('Missing bearer token', 401)
  }

  const token = authHeader.slice('Bearer '.length).trim()

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

  if (!supabaseUrl || !supabaseAnonKey) {
    return errorResponse('Supabase environment is not configured', 500)
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })

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

  return jsonResponse(
    {
      error: 'Not found',
      method: req.method,
      path: pathname,
    },
    404,
  )
})