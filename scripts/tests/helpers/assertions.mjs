const results = [];

export function pass(name, detail) {
  results.push({ name, status: "PASS", detail });
  console.log(`  \x1b[32m✓ PASS\x1b[0m ${name}${detail ? ` — ${detail}` : ""}`);
}

export function fail(name, detail) {
  results.push({ name, status: "FAIL", detail });
  console.log(`  \x1b[31m✗ FAIL\x1b[0m ${name} — ${detail}`);
}

export function skip(name, reason) {
  results.push({ name, status: "SKIP", detail: reason });
  console.log(`  \x1b[33m○ SKIP\x1b[0m ${name} — ${reason}`);
}

export function section(title) {
  console.log(`\n\x1b[1m── ${title} ──\x1b[0m`);
}

export async function timed(name, fn) {
  const start = performance.now();
  const result = await fn();
  const ms = (performance.now() - start).toFixed(0);
  return { result, ms: Number(ms) };
}

export function getResults() {
  return [...results];
}

export function resetResults() {
  results.length = 0;
}

export function printSummary() {
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;
  const skipped = results.filter((r) => r.status === "SKIP").length;

  console.log("\n\x1b[1m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m");
  console.log(`\x1b[1m  Results: \x1b[32m${passed} passed\x1b[0m, \x1b[31m${failed} failed\x1b[0m, \x1b[33m${skipped} skipped\x1b[0m`);
  console.log("\x1b[1m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n");

  if (failed > 0) {
    console.log("\x1b[31mFailed tests:\x1b[0m");
    results
      .filter((r) => r.status === "FAIL")
      .forEach((r) => console.log(`  • ${r.name}: ${r.detail}`));
    console.log("");
  }

  return { passed, failed, skipped, total: results.length };
}
