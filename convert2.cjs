const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
  try {
    let execPath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    if (!fs.existsSync(execPath)) {
        execPath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    }

    const browser = await puppeteer.launch({
      executablePath: execPath,
      defaultViewport: { width: 1200, height: 630 }
    });
    const page = await browser.newPage();
    await page.goto('file://' + path.resolve('og-image.html'), { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'public/og-image.png' });
    
    // Also take a screenshot for apple-touch-icon.png
    const iconHtml = `
    <!DOCTYPE html>
    <html>
    <head><style>body{margin:0;background:transparent;display:flex;align-items:center;justify-content:center;height:100vh;}</style></head>
    <body>
      <div style="position: relative; width: 384px; height: 384px; flex-shrink: 0;">
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: #FF6666; border: 32px solid black; transform: translate(32px, 32px); box-sizing: border-box;"></div>
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: #E0FF4F; border: 32px solid black; display: flex; align-items: center; justify-content: center; font-family: Arial, sans-serif; font-weight: 900; font-size: 256px; color: black; box-sizing: border-box;">
          K
        </div>
      </div>
    </body>
    </html>
    `;
    fs.writeFileSync('icon-render.html', iconHtml);
    await page.setViewport({ width: 512, height: 512 });
    await page.goto('file://' + path.resolve('icon-render.html'), { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'public/apple-touch-icon.png', omitBackground: true });
    
    await browser.close();
    console.log('Success');
  } catch (e) {
    console.error(e);
  }
})();
