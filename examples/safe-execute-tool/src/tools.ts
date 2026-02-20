import { createTool, safeExecuteTool } from '../../../packages/core/src/tools/index.js';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_USERS: Record<string, { id: string; name: string; email: string }> = {
  u1: { id: 'u1', name: 'Alice', email: 'alice@example.com' },
  u2: { id: 'u2', name: 'Bob', email: 'bob@example.com' },
};

const MOCK_ORDERS: Record<string, { id: string; userId: string; product: string; amount: number }[]> = {
  u1: [
    { id: 'o1', userId: 'u1', product: 'Widget', amount: 42 },
    { id: 'o2', userId: 'u1', product: 'Gadget', amount: 99 },
  ],
  u2: [{ id: 'o3', userId: 'u2', product: 'Doohickey', amount: 7 }],
};

// ---------------------------------------------------------------------------
// fetchUserTool — fetches a mock user by ID
// ---------------------------------------------------------------------------

export const fetchUserTool = createTool({
  id: 'fetch-user',
  description: 'Fetch a mock user record by ID.',
  inputSchema: z.object({ userId: z.string() }),
  execute: async ({ userId }) => {
    const user = MOCK_USERS[userId];
    if (!user) throw new Error(`User not found: ${userId}`);
    return user;
  },
});

// ---------------------------------------------------------------------------
// fetchOrdersTool — fetches mock orders for a user
// ---------------------------------------------------------------------------

export const fetchOrdersTool = createTool({
  id: 'fetch-orders',
  description: 'Fetch mock orders for a given user ID.',
  inputSchema: z.object({ userId: z.string() }),
  execute: async ({ userId }) => {
    return MOCK_ORDERS[userId] ?? [];
  },
});

// ---------------------------------------------------------------------------
// enrichUserTool — composite tool: fetches user + orders via safeExecuteTool
// ---------------------------------------------------------------------------

export const enrichUserTool = createTool({
  id: 'enrich-user',
  description: 'Return a user record enriched with their orders.',
  inputSchema: z.object({ userId: z.string() }),
  execute: async ({ userId }, context) => {
    const user = await safeExecuteTool(fetchUserTool, { userId }, context);
    if (!user) return null;

    const orders = await safeExecuteTool(fetchOrdersTool, { userId }, context);

    return { user, orders: orders ?? [] };
  },
});

// ---------------------------------------------------------------------------
// riskyTool — always throws (to demo graceful error handling)
// ---------------------------------------------------------------------------

export const riskyTool = createTool({
  id: 'risky-tool',
  description: 'A tool that always throws an error.',
  inputSchema: z.object({}),
  execute: async () => {
    throw new Error('Something went terribly wrong!');
  },
});

// ---------------------------------------------------------------------------
// deeplyNestedTool — recursively calls itself via safeExecuteTool
// ---------------------------------------------------------------------------

export const deeplyNestedTool = createTool({
  id: 'deeply-nested',
  description: 'Recursively calls itself to demonstrate max-depth protection.',
  inputSchema: z.object({ depth: z.number() }),
  execute: async ({ depth }, context) => {
    // Each recursive call increments depth so we can see the progression
    const result = await safeExecuteTool(deeplyNestedTool, { depth: depth + 1 }, context, { maxDepth: 3 });
    return { currentDepth: depth, childResult: result };
  },
});

// ---------------------------------------------------------------------------
// contextEchoTool — returns the userId from requestContext (for Scenario 5)
// ---------------------------------------------------------------------------

export const contextEchoTool = createTool({
  id: 'context-echo',
  description: 'Echoes the userId from the propagated requestContext.',
  inputSchema: z.object({}),
  execute: async (_input, context) => {
    // requestContext may be a plain object (in tests) or a RequestContext instance
    const rc = context?.requestContext as any;
    const userId = typeof rc?.get === 'function' ? rc.get('userId') : rc?.['userId'];
    return { receivedUserId: userId ?? null };
  },
});
