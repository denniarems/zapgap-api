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
    example: 'user_123'
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

// Simplified Langflow response schema for OpenAPI documentation
// Note: The actual response handling uses the TypeScript interface from langflow.ts
export const LangflowResponseSchema = z.object({
  session_id: z.string().openapi({
    description: 'Session ID for the chat conversation',
    example: 'user_1'
  }),
  outputs: z.array(z.any()).openapi({
    description: 'Array of outputs from the Langflow API containing the full response structure'
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
