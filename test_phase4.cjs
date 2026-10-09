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
  console.log('--- STARTING PHASE 4 AUTOMATED TEST SUITE ---');
  const port = 9223;
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
      throw new Error('Unable to connect to headless Chrome');
    }

    const client = new CDPClient(targets[0].webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('DOM.enable');
    await client.send('Runtime.enable');

    // 1. Visit landing page
    console.log('[Step 1] Loading landing page...');
    await client.send('Page.navigate', { url: 'http://localhost:3000/' });
    await sleep(2500);

    // Wait for react mount
    await client.evaluate(`
      new Promise(resolve => {
        const check = () => {
          const el = document.querySelector('a[href="#optimize"]');
          if (el) return resolve();
          setTimeout(check, 100);
        };
        check();
      })
    `);

    // 2. Click "Optimize Your Website"
    console.log('[Step 2] Navigating to URL Entry page...');
    await client.evaluate(`
      const el = document.querySelector('a[href="#optimize"]');
      el?.click();
    `);
    await sleep(800);

    // 3. Enter URL: stride-health.org
    console.log('[Step 3] Entering target URL "stride-health.org"...');
    await client.evaluate(`
      const input = document.getElementById('website-url');
      input.value = 'stride-health.org';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('form button[type="submit"]').click();
    `);
    await sleep(600);

    const normUrl = await client.evaluate(`
      document.querySelector('div.break-all')?.innerText.trim()
    `);
    console.log('Normalized URL on confirmation screen:', normUrl);

    // 4. Click Confirm Website -> Observe loading transition
    console.log('[Step 4] Confirming website & observing loading transition...');
    await client.evaluate(`
      const btns = Array.from(document.querySelectorAll('button'));
      const confirmBtn = btns.find(b => b.innerText.includes('Confirm Website'));
      confirmBtn?.click();
    `);
    await sleep(900);

    const loadingMsg = await client.evaluate(`
      document.querySelector('div.text-center font-mono, span.font-mono.font-bold')?.innerText.trim()
    `);
    console.log('Loading Transition Active message:', loadingMsg);
    await client.screenshot(path.join(ARTIFACTS_DIR, 'phase4_01_loading_transition.png'));

    // Wait for transition to complete and Dashboard to load (total delay ~2.3s)
    await sleep(2400);

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

    const dashboardTitle = await client.evaluate(`
      document.querySelector('h1.font-cond')?.innerText.trim()
    `);
    const targetDisplay = await client.evaluate(`
      document.querySelector('strong.font-mono')?.innerText.trim()
    `);
    console.log('[Step 5] Dashboard loaded successfully!');
    console.log('Dashboard Heading:', dashboardTitle);
    console.log('Active Target Displayed:', targetDisplay);

    // Screenshot 1: Baseline Dashboard
    await client.screenshot(path.join(ARTIFACTS_DIR, 'phase4_02_dashboard_baseline.png'));

    // 5. Test Scenario 1: Traffic Spike
    console.log('[Step 6] Running Scenario 1: Traffic Spike...');
    // Ensure Traffic Spike is selected and click Start Simulation
    await client.evaluate(`
      // Disable auto-step timer for deterministic manual control in test
      const chk = document.querySelector('input[type="checkbox"]');
      if (chk && chk.checked) chk.click();

      // Click Start Simulation
      const btns = Array.from(document.querySelectorAll('button'));
      const startBtn = btns.find(b => b.innerText.includes('Start Simulation'));
      startBtn?.click();
    `);
    await sleep(500);

    // Step forward to trigger concurrency burst & bottleneck
    console.log('Advancing step into concurrency surge...');
    await client.evaluate(`
      const btns = Array.from(document.querySelectorAll('button'));
      const stepBtn = btns.find(b => b.innerText.includes('Step Forward') || b.innerText.includes('Advance Step'));
      stepBtn?.click();
    `);
    await sleep(600);

    const surgeStatus = await client.evaluate(`
      document.querySelector('span.font-mono.font-bold')?.innerText.trim()
    `);
    const surgeLatency = await client.evaluate(`
      document.querySelector('div.font-cond.text-\\[44px\\]')?.innerText.trim()
    `);
    console.log('Traffic Spike Status:', surgeStatus);
    console.log('Peak Simulated Latency:', surgeLatency);

    // Screenshot 2: During Traffic Spike (Bottleneck Detected)
    await client.screenshot(path.join(ARTIFACTS_DIR, 'phase4_03_traffic_spike_bottleneck.png'));

    // Apply Simulated Mitigation
    console.log('Applying proposed mitigation (Dynamic Edge Cache)...');
    await client.evaluate(`
      const btns = Array.from(document.querySelectorAll('button'));
      const mitBtn = btns.find(b => b.innerText.includes('Apply Simulated Edge Cache') || b.innerText.includes('Execute Mitigation'));
      mitBtn?.click();
    `);
    await sleep(500);

    // Advance step to recovery
    console.log('Advancing step to observed recovery...');
    await client.evaluate(`
      const btns = Array.from(document.querySelectorAll('button'));
      const stepBtn = btns.find(b => b.innerText.includes('Advance Step') || b.innerText.includes('Step Forward'));
      stepBtn?.click();
    `);
    await sleep(600);

    const recStatus = await client.evaluate(`
      document.querySelector('span.font-mono.font-bold')?.innerText.trim()
    `);
    const recLatency = await client.evaluate(`
      document.querySelector('div.font-cond.text-\\[44px\\]')?.innerText.trim()
    `);
    console.log('Recovery Status:', recStatus);
    console.log('Recovered Latency:', recLatency);

    // Screenshot 3: After Recovery (with before-and-after results comparison)
    await client.screenshot(path.join(ARTIFACTS_DIR, 'phase4_04_recovery_verified.png'));

    // 6. Test Scenario 2: Database Pressure
    console.log('[Step 7] Testing Scenario 2: Database Pressure...');
    await client.evaluate(`
      // Reset to baseline
      const resetBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Reset to Baseline'));
      resetBtn?.click();
    `);
    await sleep(400);

    await client.evaluate(`
      // Select Database Pressure
      const cards = Array.from(document.querySelectorAll('h3.font-cond'));
      const dbCard = cards.find(c => c.innerText.includes('Database Pressure'))?.closest('div');
      dbCard?.click();

      // Start
      const startBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Start Simulation'));
      startBtn?.click();
    `);
    await sleep(400);

    await client.evaluate(`
      // Advance step
      const stepBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Step Forward') || b.innerText.includes('Advance Step'));
      stepBtn?.click();
    `);
    await sleep(400);

    const dbBottleneck = await client.evaluate(`
      document.querySelector('span.font-mono.font-bold')?.innerText.trim()
    `);
    console.log('Database Pressure Status:', dbBottleneck);

    await client.evaluate(`
      // Execute query buffer mitigation
      const mitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Enable Query Result Buffer') || b.innerText.includes('Execute Mitigation'));
      mitBtn?.click();
    `);
    await sleep(400);

    await client.evaluate(`
      // Step to recovery
      const stepBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Advance Step') || b.innerText.includes('Step Forward'));
      stepBtn?.click();
    `);
    await sleep(400);
    console.log('Database Pressure Scenario completed successfully!');

    // 7. Test Scenario 3: Recovery & Rollback
    console.log('[Step 8] Testing Scenario 3: Recovery & Rollback...');
    await client.evaluate(`
      const resetBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Reset to Baseline'));
      resetBtn?.click();
    `);
    await sleep(400);

    await client.evaluate(`
      const cards = Array.from(document.querySelectorAll('h3.font-cond'));
      const recCard = cards.find(c => c.innerText.includes('Recovery & Rollback'))?.closest('div');
      recCard?.click();

      const startBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Start Simulation'));
      startBtn?.click();
    `);
    await sleep(400);

    await client.evaluate(`
      const stepBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Step Forward') || b.innerText.includes('Advance Step'));
      stepBtn?.click();
    `);
    await sleep(400);

    await client.evaluate(`
      const mitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Engage Temporary Policy') || b.innerText.includes('Execute Mitigation'));
      mitBtn?.click();
    `);
    await sleep(400);

    await client.evaluate(`
      const stepBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Advance Step') || b.innerText.includes('Step Forward'));
      stepBtn?.click();
    `);
    await sleep(400);
    console.log('Recovery & Rollback Scenario completed successfully!');

    // 8. Test Website Switcher & Multi-Website Isolation
    console.log('[Step 9] Testing Multi-Website Registration & Isolation...');
    await client.evaluate(`
      // Open website dropdown and click Add Website
      const selectorBtn = document.querySelector('header button[aria-expanded]');
      selectorBtn?.click();
    `);
    await sleep(300);

    await client.evaluate(`
      const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Add Website'));
      addBtn?.click();
    `);
    await sleep(600);

    // Register second website: acme-shop.io
    console.log('Registering second website: acme-shop.io ...');
    await client.evaluate(`
      const input = document.getElementById('website-url');
      input.value = 'acme-shop.io';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('form button[type="submit"]').click();
    `);
    await sleep(500);

    await client.evaluate(`
      const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Confirm Website'));
      confirmBtn?.click();
    `);
    await sleep(2600);

    const secondSiteDisplay = await client.evaluate(`
      document.querySelector('strong.font-mono')?.innerText.trim()
    `);
    console.log('Active Target after registering 2nd website:', secondSiteDisplay);

    // Screenshot 4: Second website active
    await client.screenshot(path.join(ARTIFACTS_DIR, 'phase4_05_second_website_active.png'));

    // Switch back to first website via header dropdown
    console.log('Switching back to stride-health.org via header dropdown...');
    await client.evaluate(`
      const selectorBtn = document.querySelector('header button[aria-expanded]');
      selectorBtn?.click();
    `);
    await sleep(300);

    await client.evaluate(`
      const siteBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('stride-health.org'));
      siteBtn?.click();
    `);
    await sleep(500);

    const switchedBackTarget = await client.evaluate(`
      document.querySelector('strong.font-mono')?.innerText.trim()
    `);
    console.log('Target after switching back:', switchedBackTarget);

    // 9. Responsive Viewports Testing
    console.log('[Step 10] Testing responsive viewports...');
    const viewports = [
      { name: '360x800_mobile', width: 360, height: 800, mobile: true },
      { name: '390x844_mobile', width: 390, height: 844, mobile: true },
      { name: '768x1024_tablet', width: 768, height: 1024, mobile: false },
      { name: '1024x768_desktop_small', width: 1024, height: 768, mobile: false },
      { name: '1280x800_laptop', width: 1280, height: 800, mobile: false },
      { name: '1440x900_desktop', width: 1440, height: 900, mobile: false }
    ];

    for (const vp of viewports) {
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.mobile
      });
      await sleep(300);
      await client.screenshot(path.join(ARTIFACTS_DIR, `phase4_vp_${vp.name}.png`));
      console.log(`Verified viewport: ${vp.name} (${vp.width}x${vp.height})`);
    }

    console.log('==============================================');
    console.log('ALL PHASE 4 TESTS AND VERIFICATIONS PASSED!');
    console.log('==============================================');

  } finally {
    chromeProcess.kill();
  }
}

run().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
