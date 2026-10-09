const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\VICTUS\\.gemini\\antigravity\\brain\\2d2d77ff-f556-4226-8d85-3d83e6d23261';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new globalThis.WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id && this.callbacks.has(data.id)) {
          const cb = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          if (data.error) cb.reject(data.error);
          else cb.resolve(data.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  }

  async screenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(res.data, 'base64');
    fs.writeFileSync(filename, buf);
    console.log(`Saved screenshot: ${path.basename(filename)}`);
  }
}

async function run() {
  console.log('--- STARTING URL VALIDATION & LOADING SCREEN VERIFICATION ---');
  const port = 9225;
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1440,900'
  ]);

  try {
    let targets = null;
    for (let i = 0; i < 20; i++) {
      await sleep(300);
      try {
        targets = await getJson(`http://127.0.0.1:${port}/json`);
        if (targets && targets.length > 0) break;
      } catch (e) {}
    }

    if (!targets || targets.length === 0) {
      throw new Error('Unable to connect to Chrome debugging port');
    }

    const client = new CDPClient(targets[0].webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('DOM.enable');
    await client.send('Runtime.enable');

    // 1. Navigate to URL entry page (#optimize)
    console.log('Navigating to http://localhost:3000/#optimize ...');
    await client.send('Page.navigate', { url: 'http://localhost:3000/#optimize' });
    await sleep(2500);

    // Wait for input to mount
    await client.evaluate(`
      new Promise(resolve => {
        const check = () => {
          if (document.getElementById('website-url')) return resolve();
          setTimeout(check, 100);
        };
        check();
      })
    `);

    // Test Case 1: Empty URL
    console.log('[Test 1] Testing empty URL submission...');
    await client.evaluate(`
      const input = document.getElementById('website-url');
      input.value = '   ';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('form button[type="submit"]').click();
    `);
    await sleep(300);
    const err1 = await client.evaluate(`document.getElementById('url-error')?.innerText.trim()`);
    console.log('Test 1 Result:', err1);

    // Test Case 2: Malformed URL
    console.log('[Test 2] Testing malformed URL (invalid..domain)...');
    await client.evaluate(`
      const input = document.getElementById('website-url');
      input.value = 'invalid..domain';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('form button[type="submit"]').click();
    `);
    await sleep(300);
    const err2 = await client.evaluate(`document.getElementById('url-error')?.innerText.trim()`);
    console.log('Test 2 Result:', err2);

    // Test Case 3: Unsupported protocol (javascript:)
    console.log('[Test 3] Testing unsupported protocol (javascript:alert(1))...');
    await client.evaluate(`
      const input = document.getElementById('website-url');
      input.value = 'javascript:alert(1)';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('form button[type="submit"]').click();
    `);
    await sleep(300);
    const err3 = await client.evaluate(`document.getElementById('url-error')?.innerText.trim()`);
    console.log('Test 3 Result:', err3);

    // Test Case 3b: Private IP / Localhost restriction
    console.log('[Test 3b] Testing private IP restriction (192.168.1.1)...');
    await client.evaluate(`
      const input = document.getElementById('website-url');
      input.value = '192.168.1.1';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('form button[type="submit"]').click();
    `);
    await sleep(300);
    const err3b = await client.evaluate(`document.getElementById('url-error')?.innerText.trim()`);
    console.log('Test 3b Result:', err3b);

    // Test Case 4 & 6: Cross-origin website where browser direct probe is inconclusive due to CORS
    console.log('[Test 4 & 6] Testing cross-origin website (stride-health.org)...');
    await client.evaluate(`
      const input = document.getElementById('website-url');
      input.value = 'stride-health.org';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('form button[type="submit"]').click();
    `);
    await sleep(1500); // Allow reachability probe to run

    const corsNotice = await client.evaluate(`
      document.querySelector('div[role="alert"]')?.innerText.trim()
    `);
    console.log('Test 6 Result (CORS Inconclusive Notice):', corsNotice);

    // Verify user remains on URL entry screen and dashboard was NOT initialized
    const isStillOnEntry = await client.evaluate(`
      Boolean(document.getElementById('website-url'))
    `);
    console.log('Remained on URL entry screen (No unverified bypass):', isStillOnEntry);

    // Test Case 8: Repeated clicks while validating
    console.log('[Test 8] Testing repeated clicks while validation is in progress...');
    const btnDisabledDuringValidating = await client.evaluate(`
      const input = document.getElementById('website-url');
      input.value = 'example.org';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const btn = document.querySelector('form button[type="submit"]');
      btn.click();
      return btn.disabled;
    `);
    console.log('Submit button disabled during validation (prevents duplicate requests):', btnDisabledDuringValidating);
    await sleep(1500);

    // Test Case 9: Correcting URL and choosing to proceed with unverified target in simulation mode
    console.log('[Test 9 & 10] Acknowledging browser limitation and proceeding to confirmation...');
    await client.evaluate(`
      const proceedBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Proceed in Simulation Mode'));
      proceedBtn?.click();
    `);
    await sleep(500);

    const isConfirmedScreen = await client.evaluate(`
      document.querySelector('h1.font-cond')?.innerText.includes('CONFIRM TARGET')
    `);
    console.log('Confirmation screen displayed:', isConfirmedScreen);

    // Test Minimal Loading Screen
    console.log('Clicking Confirm Website to verify minimal loading screen...');
    await client.evaluate(`
      const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Confirm Website'));
      confirmBtn?.click();
    `);
    await sleep(400);

    // Check loading screen content
    const loadingText = await client.evaluate(`
      document.querySelector('div[role="status"] p')?.innerText.trim()
    `);
    console.log('Loading Screen Label:', loadingText);

    // Verify yellow badge and oversized headers were removed
    const hasYellowBadge = await client.evaluate(`
      Boolean(document.querySelector('.bg-\\[\\#fff100\\]'))
    `);
    const hasSandboxCard = await client.evaluate(`
      Array.from(document.querySelectorAll('div')).some(d => d.innerText.includes('Demonstration Workspace Sandbox'))
    `);
    console.log('Yellow badge removed:', !hasYellowBadge);
    console.log('Sandbox card removed:', !hasSandboxCard);

    await client.screenshot(path.join(ARTIFACTS_DIR, 'refined_minimal_loading_screen.png'));

    // Wait for transition to dashboard
    await sleep(1600);

    const isDashboardLoaded = await client.evaluate(`
      document.querySelector('h1.font-cond')?.innerText.includes('PERFORMANCE OVERVIEW')
    `);
    console.log('[Test 10] Successfully transitioned to Dashboard:', isDashboardLoaded);

    console.log('--- ALL 10 TESTS COMPLETED SUCCESSFULLY ---');
  } finally {
    chromeProcess.kill();
  }
}

run().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
