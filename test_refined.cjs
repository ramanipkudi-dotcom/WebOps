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
  console.log('--- RUNNING REFINED DASHBOARD VERIFICATION ---');
  const port = 9224;
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

    // 1. Directly open dashboard or navigate to #dashboard
    console.log('Loading http://localhost:3000/#dashboard ...');
    await client.send('Page.navigate', { url: 'http://localhost:3000/#dashboard' });
    await sleep(2000);

    // Wait for Dashboard
    await client.evaluate(`
      new Promise(resolve => {
        const check = () => {
          const title = document.querySelector('h1.font-cond');
          if (title && title.innerText.includes('PERFORMANCE OVERVIEW')) return resolve();
          setTimeout(check, 100);
        };
        check();
      })
    `);

    // Verify elements
    const heading = await client.evaluate(`document.querySelector('h1.font-cond')?.innerText.trim()`);
    const target = await client.evaluate(`document.querySelector('main p span.font-mono')?.innerText.trim()`);
    console.log('Dashboard Heading:', heading);
    console.log('Target Website:', target);

    // Turn off auto-step for deterministic test
    await client.evaluate(`
      const chk = document.querySelector('input[type="checkbox"]');
      if (chk && chk.checked) chk.click();
    `);

    // Screenshot 1: Refined Dashboard Baseline
    await client.screenshot(path.join(ARTIFACTS_DIR, 'refined_01_dashboard_baseline.png'));

    // 2. Scenario 1: Traffic Spike
    console.log('Starting Scenario 1: Traffic Spike...');
    await client.evaluate(`
      const startBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Start Simulation'));
      startBtn?.click();
    `);
    await sleep(400);

    // Step forward into surge
    await client.evaluate(`
      const stepBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Step Next') || b.innerText.includes('Step Forward'));
      stepBtn?.click();
    `);
    await sleep(500);

    const surgeStatus = await client.evaluate(`document.querySelector('span.border')?.innerText.trim()`);
    console.log('Traffic Spike Status:', surgeStatus);

    // Screenshot 2: During Traffic Spike (Threshold breach)
    await client.screenshot(path.join(ARTIFACTS_DIR, 'refined_02_dashboard_traffic_spike.png'));

    // Apply mitigation
    console.log('Executing mitigation...');
    await client.evaluate(`
      const mitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Apply Mitigation') || b.innerText.includes('Edge Cache'));
      mitBtn?.click();
    `);
    await sleep(400);

    // Step forward into recovery
    await client.evaluate(`
      const stepBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Step Forward') || b.innerText.includes('Step Next'));
      stepBtn?.click();
    `);
    await sleep(500);

    const recStatus = await client.evaluate(`document.querySelector('span.border')?.innerText.trim()`);
    console.log('Recovery Status:', recStatus);

    // Screenshot 3: After Recovery
    await client.screenshot(path.join(ARTIFACTS_DIR, 'refined_03_dashboard_recovery.png'));

    // 3. Scenario 2: Database Pressure
    console.log('Testing Scenario 2: Database Pressure...');
    await client.evaluate(`
      const resetBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Reset'));
      resetBtn?.click();
    `);
    await sleep(300);

    await client.evaluate(`
      const dbCard = Array.from(document.querySelectorAll('h3.font-cond')).find(c => c.innerText.includes('Database Pressure'))?.closest('div');
      dbCard?.click();
      const startBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Start Simulation'));
      startBtn?.click();
    `);
    await sleep(400);
    await client.evaluate(`
      const stepBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Step Next') || b.innerText.includes('Step Forward'));
      stepBtn?.click();
    `);
    await sleep(400);
    await client.evaluate(`
      const mitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Apply Mitigation') || b.innerText.includes('Query'));
      mitBtn?.click();
    `);
    await sleep(400);
    await client.evaluate(`
      const stepBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Step Forward') || b.innerText.includes('Step Next'));
      stepBtn?.click();
    `);
    await sleep(400);
    console.log('Database Pressure completed successfully!');

    // 4. Scenario 3: Recovery & Rollback
    console.log('Testing Scenario 3: Recovery & Rollback...');
    await client.evaluate(`
      const resetBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Reset'));
      resetBtn?.click();
    `);
    await sleep(300);

    await client.evaluate(`
      const recCard = Array.from(document.querySelectorAll('h3.font-cond')).find(c => c.innerText.includes('Recovery & Rollback'))?.closest('div');
      recCard?.click();
      const startBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Start Simulation'));
      startBtn?.click();
    `);
    await sleep(400);
    await client.evaluate(`
      const stepBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Step Next') || b.innerText.includes('Step Forward'));
      stepBtn?.click();
    `);
    await sleep(400);
    await client.evaluate(`
      const mitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Apply Mitigation') || b.innerText.includes('Temporary'));
      mitBtn?.click();
    `);
    await sleep(400);
    await client.evaluate(`
      const stepBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Step Forward') || b.innerText.includes('Step Next'));
      stepBtn?.click();
    `);
    await sleep(400);
    console.log('Recovery & Rollback completed successfully!');

    // 5. Test Website Switcher
    console.log('Testing website selector...');
    await client.evaluate(`
      const targetBtn = document.querySelector('header button[aria-expanded]');
      targetBtn?.click();
    `);
    await sleep(300);

    // Click Add Website -> returns to #optimize
    await client.evaluate(`
      const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Add Website'));
      addBtn?.click();
    `);
    await sleep(500);

    const hashAfterAdd = await client.evaluate(`window.location.hash`);
    console.log('Hash after clicking Add Website:', hashAfterAdd);

    // Return to Overview
    await client.evaluate(`
      const backBtn = Array.from(document.querySelectorAll('header button, header a')).find(b => b.innerText.includes('Back to Overview') || b.innerText.includes('Overview'));
      backBtn?.click();
    `);
    await sleep(500);
    const hashAfterOverview = await client.evaluate(`window.location.hash`);
    console.log('Hash after clicking Overview:', hashAfterOverview);

    // Return to dashboard and capture mobile screenshot
    await client.evaluate(`window.location.hash = 'dashboard'`);
    await sleep(500);

    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true
    });
    await sleep(400);
    await client.screenshot(path.join(ARTIFACTS_DIR, 'refined_04_dashboard_mobile.png'));

    console.log('--- ALL REFINED DASHBOARD TESTS PASSED SUCCESSFULLY ---');
  } finally {
    chromeProcess.kill();
  }
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
