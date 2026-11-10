// Builds one venue into dist/<venue>/.   node build.mjs [--venue picklezone-tagum]
import { writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { renderPage } from './src/render.js';

const root = dirname(fileURLToPath(import.meta.url));
const i = process.argv.indexOf('--venue');
const id = i > -1 ? process.argv[i + 1] : 'picklezone-tagum';
const dir = join(root, 'venues', id);
if (!existsSync(dir)) throw new Error(`No venue folder: venues/${id}`);

const load = async (name) => (await import(pathToFileURL(join(dir, `${name}.js`)).href + `?t=${Date.now()}`)).default;
const cfg = {};
for (const name of ['venue', 'courts', 'rates', 'booking', 'events', 'theme']) cfg[name] = await load(name);

const out = join(root, 'dist', id);
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(join(dir, 'img'), join(out, 'img'), { recursive: true });
await cp(join(root, 'src', 'app.js'), join(out, 'app.js'));
await cp(join(root, 'src', 'styles.css'), join(out, 'styles.css'));
await writeFile(join(out, 'index.html'), renderPage(cfg));
console.log(`built dist/${id}/`);
