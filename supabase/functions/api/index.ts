const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
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

Deno.serve((req: Request) => {
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

  return jsonResponse(
    {
      error: 'Not found',
      method: req.method,
      path: pathname,
    },
    404,
  )
})