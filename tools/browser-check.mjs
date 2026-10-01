import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

// Start Chrome with --remote-debugging-port=9225 and the Vite server first.
// API requests are intercepted inside this isolated tab: smoke tests never write user data.
const origin = process.argv[2] || process.env.CUBE_TEST_ORIGIN || 'http://127.0.0.1:5173';
const target = await (
  await fetch('http://127.0.0.1:9225/json/new?about:blank', { method: 'PUT' })
).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve);
  ws.addEventListener('error', reject);
});
let sequence = 0;
const pending = new Map();
const errors = [];
ws.addEventListener('message', (message) => {
  const data = JSON.parse(message.data);
  if (data.method === 'Runtime.exceptionThrown') errors.push(data.params.exceptionDetails.text);
  if (!data.id) return;
  const task = pending.get(data.id);
  pending.delete(data.id);
  if (data.error) task.reject(new Error(data.error.message));
  else task.resolve(data.result);
});
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails)
    throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function until(expression) {
  const start = Date.now();
  while (!(await evaluate(`Boolean(${expression})`))) {
    if (Date.now() - start > 10000) throw new Error(`Timed out: ${expression}`);
    await new Promise((resolve) => setTimeout(resolve, 70));
  }
}
async function click(selector) {
  await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
}
async function button(text) {
  await evaluate(
    `(() => { const el = [...document.querySelectorAll('button')].find(el => el.textContent.trim() === ${JSON.stringify(text)} && el.getClientRects().length); if (!el) throw new Error('Button missing: ' + ${JSON.stringify(text)}); el.click(); })()`,
  );
}
async function input(selector, value, kind = 'input') {
  await evaluate(
    `(() => { const el = document.querySelector(${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(${kind === 'select' ? 'HTMLSelectElement' : 'HTMLInputElement'}.prototype, 'value').set.call(el, ${JSON.stringify(value)}); el.dispatchEvent(new Event(${JSON.stringify(kind === 'select' ? 'change' : 'input')}, { bubbles: true })); })()`,
  );
}
async function viewport(width, height) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
}
async function screenshot(name) {
  await evaluate('document.fonts.ready.then(() => true)');
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(`/tmp/cube-kitchen-${name}.png`, Buffer.from(shot.data, 'base64'));
}
async function checkWidth(name) {
  assert.ok(
    await evaluate('document.documentElement.scrollWidth <= window.innerWidth'),
    `${name} has horizontal overflow`,
  );
}
const state = () => evaluate("JSON.parse(localStorage.getItem('cube-kitchen:v1')).data");
try {
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `if (!sessionStorage.getItem('cube-smoke-started')) { Object.keys(localStorage).filter(key => key === 'cube-kitchen:v1' || key === 'cube-kitchen:last-cook' || key.startsWith('cube-kitchen:cook:')).forEach(key => localStorage.removeItem(key)); sessionStorage.setItem('cube-smoke-started', '1'); } const originalFetch = window.fetch.bind(window); window.fetch = (input, init) => { const url = typeof input === 'string' ? input : input.url; if (new URL(url, location.href).pathname === '/api/cubes') return Promise.resolve(new Response(null, { status: init?.method === 'PUT' ? 204 : 404 })); return originalFetch(input, init); };`,
  });
  await viewport(1440, 1120);
  await send('Page.navigate', { url: origin });
  await until(
    "document.querySelector('.hero') && [...document.querySelectorAll('.hero img')].every(i=>i.complete && i.naturalWidth)",
  );
  await screenshot('desktop');
  await checkWidth('desktop overview');
  await viewport(390, 844);
  await screenshot('mobile');
  await checkWidth('mobile overview');
  await button('Add batch');
  await until("document.querySelector('[role=dialog]')");
  await screenshot('mobile-batch');
  await checkWidth('batch form');
  await input('input[name=total]', '14');
  await input('input[name=cubesPerServing]', '2');
  await input('input[name=location]', 'Top drawer');
  await button('Add to freezer');
  await until("!document.querySelector('[role=dialog]')");
  await until("localStorage.getItem('cube-kitchen:v1') !== null");
  assert.equal((await state()).batches[0].remaining, 14);
  await click('nav a[href="/freezer"]');
  await until("document.querySelector('.batch-card')");
  await screenshot('mobile-freezer');
  await checkWidth('freezer');
  await click('nav a[href="/overview"]');
  await until("document.querySelector('.hero')");
  await button('Add today’s first meal');
  await until("document.querySelector('[role=dialog]')");
  await input('.form-grid select', 'lunch', 'select');
  await input('.component-row select', 'chicken-chicken-karahi', 'select');
  await button('Save meal');
  await until("!document.querySelector('[role=dialog]')");
  await click('.today-meal');
  await button('Mark eaten');
  await until("!document.querySelector('[role=dialog]')");
  assert.equal((await state()).batches[0].remaining, 12);
  const previousDocument = await evaluate('performance.timeOrigin');
  await send('Page.reload');
  await until(
    `performance.timeOrigin !== ${previousDocument} && document.querySelector('.today-meal')`,
  );
  assert.equal((await state()).batches[0].remaining, 12);
  await click('.today-meal');
  await button('Undo eaten & restore cubes');
  await until("!document.querySelector('[role=dialog]')");
  assert.equal((await state()).batches[0].remaining, 14);
  await click('nav a[href="/plan"]');
  await until("document.querySelector('.calendar-toolbar')");
  await click('button[aria-label="Next month"]');
  await button('Build monthly plan');
  await until("document.querySelector('.generator-layout')");
  await checkWidth('monthly generator');
  await screenshot('mobile-generator');
  await click('.modal-actions button[type=submit]');
  await until("!document.querySelector('[role=dialog]')");
  assert.ok((await state()).meals.length >= 113);
  assert.equal((await state()).batches[0].remaining, 14);
  await checkWidth('monthly plan');
  await screenshot('mobile-plan');
  await viewport(1440, 1120);
  await screenshot('desktop-plan');
  await checkWidth('desktop plan');
  await click('nav a[href="/recipes"]');
  await until('document.querySelector(\'[aria-label="Search recipes"]\')');
  await input('[aria-label="Search recipes"]', 'karahi');
  await until("document.querySelectorAll('.recipe-card').length === 1");
  await click('.favorite');
  await click('.recipe-card h3 a');
  await until("[...document.querySelectorAll('h2')].some(el => el.textContent === 'Reheat')");
  await screenshot('desktop-recipe');
  await viewport(390, 844);
  await checkWidth('mobile recipe');
  await screenshot('mobile-recipe');
  assert.equal((await state()).favorites.length, 1);
  await click('nav a[href="/today"]');
  await until("document.querySelector('.day-meal')");
  await checkWidth('daily menu');
  await screenshot('mobile-today');
  await button('Mark eaten');
  await until("document.querySelector('.meal-eaten')");
  assert.equal((await state()).batches[0].remaining, 12);
  await button('Undo eaten');
  await until("!document.querySelector('.meal-eaten')");
  assert.equal((await state()).batches[0].remaining, 14);
  const menuDate = await evaluate('document.querySelector(\'[aria-label="Menu date"]\').value');
  await click('button[aria-label="Next day"]');
  await until(
    `document.querySelector('[aria-label="Menu date"]').value !== ${JSON.stringify(menuDate)}`,
  );
  await button('Back to today');
  await until("document.querySelector('.day-meal')");
  await click('.day-component a[href="/cook/chicken-chicken-karahi"]');
  await until("document.querySelector('.ingredient-checklist')");
  await click('.ingredient-checklist input');
  await screenshot('mobile-cook-ingredients');
  await checkWidth('cooking ingredients');
  await button('Start cooking');
  await button('Next step');
  await until("document.querySelector('.cook-step .eyebrow').textContent.includes('STEP 2')");
  await screenshot('mobile-cook-method');
  const cookingDocument = await evaluate('performance.timeOrigin');
  await send('Page.reload');
  await until(
    `performance.timeOrigin !== ${cookingDocument} && document.querySelector('.cook-step .eyebrow')?.textContent.includes('STEP 2')`,
  );
  await button('Ingredients');
  assert.ok(await evaluate("document.querySelector('.ingredient-checklist input').checked"));
  await button('Method');
  for (const width of [320, 390, 768, 1440]) {
    await viewport(width, 844);
    await checkWidth(`cooking at ${width}px`);
  }
  await screenshot('desktop-cook');
  await viewport(390, 844);
  await evaluate("document.documentElement.dataset.theme = 'midnight'");
  await screenshot('mobile-cook-dark');
  await evaluate("document.documentElement.dataset.theme = 'light'");
  await button('Freeze');
  await checkWidth('freezing instructions');
  await button('Reheat');
  await checkWidth('reheating instructions');
  await click('nav a[href="/cook"]');
  await until("document.querySelector('.resume-cooking')");
  await screenshot('mobile-cook-picker');
  await input('[aria-label="Find a recipe to cook"]', 'nomatchxyz');
  await until("document.querySelector('.phone-page .empty-state')");
  await button('Show all recipes');
  await until("document.querySelector('.cook-recipe-option')");
  await viewport(320, 740);
  await checkWidth('small phone recipe picker');
  await send('Page.navigate', { url: origin });
  await until("location.pathname === '/today' && document.querySelector('.day-meal')");
  await checkWidth('small phone daily menu');
  assert.equal(
    await evaluate(
      "[...document.querySelectorAll('.sidebar nav a')].filter(el => el.getClientRects().length).length",
    ),
    5,
  );
  assert.deepEqual(errors, []);
  console.log(
    'Browser checks passed: desktop/mobile layouts, batch logging, planning, eating/undo, daily menu, phone landing, cooking/checklist persistence, day navigation, search, favorites, light/dark recipes. Screenshots: /tmp/cube-kitchen-*.png',
  );
} finally {
  await send('Page.close').catch(() => {});
  ws.close();
}
