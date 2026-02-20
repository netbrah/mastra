import { safeExecuteTool } from '@mastra/core/tools';
import { enrichUserTool, riskyTool, deeplyNestedTool, contextEchoTool } from './tools.js';

let allPassed = true;

function pass(msg: string) {
  console.log(`✅ ${msg}`);
}

function fail(msg: string) {
  console.log(`❌ ${msg}`);
  allPassed = false;
}

async function main() {
  // -------------------------------------------------------------------------
  // Scenario 1: Basic nested tool composition
  // -------------------------------------------------------------------------
  console.log('\n=== Scenario 1: Basic Nested Tool Composition ===');
  const enriched = await enrichUserTool.execute?.({ userId: 'u1' }, undefined as any);
  console.log(JSON.stringify(enriched, null, 2));
  if (enriched && enriched.user?.name === 'Alice' && enriched.orders?.length === 2) {
    pass('Scenario 1 passed');
  } else {
    fail('Scenario 1 failed — unexpected result');
  }

  // -------------------------------------------------------------------------
  // Scenario 2: Graceful error handling
  // -------------------------------------------------------------------------
  console.log('\n=== Scenario 2: Graceful Error Handling ===');
  const riskyResult = await safeExecuteTool(riskyTool, {});
  console.log(JSON.stringify(riskyResult, null, 2));
  if (riskyResult === null) {
    pass('Scenario 2 passed — riskyTool returned null instead of throwing');
  } else {
    fail('Scenario 2 failed — expected null');
  }

  // -------------------------------------------------------------------------
  // Scenario 3: Max depth protection
  // -------------------------------------------------------------------------
  console.log('\n=== Scenario 3: Max Depth Protection ===');
  // Call with maxDepth: 3. The tool calls itself recursively; safeExecuteTool
  // stops execution once depth >= maxDepth and returns null.
  const deepResult = await safeExecuteTool(deeplyNestedTool, { depth: 0 }, undefined, { maxDepth: 3 });
  console.log(JSON.stringify(deepResult, null, 2));
  // The top-level call succeeds (depth 0 < 3) but recursive calls are cut off.
  // Verify the childResult at some level is null (recursion was stopped).
  function hasNullChild(r: any): boolean {
    if (r === null) return true;
    if (r?.childResult === null) return true;
    return hasNullChild(r?.childResult);
  }
  if (hasNullChild(deepResult)) {
    pass('Scenario 3 passed — recursion stopped at maxDepth: 3');
  } else {
    fail('Scenario 3 failed — expected recursion to stop');
  }

  // -------------------------------------------------------------------------
  // Scenario 4: AbortSignal respect
  // -------------------------------------------------------------------------
  console.log('\n=== Scenario 4: AbortSignal Respect ===');
  const controller = new AbortController();
  controller.abort();
  const abortedResult = await safeExecuteTool(
    enrichUserTool,
    { userId: 'u1' },
    { abortSignal: controller.signal } as any,
  );
  console.log(JSON.stringify(abortedResult, null, 2));
  if (abortedResult === null) {
    pass('Scenario 4 passed — aborted signal returned null immediately');
  } else {
    fail('Scenario 4 failed — expected null when signal is aborted');
  }

  // -------------------------------------------------------------------------
  // Scenario 5: Context propagation
  // -------------------------------------------------------------------------
  console.log('\n=== Scenario 5: Context Propagation ===');
  // Pass a mock requestContext that contains a userId.
  // safeExecuteTool spreads context into the child call so the inner tool
  // receives the same requestContext.
  const mockContext = {
    requestContext: { userId: 'ctx-user-42' },
  } as any;
  const ctxResult = await safeExecuteTool(contextEchoTool, {}, mockContext);
  console.log(JSON.stringify(ctxResult, null, 2));
  if (ctxResult?.receivedUserId === 'ctx-user-42') {
    pass('Scenario 5 passed — context propagated correctly');
  } else {
    fail('Scenario 5 failed — context not propagated');
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n========================================');
  if (allPassed) {
    console.log('✅ All 5 scenarios passed!');
    console.log('safeExecuteTool is ready for production use.');
  } else {
    console.log('❌ Some scenarios failed — see output above.');
  }
  console.log('See: https://github.com/mastra-ai/mastra/pull/13084');
  console.log('========================================');

  process.exit(allPassed ? 0 : 1);
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
