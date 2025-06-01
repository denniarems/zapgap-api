import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { LangFlowResponse } from './langflow.ts'
import {
  ChatRequestSchema,
  ChatErrorSchema,
  LangflowResponseSchema,
  HealthResponseSchema
} from './schemas.ts'

// Load environment variables from .env file
try {
  const envText = await Deno.readTextFile('.env')
  const envLines = envText.split('\n')
  for (const line of envLines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        Deno.env.set(key, valueParts.join('='))
      }
    }
  }
} catch (error) {
  console.warn('Could not load .env file:', error instanceof Error ? error.message : 'Unknown error')
}

const app = new OpenAPIHono()

// Environment variables validation
const LANGFLOW_API_TOKEN = Deno.env.get('LANGFLOW_API_TOKEN')
const LANGFLOW_BASE_URL = Deno.env.get('LANGFLOW_BASE_URL') 
const LANGFLOW_FLOW_ID = Deno.env.get('LANGFLOW_FLOW_ID') 
const LANGFLOW_ENDPOINT_ID = Deno.env.get('LANGFLOW_ENDPOINT_ID')

if (!LANGFLOW_API_TOKEN) {
  console.error('LANGFLOW_API_TOKEN environment variable is required')
  Deno.exit(1)
}

// Langflow API request interface
interface LangflowApiRequest {
  input_value: string
  output_type: string
  input_type: string
  session_id: string
}

// Define OpenAPI routes
const healthRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Health'],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: HealthResponseSchema,
        },
      },
      description: 'Health check response',
    },
  },
})

app.openapi(healthRoute, (c) => {
  return c.json({ message: 'Hello Hono!' })
})

// Define chat route
const chatRoute = createRoute({
  method: 'post',
  path: '/chat',
  tags: ['Chat'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: ChatRequestSchema,
        },
      },
      description: 'Chat message request',
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: LangflowResponseSchema,
        },
      },
      description: 'Successful chat response from Langflow API',
    },
    400: {
      content: {
        'application/json': {
          schema: ChatErrorSchema,
        },
      },
      description: 'Bad request - invalid or missing message',
    },
    500: {
      content: {
        'application/json': {
          schema: ChatErrorSchema,
        },
      },
      description: 'Internal server error',
    },
    502: {
      content: {
        'application/json': {
          schema: ChatErrorSchema,
        },
      },
      description: 'Bad gateway - external API error',
    },
  },
})

app.openapi(chatRoute, async (c) => {
  try {
    // Parse and validate request body
    const body = c.req.valid('json')

    // Prepare Langflow API request
    const langflowRequest: LangflowApiRequest = {
      input_value: body.msg,
      output_type: 'chat',
      input_type: 'chat',
      session_id: 'user_1'
    }

    // Build Langflow API URL
    const langflowUrl = `${LANGFLOW_BASE_URL}/lf/${LANGFLOW_ENDPOINT_ID}/api/v1/run/${LANGFLOW_FLOW_ID}`

    // Make request to Langflow API
    const response = await fetch(langflowUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LANGFLOW_API_TOKEN}`
      },
      body: JSON.stringify(langflowRequest)
    })

    // Handle non-200 responses
    if (!response.ok) {
      console.error(`Langflow API error: ${response.status} ${response.statusText}`)
      return c.json({
        error: 'External API error',
        status: response.status
      }, 502) // Bad Gateway
    }

    // Check if response is streaming
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('text/event-stream') || contentType?.includes('application/stream')) {
      // Handle streaming response
      return new Response(response.body, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      })
    } else {
      // Handle regular JSON response
      const langflowResponse: LangFlowResponse = await response.json()
      return c.json(langflowResponse)
    }

  } catch (error) {
    console.error('Chat endpoint error:', error)
    return c.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Add OpenAPI documentation endpoint
app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'ZapGap Chat API',
    description: 'A Deno-based API server that integrates with Langflow for chat functionality',
  },
  servers: [
    {
      url: 'http://localhost:8000',
      description: 'Development server',
    },
  ],
})

// Add Swagger UI endpoint
app.get('/swagger', swaggerUI({ url: '/openapi.json' }))

// Add a redirect from /docs to /swagger for convenience
app.get('/docs', (c) => {
  return c.redirect('/swagger')
})

Deno.serve(app.fetch)
