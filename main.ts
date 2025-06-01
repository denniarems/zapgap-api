import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { LangFlowResponse } from "./langflow.ts";
import { cors } from 'hono/cors'
import {
  ChatErrorSchema,
  ChatQuerySchema,
  ChatRequestSchema,
  HealthResponseSchema,
  LangflowResponseSchema,
  SimplifiedChatResponseSchema,
} from "./schemas.ts";

// Load environment variables from .env file
try {
  const envText = await Deno.readTextFile(".env");
  const envLines = envText.split("\n");
  for (const line of envLines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        Deno.env.set(key, valueParts.join("="));
      }
    }
  }
} catch (error) {
  console.warn(
    "Could not load .env file:",
    error instanceof Error ? error.message : "Unknown error",
  );
}

const app = new OpenAPIHono();

app.use('/*', cors({
  origin: ['http://localhost:8080', 'https://*.ops-agent.pages.dev', 'https://zapgap.buildverse.app'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}) as any)

// Environment variables validation
const LANGFLOW_API_TOKEN = Deno.env.get("LANGFLOW_API_TOKEN");
const LANGFLOW_BASE_URL = Deno.env.get("LANGFLOW_BASE_URL");
const LANGFLOW_FLOW_ID = Deno.env.get("LANGFLOW_FLOW_ID");
const LANGFLOW_ENDPOINT_ID = Deno.env.get("LANGFLOW_ENDPOINT_ID");

if (!LANGFLOW_API_TOKEN) {
  console.error("LANGFLOW_API_TOKEN environment variable is required");
  Deno.exit(1);
}

// Langflow API request interface
interface LangflowApiRequest {
  input_value: string;
  output_type: string;
  input_type: string;
  session_id: string;
}

// Define OpenAPI routes
const healthRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Health"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: HealthResponseSchema,
        },
      },
      description: "Health check response",
    },
  },
});

app.openapi(healthRoute, (c) => {
  return c.json({ message: "Hello Hono!" });
});

// Define chat route
const chatRoute = createRoute({
  method: "post",
  path: "/chat",
  tags: ["Chat"],
  request: {
    query: ChatQuerySchema,
    body: {
      content: {
        "application/json": {
          schema: ChatRequestSchema,
        },
      },
      description: "Chat message request",
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.union([LangflowResponseSchema, SimplifiedChatResponseSchema]).openapi({
            description: 'Full Langflow response (default) or simplified message response (when chatId is provided)'
          }),
        },
      },
      description: "Successful chat response from Langflow API. Returns full response by default, or simplified message when chatId query parameter is provided.",
    },
    400: {
      content: {
        "application/json": {
          schema: ChatErrorSchema,
        },
      },
      description: "Bad request - invalid or missing message",
    },
    500: {
      content: {
        "application/json": {
          schema: ChatErrorSchema,
        },
      },
      description: "Internal server error",
    },
    502: {
      content: {
        "application/json": {
          schema: ChatErrorSchema,
        },
      },
      description: "Bad gateway - external API error",
    },
  },
});

app.openapi(chatRoute, async (c) => {
  try {
    // Parse and validate request body and query parameters
    const body = c.req.valid("json");
    const query = c.req.valid("query");

    // Prepare Langflow API request
    const langflowRequest: LangflowApiRequest = {
      input_value: body.msg,
      output_type: "chat",
      input_type: "chat",
      session_id: query.chatId || "user_1", // Use chatId if provided, otherwise default to 'user_1'
    };

    // Build Langflow API URL
    const langflowUrl =
      `${LANGFLOW_BASE_URL}/lf/${LANGFLOW_ENDPOINT_ID}/api/v1/run/${LANGFLOW_FLOW_ID}`;

    // Make request to Langflow API
    const response = await fetch(langflowUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LANGFLOW_API_TOKEN}`,
      },
      body: JSON.stringify(langflowRequest),
    });

    // Handle non-200 responses
    if (!response.ok) {
      console.error(
        `Langflow API error: ${response.status} ${response.statusText}`,
      );
      return c.json({
        error: "External API error",
        status: response.status,
      }, 502); // Bad Gateway
    }

    // Handle regular JSON response (streaming not supported in OpenAPI schema)
    const langflowResponse: LangFlowResponse = await response.json();

    // Check if chatId is provided for simplified response
    if (query.chatId) {
      // Extract the latest message from the nested response structure
      try {
        const latestMessage = langflowResponse.outputs?.[0]?.outputs?.[0]?.results
          ?.message?.text;
        if (latestMessage) {
          return c.json({
            message: latestMessage,
            session_id: langflowResponse.session_id,
          }, 200);
        } else {
          // Fallback: try to get message from artifacts or messages array
          const artifactMessage = langflowResponse.outputs?.[0]?.outputs?.[0]
            ?.artifacts?.message;
          const messageFromArray = langflowResponse.outputs?.[0]?.outputs?.[0]
            ?.messages?.[0]?.message;

          const fallbackMessage = artifactMessage || messageFromArray ||
            "No message found in response";
          return c.json({
            message: fallbackMessage,
            session_id: langflowResponse.session_id,
          }, 200);
        }
      } catch (extractError) {
        console.error("Error extracting message:", extractError);
        return c.json({
          error: "Error extracting message from response",
          message: extractError instanceof Error
            ? extractError.message
            : "Unknown extraction error",
        }, 500);
      }
    } else {
      // Return full response when chatId is not provided
      return c.json(langflowResponse, 200);
    }
  } catch (error) {
    console.error("Chat endpoint error:", error);
    return c.json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    }, 500);
  }
});

// Add OpenAPI documentation endpoint
app.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "ZapGap Chat API",
    description:
      "A Deno-based API server that integrates with Langflow for chat functionality",
  },
  servers: [
    {
      url: "http://localhost:8000",
      description: "Development server",
    },
  ],
});

// Add Swagger UI endpoint
app.get("/swagger", swaggerUI({ url: "/openapi.json" }));

// Add a redirect from /docs to /swagger for convenience
app.get("/docs", (c) => {
  return c.redirect("/swagger");
});

Deno.serve(app.fetch);
