// Step 4: capture the real website at phone size (full page + section offsets) for the phone mockup.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { launch } from './pw.mjs';
const site = pathToFileURL(path.resolve('../../index.html')).href;
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await page.goto(site, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.addStyleTag({ content: '.wa-float{display:none!important} .site-header{position:absolute!important;left:0;right:0;width:100%} .reveal{opacity:1!important;transform:none!important} *{animation:none!important;transition:none!important}' });
await page.waitForTimeout(500);
const offsets = await page.evaluate(() => {
  const y = (sel) => Math.round(document.querySelector(sel).getBoundingClientRect().top + scrollY);
  return { hero: 0, about: y('#about'), ayuros: y('[data-product="AyurOS"]') - 24, shopstock: y('[data-product="Shop Stock"]') - 24,
    custom: y('[data-product="Custom Software"]') - 24, services: y('#services'), contact: y('#contact'), height: document.documentElement.scrollHeight };
});
await page.screenshot({ path: 'build/site-full.png', fullPage: true });
fs.writeFileSync('build/site-offsets.json', JSON.stringify(offsets, null, 1));
console.log(offsets);
await browser.close();
