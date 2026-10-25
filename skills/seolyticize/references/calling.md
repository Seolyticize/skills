# Calling Seolyticize: connection lines and call shapes

Every surface reaches the same registry. A key that may call a tool on one surface may call it on all of them, and a call refused on one is refused on the others for the same reason.

| Purpose                                 | URL                                                |
| --------------------------------------- | -------------------------------------------------- |
| Tool call                               | `POST https://seolyticize.com/api/v1/tools/{name}` |
| Tools this key may call, with schemas   | `GET https://seolyticize.com/api/v1/tools`         |
| OpenAPI 3.1, public                     | `GET https://seolyticize.com/api/v1/openapi.json`  |
| Every error code                        | `GET https://seolyticize.com/api/v1/errors`        |
| MCP server (Streamable HTTP, stateless) | `https://seolyticize.com/api/mcp`                  |

## MCP: sign in (OAuth)

The host opens a browser the first time a tool runs; the person picks the agency, a role (at most their own) and every client or just one. Access tokens last an hour and refresh tokens 30 days, rotating. The connection appears under Settings, Connected apps.

```bash
# Claude Code
claude mcp add --transport http seolyticize https://seolyticize.com/api/mcp
```

```toml
# Codex: ~/.codex/config.toml, then `codex mcp login seolyticize`
[mcp_servers.seolyticize]
url = "https://seolyticize.com/api/mcp"
```

```json
// Cursor: ~/.cursor/mcp.json
{ "mcpServers": { "seolyticize": { "url": "https://seolyticize.com/api/mcp" } } }
```

```json
// VS Code: .vscode/mcp.json
{
  "servers": {
    "seolyticize": { "type": "http", "url": "https://seolyticize.com/api/mcp" }
  }
}
```

Claude on the web and desktop: Settings, Connectors, Add custom connector, with the URL. ChatGPT: Settings, Apps & Connectors, Advanced settings, turn on Developer mode, Create, paste the URL, choose OAuth.

## MCP: API key

```bash
# Claude Code
claude mcp add --transport http seolyticize https://seolyticize.com/api/mcp \
  --header "Authorization: Bearer $SEOLYTICIZE_API_KEY"
```

```toml
# Codex, with the key exported in the environment, never in the file
[mcp_servers.seolyticize]
url = "https://seolyticize.com/api/mcp"
bearer_token_env_var = "SEOLYTICIZE_API_KEY"
```

```json
// Gemini CLI: ~/.gemini/settings.json
{
  "mcpServers": {
    "seolyticize": {
      "httpUrl": "https://seolyticize.com/api/mcp",
      "headers": { "Authorization": "Bearer $SEOLYTICIZE_API_KEY" }
    }
  }
}
```

## MCP over stdio (hosts that only launch a command)

```bash
npm i -g @seolyticize/cli
```

```json
{
  "mcpServers": {
    "seolyticize": {
      "command": "seolyticize",
      "args": ["mcp", "--group", "onboarding"],
      "env": { "SEOLYTICIZE_API_KEY": "<key from the environment or a secret store>" }
    }
  }
}
```

`--group` limits the listed tools to one job: onboarding, weekly, technical, research or reporting. Leave it out for everything the key may call.

## REST

```bash
curl -X POST https://seolyticize.com/api/v1/tools/get_rank_summary \
  -H "Authorization: Bearer $SEOLYTICIZE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"clientId":"<clientId>","trackerId":"<trackerId>"}'
```

- Every tool is a POST with its input as the body; `{}` for a tool that takes nothing. No path parameters.
- Success is `200` with `{"data": …, "meta": …}`. `meta` holds `requestId`, `costMicros`, `cached`, `cachedFrom`, `dataAsOf`, `partial`, `next` (suggested follow-up calls) and `nextCursor` (pass back as `cursor` for the next page).
- A refusal is `{"error": "<sentence>", "code": "<stable code>", "next": "<what to do>", "requestId": "…"}`.
- Writes carry `Idempotency-Key: <name for what the call is for>` (up to 200 characters). A replay within 24 hours returns the first answer with `Idempotent-Replayed: true`.
- Rate limit: 600 requests a minute per key, shared with MCP. Every response has `X-RateLimit-Limit`, `X-RateLimit-Remaining` and `X-RateLimit-Reset`.

