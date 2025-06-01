# ZapGap API

A Deno-based API server that integrates with Langflow for chat functionality.

## Features

- **POST /chat endpoint** - Accepts user messages and forwards them to Langflow API
- **Flexible response formats** - Full Langflow response or simplified message-only response
- **Optional query parameters** - Use `chatId` parameter for simplified responses
- **Environment-based configuration** - Secure handling of API tokens and endpoints
- **Streaming support** - Handles both regular JSON and streaming responses from Langflow
- **TypeScript support** - Full type safety with Langflow response interfaces
- **Error handling** - Comprehensive error handling for network failures and API errors
- **OpenAPI/Swagger documentation** - Interactive API documentation with Zod validation
- **Type-safe validation** - Request/response validation using Zod schemas

## Setup

1. **Clone and navigate to the project:**
   ```bash
   cd zapgap-api
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your actual Langflow credentials:
   ```env
   LANGFLOW_API_TOKEN=your_actual_token_here
   LANGFLOW_BASE_URL=https://api.langflow.astra.datastax.com
   LANGFLOW_FLOW_ID=your_flow_id_here
   LANGFLOW_ENDPOINT_ID=your_endpoint_id_here
   ```

3. **Start the server:**
   ```bash
   deno task start
   ```

The server will start on `http://localhost:8000`

## API Documentation

### Interactive Documentation

- **Swagger UI**: `http://localhost:8000/swagger`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`
- **Docs redirect**: `http://localhost:8000/docs` (redirects to Swagger UI)

The API documentation is automatically generated from TypeScript types and Zod schemas, ensuring it's always up-to-date with the actual implementation.

## API Endpoints

### GET /

Health check endpoint that returns a simple message.

**Response:**
```json
{
  "message": "Hello Hono!"
}
```

### POST /chat

Send a message to the Langflow API and receive a response.

**Query Parameters:**
- `chatId` (optional): When provided, returns only the latest message text instead of the full response

**Request:**
```json
{
  "msg": "Your message here"
}
```

**Response (Success - 200) - Full Response (default):**
```json
{
  "session_id": "user_1",
  "outputs": [
    {
      "inputs": {
        "input_value": "Your message here"
      },
      "outputs": [
        {
          "results": {
            "message": {
              "text": "AI response here",
              "sender": "Machine",
              "sender_name": "AI"
              // ... additional fields
            }
          }
          // ... additional output data
        }
      ]
    }
  ]
}
```

**Response (Success - 200) - Simplified Response (when chatId is provided):**
```json
{
  "message": "Hello! I'm here and ready to assist you. How can I help you today?"
}
```

**Response (Validation Error - 400):**
```json
{
  "success": false,
  "error": {
    "issues": [
      {
        "code": "invalid_type",
        "expected": "string",
        "received": "undefined",
        "path": ["msg"],
        "message": "Required"
      }
    ],
    "name": "ZodError"
  }
}
```

**Response (Server Error - 500/502):**
```json
{
  "error": "Error description",
  "message": "Detailed error message",
  "status": 502
}
```

**Example Usage:**

Full response (default):
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"msg": "Hello, how are you?"}'
```

Simplified response (with chatId):
```bash
curl -X POST "http://localhost:8000/chat?chatId=simple" \
  -H "Content-Type: application/json" \
  -d '{"msg": "Hello, how are you?"}'
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LANGFLOW_API_TOKEN` | **Required** - Your Langflow API token | - |
| `LANGFLOW_BASE_URL` | Langflow API base URL | `https://api.langflow.astra.datastax.com` |
| `LANGFLOW_FLOW_ID` | Your Langflow flow ID | `76cf76a8-2a7c-4df4-9f32-cc0799b81d0f` |
| `LANGFLOW_ENDPOINT_ID` | Your Langflow endpoint ID | `3c295853-e107-448b-a370-17e3aa47945e` |

## Development

The project uses:
- **Deno** - Runtime environment
- **Hono** - Web framework
- **OpenAPIHono** - Extended Hono with OpenAPI support
- **Zod** - Schema validation and TypeScript type inference
- **TypeScript** - Type safety

### Project Structure

```
├── main.ts              # Main server file with API endpoints
├── schemas.ts           # Zod schemas for request/response validation
├── langflow.ts          # TypeScript interfaces for Langflow API
├── deno.json           # Deno configuration and dependencies
├── .env                # Environment variables (create from .env.example)
├── .env.example        # Environment variables template
└── README.md           # This file
```

### Dependencies

- `@hono/zod-openapi` - OpenAPI integration with Zod validation
- `@hono/swagger-ui` - Swagger UI middleware
- `zod` - Schema validation library
- `hono` - Web framework

### Validation & Type Safety

The API uses Zod schemas for:
- **Request validation** - Ensures incoming requests match expected structure
- **Response typing** - Provides type safety for API responses
- **OpenAPI generation** - Automatically generates API documentation
- **Runtime validation** - Validates data at runtime, not just compile time

### Error Handling

The API includes comprehensive error handling for:
- **Validation errors (400)** - Invalid request structure or missing fields
- **Langflow API errors (502)** - External API failures
- **Network failures (500)** - Internal server errors
- **Environment configuration issues** - Server startup failures

### Streaming Support

The endpoint automatically detects and forwards streaming responses from the Langflow API when the content type indicates streaming (`text/event-stream` or `application/stream`).

## License

MIT
