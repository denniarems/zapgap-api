import { z } from '@hono/zod-openapi'

// Request schemas
export const ChatRequestSchema = z.object({
  msg: z.string().min(1).openapi({
    description: 'The message to send to the chat API',
    example: 'Hello, how are you?'
  })
}).openapi('ChatRequest')

// Query parameter schema
export const ChatQuerySchema = z.object({
  chatId: z.string().optional().openapi({
    description: 'Optional chat session identifier. When provided, it will be used as the session_id for the Langflow API and the response will return only the latest message text instead of the full response',
  })
}).openapi('ChatQuery')

// Response schemas
export const ChatErrorSchema = z.object({
  error: z.string().openapi({
    description: 'Error message',
    example: 'Missing or invalid "msg" field in request body'
  }),
  message: z.string().optional().openapi({
    description: 'Detailed error message',
    example: 'The request body must contain a valid "msg" field'
  }),
  status: z.number().optional().openapi({
    description: 'HTTP status code from external API',
    example: 502
  })
}).openapi('ChatError')

// Langflow response schemas (based on langflow.ts interfaces)
export const LangflowPropertiesSchema = z.object({
  text_color: z.string(),
  background_color: z.string(),
  edited: z.boolean(),
  source: z.object({
    id: z.string(),
    display_name: z.string(),
    source: z.string()
  }),
  icon: z.string(),
  allow_markdown: z.boolean(),
  positive_feedback: z.null(),
  state: z.string(),
  targets: z.array(z.any())
}).openapi('LangflowProperties')

export const LangflowContentBlockContentSchema = z.object({
  type: z.string(),
  duration: z.number(),
  header: z.object({
    title: z.string(),
    icon: z.string()
  }),
  text: z.string().optional(),
  name: z.string().optional(),
  tool_input: z.object({
    search_phrase: z.string(),
    limit: z.number()
  }).optional(),
  output: z.object({
    meta: z.null(),
    content: z.array(z.object({
      type: z.string(),
      text: z.string()
    })),
    isError: z.boolean()
  }).optional(),
  error: z.null().optional()
}).openapi('LangflowContentBlockContent')

export const LangflowContentBlockSchema = z.object({
  title: z.string(),
  contents: z.array(LangflowContentBlockContentSchema),
  allow_markdown: z.boolean(),
  media_url: z.null()
}).openapi('LangflowContentBlock')

export const LangflowDataClassSchema = z.object({
  text_key: z.string().optional(),
  data: z.any().optional(),
  default_value: z.string().optional(),
  text: z.string(),
  sender: z.string(),
  sender_name: z.string(),
  files: z.array(z.any()),
  session_id: z.string(),
  timestamp: z.string().datetime(),
  flow_id: z.string(),
  error: z.boolean(),
  edit: z.boolean(),
  properties: LangflowPropertiesSchema,
  category: z.string(),
  content_blocks: z.array(LangflowContentBlockSchema),
  id: z.string().optional()
}).openapi('LangflowDataClass')

export const LangflowMessageSchema = z.object({
  message: z.string(),
  sender: z.string(),
  sender_name: z.string(),
  session_id: z.string(),
  stream_url: z.null(),
  component_id: z.string(),
  files: z.array(z.any()),
  type: z.enum(['text'])
}).openapi('LangflowMessage')

export const LangflowOutputSchema = z.object({
  results: z.object({
    message: LangflowDataClassSchema
  }),
  artifacts: z.object({
    message: z.string(),
    sender: z.string(),
    sender_name: z.string(),
    files: z.array(z.any()),
    type: z.string()
  }),
  outputs: z.object({
    message: z.object({
      message: z.string(),
      type: z.enum(['text'])
    })
  }),
  logs: z.object({
    message: z.array(z.any())
  }),
  messages: z.array(LangflowMessageSchema),
  timedelta: z.null(),
  duration: z.null(),
  component_display_name: z.string(),
  component_id: z.string(),
  used_frozen_result: z.boolean()
}).openapi('LangflowOutput')

export const LangflowResponseOutputSchema = z.object({
  inputs: z.object({
    input_value: z.string()
  }),
  outputs: z.array(LangflowOutputSchema)
}).openapi('LangflowResponseOutput')

export const LangflowResponseSchema = z.object({
  session_id: z.string().openapi({
    description: 'Session ID for the chat conversation',
    example: 'user_1'
  }),
  outputs: z.array(LangflowResponseOutputSchema).openapi({
    description: 'Array of outputs from the Langflow API'
  })
}).openapi('LangflowResponse')

// Simplified chat response (when chatId is provided)
export const SimplifiedChatResponseSchema = z.object({
  message: z.string().openapi({
    description: 'The latest message text from the AI assistant',
    example: 'Hello! I\'m here and ready to assist you. How can I help you today?'
  }),
  session_id: z.string().optional().openapi({
    description: 'Session ID for the chat conversation (same as the provided chatId)',
    example: 'user_123'
  })
}).openapi('SimplifiedChatResponse')

// Health check response
export const HealthResponseSchema = z.object({
  message: z.string().openapi({
    description: 'Health check message',
    example: 'Hello Hono!'
  })
}).openapi('HealthResponse')
