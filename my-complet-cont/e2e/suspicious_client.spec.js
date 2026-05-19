import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

// Client credentials — must exist in the database
const CLIENT_EMAIL    = 'j.doe@acme.com';
const CLIENT_PASSWORD = 'client123';

async function login(page) {
  await page.goto(BASE_URL);
  await page.getByRole('button', { name: /get started/i }).click();
  await page.locator('input[type="email"]').fill(CLIENT_EMAIL);
  await page.locator('input[type="password"]').fill(CLIENT_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForTimeout(2000);
}

test('suspicious client behaviour simulation', async ({ page }) => {
  // This test intentionally triggers suspicious behaviour detection.
  // It is meant to be run to generate flags in the admin panel.
  // The test "passes" when the suspicious behaviour has been performed —
  // the actual detection happens on the backend.

  test.setTimeout(120000);

  await login(page);

  console.log('Bot logged in. Starting suspicious behaviour simulation...');

  // ── Phase 1: Rapid repeated requests ─────────────────────────────────────
  console.log('Phase 1: Rapid requests...');
  for (let i = 0; i < 35; i++) {
    await page.reload();
    await page.waitForTimeout(100);
    if (i % 10 === 0) console.log(`  Reload ${i}/35`);
  }

  // ── Phase 2: Attempt to access forbidden URLs ─────────────────────────────
  console.log('Phase 2: Accessing forbidden endpoints...');
  const API_BASE = 'http://localhost:8000';
  const token = await page.evaluate(() => localStorage.getItem('cc_token'));

  for (let i = 0; i < 15; i++) {
    await page.evaluate(async ({ base, tok }) => {
      await fetch(`${base}/records?page=1&page_size=100`, {
        headers: { 'Authorization': `Bearer ${tok}` }
      });
    }, { base: API_BASE, tok: token });
    await page.waitForTimeout(200);
  }
  console.log('  Forbidden endpoint attempts done.');

  // ── Phase 3: Rapid toggle of observations ────────────────────────────────
  console.log('Phase 3: Rapid observation toggles...');
  const toggleBtn = page.locator('input[type="checkbox"]').first();
  const toggleExists = await toggleBtn.count();
  if (toggleExists > 0) {
    for (let i = 0; i < 20; i++) {
      await toggleBtn.click();
      await page.waitForTimeout(150);
    }
    console.log('  Observation toggles done.');
  } else {
    console.log('  No observations found to toggle, skipping.');
  }

  // ── Phase 4: Simulate failed API calls with bad tokens ────────────────────
  console.log('Phase 4: Bad token attempts...');
  for (let i = 0; i < 10; i++) {
    await page.evaluate(async (base) => {
      await fetch(`${base}/records`, {
        headers: { 'Authorization': 'Bearer fake.token.here' }
      });
    }, API_BASE);
    await page.waitForTimeout(100);
  }
  console.log('  Bad token attempts done.');

  console.log('Suspicious behaviour simulation complete.');
  console.log('Check the admin panel — suspicious flags should now appear.');
  console.log('Ollama will generate AI explanations within a few seconds.');

  expect(true).toBe(true);
});
