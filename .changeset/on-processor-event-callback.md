---
'@mastra/core': minor
---

Added generalized `onProcessorEvent` callback system for processors. Processors can now emit structured events (e.g., detections, warnings) via the `onProcessorEvent` callback on `ProcessorContext`. This can be set at the agent level or per-execution.

**New types:**
- `ProcessorEvent` — structured event with `processorId`, `type`, and `data`
- `ProcessorEventCallback` — callback type for receiving processor events

**Usage example:**

```typescript
import { Agent } from '@mastra/core/agent';
import { PromptInjectionDetector } from '@mastra/core/processors';

const agent = new Agent({
  model: 'openai/gpt-4o',
  inputProcessors: [new PromptInjectionDetector({ model: 'openai/gpt-4o' })],
  onProcessorEvent: (event) => {
    console.log(`[${event.processorId}] ${event.type}:`, event.data);
  },
});

// Or per-execution:
await agent.generate('Hello', {
  onProcessorEvent: (event) => {
    // Handle detection events from processors
  },
});
```

`PromptInjectionDetector` and `PIIDetector` now emit detection events via `onProcessorEvent` when threats or PII are found, enabling programmatic handling of detection results.
