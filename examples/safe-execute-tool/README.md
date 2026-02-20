# safe-execute-tool example

A standalone, runnable TypeScript demo showcasing every feature of `safeExecuteTool` from `@mastra/core/tools`.

## What is `safeExecuteTool`?

`safeExecuteTool` is a utility that lets you safely call one Mastra tool from within another tool's `execute` function. Instead of throwing on failure it returns `null`, giving you graceful error handling, automatic tracing span propagation, AbortSignal respect, and max-depth protection against infinite recursion.

See PR [#13084](https://github.com/mastra-ai/mastra/pull/13084) and issue [#13068](https://github.com/mastra-ai/mastra/issues/13068) for background.

## Running the example

```bash
pnpm install
pnpm start
```

No LLM or cloud API keys are required — everything runs locally with mock data.
The example imports directly from the core source via relative path, so no separate build step is needed.

## What the example demonstrates

| Scenario | Description |
|---|---|
| 1. Basic nested tool composition | `enrichUserTool` calls `fetchUserTool` + `fetchOrdersTool` via `safeExecuteTool` |
| 2. Graceful error handling | `riskyTool` throws; `safeExecuteTool` returns `null` and execution continues |
| 3. Max depth protection | `deeplyNestedTool` recurses; execution stops at `maxDepth: 3` |
| 4. AbortSignal respect | Pre-aborted signal causes immediate `null` return |
| 5. Context propagation | `requestContext` is forwarded to the inner tool |

## Expected output

```
=== Scenario 1: Basic Nested Tool Composition ===
{
  "user": { "id": "u1", "name": "Alice", "email": "alice@example.com" },
  "orders": [
    { "id": "o1", "userId": "u1", "product": "Widget", "amount": 42 },
    { "id": "o2", "userId": "u1", "product": "Gadget", "amount": 99 }
  ]
}
✅ Scenario 1 passed

=== Scenario 2: Graceful Error Handling ===
null
✅ Scenario 2 passed — riskyTool returned null instead of throwing

=== Scenario 3: Max Depth Protection ===
null
✅ Scenario 3 passed — recursion stopped at maxDepth: 3

=== Scenario 4: AbortSignal Respect ===
null
✅ Scenario 4 passed — aborted signal returned null immediately

=== Scenario 5: Context Propagation ===
{ "receivedUserId": "ctx-user-42" }
✅ Scenario 5 passed — context propagated correctly

========================================
✅ All 5 scenarios passed!
safeExecuteTool is ready for production use.
See: https://github.com/mastra-ai/mastra/pull/13084
========================================
```
