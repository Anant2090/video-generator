// One full-page screenshot per target page -> data/probe/*.png (layout reconnaissance).
import fs from 'node:fs';
import {go, open, runs} from './browser.mjs';

const pages = {
  home: '/',
  builder: '/campaigns/new',
  run: `/runs/${runs.story}`,
  report: `/runs/${runs.story}/report`,
  replay: `/runs/${runs.story}/replay?sim=${runs.hero}`,
  import: '/runs/import',
};
fs.mkdirSync('data/probe', {recursive: true});
const {browser, page} = await open();
for (const [name, path] of Object.entries(pages)) {
  await go(page, path);
  await page.screenshot({path: `data/probe/${name}.png`, fullPage: true});
  console.log(name, await page.evaluate(() => document.body.scrollHeight));
}
await browser.close();
