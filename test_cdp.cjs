const http = require('http');
const https = require('https');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACTS_DIR = 'C:\\Users\\VICTUS\\.gemini\\antigravity\\brain\\2d2d77ff-f556-4226-8d85-3d83e6d23261';

async function sleep(ms) {
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
    const WebSocket = await import('node:http').then(() => {
      // Create minimal WebSocket or use native if Node 22
      return globalThis.WebSocket;
    });

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
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

  async screenshot(filename, clip = null) {
    const params = { format: 'png' };
    if (clip) params.clip = clip;
    const res = await this.send('Page.captureScreenshot', params);
    const buf = Buffer.from(res.data, 'base64');
    fs.writeFileSync(filename, buf);
    console.log(`Saved screenshot: ${filename}`);
  }
}

async function run() {
  console.log('Launching headless Chrome...');
  const port = 9222;
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
      throw new Error('Could not connect to Chrome debugging port');
    }

    console.log('Connected to Chrome. Target:', targets[0].webSocketDebuggerUrl);
    const client = new CDPClient(targets[0].webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('DOM.enable');
    await client.send('Runtime.enable');

    // 1. Navigate to landing page
    console.log('Navigating to http://localhost:3000/ ...');
    await client.send('Page.navigate', { url: 'http://localhost:3000/' });
    await sleep(2000);

    // Capture Landing Page
    await client.screenshot(path.join(ARTIFACTS_DIR, '01_landing_page_hero.png'));

    // Verify Hero CTA text
    const heroBtnText = await client.evaluate(`
      document.querySelector('a[href="#optimize"]')?.innerText.trim()
    `);
    console.log('Hero CTA Button Text:', heroBtnText);

    // Verify Navbar CTA text
    const navBtnText = await client.evaluate(`
      document.querySelector('header a[href="#optimize"]')?.innerText.trim()
    `);
    console.log('Navbar CTA Button Text:', navBtnText);

    // 2. Click "Optimize Your Website"
    console.log('Clicking "Optimize Your Website" in Hero...');
    await client.evaluate(`
      document.querySelector('section#top a[href="#optimize"]').click();
    `);
    await sleep(600);

    const currentHash = await client.evaluate(`window.location.hash`);
    console.log('Current URL Hash:', currentHash);

    // Capture URL Entry Page
    await client.screenshot(path.join(ARTIFACTS_DIR, '02_url_entry_initial.png'));

    // 3. Test empty submission
    console.log('Testing empty submission...');
    await client.evaluate(`
      document.querySelector('form button[type="submit"]').click();
    `);
    await sleep(300);
    const emptyError = await client.evaluate(`
      document.getElementById('url-error')?.innerText.trim()
    `);
    console.log('Empty submission error:', emptyError);

    // 4. Test unsupported scheme (javascript:)
    console.log('Testing javascript: scheme...');
    await client.evaluate(`
      const input = document.getElementById('website-url');
      input.value = 'javascript:alert(1)';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('form button[type="submit"]').click();
    `);
    await sleep(300);
    const protoError = await client.evaluate(`
      document.getElementById('url-error')?.innerText.trim()
    `);
    console.log('Unsupported protocol error:', protoError);
    await client.screenshot(path.join(ARTIFACTS_DIR, '03_validation_error.png'));

    // 5. Test valid URL without scheme (example.com)
    console.log('Testing valid URL without scheme: example.com ...');
    await client.evaluate(`
      const input = document.getElementById('website-url');
      input.value = 'example.com';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('form button[type="submit"]').click();
    `);
    await sleep(600);

    const confirmedUrl = await client.evaluate(`
      document.querySelector('span.break-all')?.innerText.trim()
    `);
    console.log('Confirmed normalized URL displayed:', confirmedUrl);
    await client.screenshot(path.join(ARTIFACTS_DIR, '04_url_confirmed_state.png'));

    // 6. Click "Confirm Website"
    console.log('Clicking "Confirm Website"...');
    await client.evaluate(`
      const btns = Array.from(document.querySelectorAll('button'));
      const confirmBtn = btns.find(b => b.innerText.includes('Confirm Website'));
      confirmBtn?.click();
    `);
    await sleep(600);

    const submittedHeader = await client.evaluate(`
      document.querySelector('h2.font-cond')?.innerText.trim()
    `);
    console.log('Submitted stage heading:', submittedHeader);
    await client.screenshot(path.join(ARTIFACTS_DIR, '05_submitted_placeholder_state.png'));

    // 7. Click "Return to Homepage"
    console.log('Clicking "Return to Homepage"...');
    await client.evaluate(`
      const btns = Array.from(document.querySelectorAll('button'));
      const homeBtn = btns.find(b => b.innerText.includes('Return to Homepage'));
      homeBtn?.click();
    `);
    await sleep(600);
    const postHomeHash = await client.evaluate(`window.location.hash`);
    console.log('Hash after returning home:', postHomeHash);

    // 8. Test responsive viewports on URL Entry Page
    console.log('Testing viewports for URL Entry Page...');
    await client.evaluate(`window.location.hash = '#optimize'`);
    await sleep(500);

    const viewports = [
      { name: 'mobile_360x800', width: 360, height: 800 },
      { name: 'mobile_390x844', width: 390, height: 844 },
      { name: 'tablet_768x1024', width: 768, height: 1024 },
      { name: 'laptop_1280x800', width: 1280, height: 800 }
    ];

    for (const vp of viewports) {
      await client.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.width < 768
      });
      await sleep(400);
      await client.screenshot(path.join(ARTIFACTS_DIR, `06_viewport_${vp.name}.png`));
      console.log(`Captured ${vp.name}`);
    }

    console.log('ALL TESTS COMPLETED SUCCESSFULLY!');
  } finally {
    chromeProcess.kill();
  }
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
