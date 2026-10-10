// Shared headless Chrome for captures: real Legion UI on :3000, authed to the local capture backend.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

export const APP = 'http://localhost:3000';
export const runs = JSON.parse(fs.readFileSync(new URL('./data/runs.json', import.meta.url)));

const CONNECTION = {
  baseUrl: 'http://127.0.0.1:8080',
  authMode: 'apiKey',
  credential: 'demo-capture-key', // local demo tenant key (seed/api.py), not a real credential
  user: null,
  configured: true,
};

export async function open({scale = 1} = {}) {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--hide-scrollbars', '--force-color-profile=srgb'],
    defaultViewport: {width: 1920, height: 1080, deviceScaleFactor: scale},
  });
  const page = await browser.newPage();
  await page.evaluateOnNewDocument((c) => sessionStorage.setItem('legion.connection', c), JSON.stringify(CONNECTION));
  await page.emulateMediaFeatures([{name: 'prefers-color-scheme', value: 'light'}]);
  return {browser, page};
}

// waitUntil networkidle0 would hang on the live run page: its SSE stream stays open until the run ends.
export async function go(page, path, waitUntil = 'networkidle0') {
  await page.goto(APP + path, {waitUntil, timeout: 180_000});
  await new Promise((r) => setTimeout(r, 1200)); // entrance animations settle
}