## TypeScript SDK

```bash
npm install @seolyticize/sdk
```

```ts
import { createClient, RefusedError } from "@seolyticize/sdk";

const seo = createClient({ apiKey: process.env.SEOLYTICIZE_API_KEY! });

const { clients } = await seo.tools.list_clients<{
  clients: Array<{ id: string; name: string }>;
}>();
const summary = await seo.tools.get_rank_summary({
  clientId: clients[0]!.id,
  trackerId: "<trackerId>",
});

// A tool newer than the installed SDK, and your own idempotency key on a write:
await seo.call(
  "send_report",
  { clientId, reportId },
  { idempotencyKey: `report-${reportId}-2026-10` },
);

// What may this key do?
const { caller, tools } = await seo.listTools();
```

Errors are `SeolyticizeError` subclasses: `ValidationError` 400, `AuthenticationError` 401, `PermissionError` 403, `NotFoundError` 404, `RefusedError` 422, `RateLimitError` 429 (`retryAfterSeconds`), `ServerError` 5xx, `NetworkError`. It retries 429 after `Retry-After`, and 5xx or network failures only for read-only tools. Results are typed `unknown` unless you pass a type argument.

## Python SDK

```bash
pip install seolyticize
```

```python
from seolyticize import Seolyticize

client = Seolyticize()  # reads SEOLYTICIZE_API_KEY
summary = client.get_audit_summary(client_id="<clientId>")
newer = client.call("some_new_tool", {"clientId": "<clientId>"})  # camelCase names here
tools = client.list_tools(group="weekly")
```

Arguments are keyword-only and snake_case; reserved words take a trailing underscore (`from_`, `type_`). Errors carry `status`, `code`, `next` and request_id; branch on `code`, never on the message.

## Go SDK

```bash
go get github.com/Seolyticize/sdk-go
```

```go
client := seolyticize.New("") // reads SEOLYTICIZE_API_KEY
out, err := client.GetAuditSummary(ctx, seolyticize.GetAuditSummaryInput{ClientID: "<clientId>"})
raw, err := client.Call(ctx, "some_new_tool", map[string]any{"clientId": "<clientId>"})

var apiErr *seolyticize.Error
if errors.As(err, &apiErr) { log.Println(apiErr.Status, apiErr.Code, apiErr.Next, apiErr.RequestID) }
```

Results are `json.RawMessage`. Optional numbers and booleans are pointers (`seolyticize.Ptr(int64(50))`).

## CLI

```bash
npm i -g @seolyticize/cli
printf '%s' "$KEY" | seolyticize login      # or set SEOLYTICIZE_API_KEY (CI should)
seolyticize whoami                           # role, reach, tool count
seolyticize clients                          # list_clients
seolyticize find "why did traffic drop"      # find_tools
seolyticize recipe --client acme             # get_recipe: list the recipes for a client
seolyticize describe get_top_searches        # a tool's options
seolyticize call get_rank_summary --client acme --trackerId=<trackerId>
seolyticize get_rank_summary --client acme --trackerId=<trackerId>   # same, without "call"
seolyticize call get_keyword_gap --input '{"clientId":"<id>","competitorDomains":["a.com"]}'
seolyticize wait crawl:<crawlId> --client acme                      # wait_for_job
seolyticize alerts --client acme --since 2026-10-01T00:00:00Z
```

- `--client` takes a client's id or its name; `--client-id` is the same as `--clientId`.
- Arrays take repeated options or commas; objects take JSON; `--json` prints the raw `data` for scripts.
- Tools are discovered at run time, so new tools work without upgrading.
- Exit codes: 0 ok, 1 unexpected, 2 usage, 3 authentication, 4 not permitted, 5 not found, 6 invalid input, 7 refused, 8 rate limited, 9 server or network.

## Choosing a client, in short

- An assistant in a host with MCP: the hosted server, OAuth if the host supports it.
- An assistant in a host that only runs commands: `seolyticize mcp`.
- A one-off or scheduled script: the CLI with `--json`.
- An application or integration: the SDK for its language, which handles retries and idempotency.
- A language with no SDK, or a no-code tool: REST against the OpenAPI document.
- Building and testing an integration without spending: a sandbox key, `create_api_key` with mode test.
