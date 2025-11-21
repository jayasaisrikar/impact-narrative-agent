# Impact Narrative Agent - Backend

A multi-agent backend system built with [IQAI ADK TypeScript](https://github.com/iqai/adk-ts) for generating impact narratives for companies. This backend provides agentic endpoints that can be integrated with any UI application.

## Architecture

This is a **backend-only** repository that exposes RESTful API endpoints powered by intelligent AI agents. The system is:

- **Agent-agnostic**: Built on IQAI ADK, supporting multiple LLM providers (OpenAI, Anthropic, Google Gemini, etc.)
- **Multi-agent**: Designed to support multiple specialized agents working together
- **Scalable**: Uses efficient memory management to avoid model overload
- **Production-ready**: Built with TypeScript, Express, and modern best practices

## Project Structure

```
src/
├── index.ts                 # Express server and API endpoints
├── agents/
│   └── narrativeAgent.ts    # Main narrative generation agent
└── tools/
    └── companyInsights.ts   # Tool for retrieving company information
```

## Installation

```bash
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configure your environment variables in `.env`:
   - `PORT`: Server port (default: 3000)
   - Add API keys for your chosen LLM provider(s)

## Development

Start the development server with hot reload:

```bash
npm run dev
```

## Production

Build and run in production:

```bash
npm run build
npm start
```

## API Endpoints

### POST `/api/chat`

Generate an impact narrative for a company.

**Request Body:**
```json
{
  "message": "Generate an impact narrative for Tesla",
  "sessionId": "optional-session-id",
  "userId": "optional-user-id"
}
```

**Response:**
Streams the agent's response as plain text.

**Example with curl:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Generate an impact narrative for Tesla"}'
```

## Agent Architecture

### Narrative Agent

The main agent (`narrativeAgent`) is configured to:
- Analyze company information
- Generate compelling impact narratives
- Use tools to gather necessary data

### Tools

- **companyInsights**: Retrieves company information (currently mocked, can be extended to call real APIs)

## Extending the System

### Adding New Agents

Create a new agent in `src/agents/`:

```typescript
import { LlmAgent } from '@iqai/adk';

export const myAgent = new LlmAgent({
  name: 'myAgent',
  description: 'Description of what this agent does',
  model: 'gemini-pro',
  instruction: 'Your agent instructions here',
  tools: [/* your tools */],
});
```

### Adding New Tools

Create a new tool in `src/tools/`:

```typescript
import { createTool } from '@iqai/adk';
import { z } from 'zod';

export const myTool = createTool({
  name: 'myTool',
  description: 'What this tool does',
  schema: z.object({
    param: z.string().describe('Parameter description'),
  }),
  fn: async ({ param }) => {
    // Tool implementation
    return { result: 'data' };
  },
});
```

## Technology Stack

- **IQAI ADK**: Agent development framework
- **TypeScript**: Type-safe development
- **Express**: Web server
- **Zod**: Schema validation
- **dotenv**: Environment configuration

## License

[Your License Here]
