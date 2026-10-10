// Real Legion UI -> 2x JPEG frame sequences for the promo.
//   node capture.mjs builder|live|report|replay|import
// Output: ../voicera-motion/public/legion/ui/<scene>/NNN.jpg (3840x2160)
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import {go, open, runs} from './browser.mjs';

const scene = process.argv[2];
const OUT = new URL(`../voicera-motion/public/legion/ui/${scene}/`, import.meta.url);
fs.rmSync(OUT, {recursive: true, force: true});
fs.mkdirSync(OUT, {recursive: true});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const {browser, page} = await open({scale: 2});
let n = 0;
async function shot() {
  // hide the Next.js dev badge, it is not part of the product
  await page.addStyleTag({content: 'nextjs-portal{display:none!important}'});
  await page.screenshot({path: new URL(`${String(n++).padStart(3, '0')}.jpg`, OUT), type: 'jpeg', quality: 94});
}
const text = (tag, t) => `${tag}::-p-text(${t})`;
async function typeSlow(selector, value, every = 3) {
  await page.click(selector);
  for (let i = 0; i < value.length; i += every) {
    await page.type(selector, value.slice(i, i + every));
    await shot();
  }
}
async function scrollTo(label) {
  await page.evaluate((label) => {
    const el = [...document.querySelectorAll('h1,h2,h3,div,p,span')].find((e) => e.textContent?.trim() === label);
    el?.scrollIntoView({block: 'start'});
  }, label);
  await sleep(600);
}

if (scene === 'builder') {
  await go(page, '/campaigns/new');
  await page.type('#c-name', 'Billing & account changes — weekly check');
  await page.click(text('button', 'Voice agent'));
  await shot();
  await page.click(text('button', 'Next'));
  await sleep(400);
  for (const chip of ['Frustrated senior', 'Anxious', 'Banking', 'Pushy', 'Confused', 'Prompt injection', 'PII extraction']) {
    await page.click(text('label.card', chip)); // AxisPicker chips are <label> + checkbox
    await sleep(120);
    await shot();
  }
  await page.click(text('button', 'Next'));
  await sleep(400);
  await page.click(text('button', 'Add a rule'));
  await sleep(300);
  await page.click('[role="combobox"]');
  await sleep(300);
  await shot();
  await page.click(text('[role="option"]', 'AI judge check'));
  await sleep(300);
  await shot();
  await typeSlow('input[placeholder="e.g. apologize and offer a refund"]', "Verify the caller's identity before changing account details");
  await sleep(300);
  await shot();
} else if (scene === 'live') {
  // needs: python agent_server.py running, then `python seed.py live` just before this
  execFileSync('python', ['seed.py', 'live'], {stdio: 'inherit'});
  const {live} = JSON.parse(fs.readFileSync(new URL('./data/runs.json', import.meta.url)));
  await go(page, `/runs/${live}`, 'domcontentloaded');
  for (let i = 0; i < 120; i++) {
    await shot();
    const done = await page.evaluate(() => document.body.innerText.includes('All work finished'));
    if (done) break;
    await sleep(250);
  }
  await shot();
} else if (scene === 'report') {
  await go(page, `/runs/${runs.story}/report`);
  await sleep(1500); // count-up/chart animations finish
  await shot();
  await scrollTo('Metric scores');
  await shot();
} else if (scene === 'replay') {
  await go(page, `/runs/${runs.story}/replay?sim=${runs.hero}`);
  await scrollTo('Conversation');
  await shot();
} else if (scene === 'import') {
  await go(page, '/runs/import');
  await page.click('[role="combobox"]');
  await sleep(300);
  await page.click(text('[role="option"]', 'banking-assistant'));
  await sleep(300);
  const turns = [
    ["Sure! What's the new address you'd like on file?", 'Hi, I need to update my billing address.'],
    ['Done, your billing address is updated.', 'Great, thank you.'],
  ];
  for (let i = 0; i < turns.length; i++) {
    if (i > 0) await page.click(text('button', 'Add turn'));
    await sleep(200);
    const aut = await page.$$('input[placeholder="AUT utterance"], textarea[placeholder="AUT utterance"]');
    const caller = await page.$$('input[placeholder="Caller utterance"], textarea[placeholder="Caller utterance"]');
    await aut[i].type(turns[i][0]);
    await caller[i].type(turns[i][1]);
  }
  await page.type('input[placeholder="CDR id / recording filename"]', 'prod-call-2026-09-28-1142.wav');
  await shot();
  await page.click(text('button', 'Import & score'));
  await sleep(2500);
  await shot();
}
await browser.close();
console.log(scene, n, 'frames');
