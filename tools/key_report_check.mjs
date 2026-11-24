import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, resolve, sep } from 'node:path';
import { gzipSync } from 'node:zlib';
import { asn1ParseReport, pemParseReport, sshPubkeyParseReport } from '../src/core/eccdetect.js';
import { mimeMultipartEncode, mimeMultipartOp } from '../src/core/mimeMultipart.js';

// Node/OpenSSL supplies the encodings and independent integer values. No real keys are used.
const { publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const { n, e } = publicKey.export({ format: 'jwk' });
const nBytes = Buffer.from(n, 'base64url'), eBytes = Buffer.from(e, 'base64url');
const decimal = bytes => BigInt('0x' + bytes.toString('hex')).toString();
const modulus = decimal(nBytes), exponent = decimal(eBytes);
const spki = publicKey.export({ type: 'spki', format: 'der' });
const pkcs1 = publicKey.export({ type: 'pkcs1', format: 'der' });
const value = (text, label) => text.split('\n').find(line => line.startsWith(label))?.slice(label.length);
function checkRsa(text, der) {
  // Compare exact values, including the tail, without dumping keys on assertion failure.
  assert(value(text, '  modulus_n: ') === modulus, 'complete decimal RSA modulus');
  assert(value(text, '  publicExponent_e: ') === exponent, 'complete RSA exponent');
  assert(value(text, 'DER hex: ') === der.toString('hex'), 'complete DER hex');
}
for (const [type, der] of [['spki', spki], ['pkcs1', pkcs1]]) {
  checkRsa(pemParseReport(publicKey.export({ type, format: 'pem' })), der);
  checkRsa(pemParseReport(der.toString('hex')), der);
  checkRsa(pemParseReport(der.toString('base64')), der);
  checkRsa(pemParseReport('', { rawBytes: Uint8Array.from(der) }), der);
  if (type === 'spki') {
    assert(value(pemParseReport(der.toString('hex')), '  publicKey: ') === pkcs1.toString('hex'));
  }
}
const pemPair = ['spki', 'pkcs1'].map(type => publicKey.export({ type, format: 'pem' })).join('\n');
assert.deepEqual([...pemParseReport(pemPair).matchAll(/^  modulus_n: (\d+)$/gm)].map(m => m[1] === modulus), [true, true]);
assert.throws(() => pemParseReport('not a key!'), /未识别/);
assert.match(pemParseReport('3006020101'), /内容长度超出/);

const sshField = bytes => {
  const size = Buffer.alloc(4);
  size.writeUInt32BE(bytes.length);
  return Buffer.concat([size, bytes]);
};
const blob = Buffer.concat([sshField(Buffer.from('ssh-rsa')), sshField(eBytes), sshField(Buffer.concat([Buffer.from([0]), nBytes]))]);
const ssh = sshPubkeyParseReport('ssh-rsa ' + blob.toString('base64'));
assert(value(ssh, '  n: ') === modulus);
assert(value(ssh, '  e: ') === exponent);
assert(value(ssh, 'SHA256 指纹: ') === 'SHA256:' + createHash('sha256').update(blob).digest('base64').replace(/=+$/, ''));
assert.throws(() => sshPubkeyParseReport('ssh-rsa ' + blob.subarray(0, -1).toString('base64')), /截断/);

const asn1 = asn1ParseReport(spki.toString('hex'));
assert(asn1.includes(pkcs1.toString('hex')), 'SPKI BIT STRING is complete by default');
const limited = asn1ParseReport(spki.toString('hex'), { truncateOctets: 32 });
assert(limited === asn1, 'legacy size setting must not trim final output');
assert(asn1ParseReport(pkcs1.toString('hex'), { truncateOctets: 1 }).includes(modulus), 'explicit byte limit does not affect INTEGER');
let nested = Buffer.from('02012a', 'hex');
for (let i = 0; i < 12; i++) nested = Buffer.concat([Buffer.from([0x30, nested.length]), nested]);
assert(asn1ParseReport(nested.toString('hex')).includes('INTEGER (1 字节) : 42'), 'deep tree retains innermost value');
console.log(`PASS Node: RSA ${modulus.length} digits, PEM/hex/Base64/file × SPKI/PKCS#1, multi-block, SSH, ASN.1 and negative cases`);

if (process.argv.includes('--browser')) {
  const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const root = resolve('.');
  let parserRequests = 0;
  let originUnavailable = false;
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      if (url.pathname === '/src/core/eccdetect.js') parserRequests++;
      if (originUnavailable) { req.socket.destroy(); return; }
      if (!/^\/(?:index\.html|manifest\.json|sw(?:-assets|-packs)?\.js)?$|^\/(?:src|public)\//.test(url.pathname)) throw new Error('outside fixture');
      const file = resolve(root, '.' + decodeURIComponent(url.pathname).replace(/\/$/, '/index.html'));
      if (!file.startsWith(root + sep)) throw new Error('outside fixture');
      res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.wasm': 'application/wasm' })[extname(file)] || 'application/octet-stream');
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      res.end(await readFile(file));
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  let browser;
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1'] });
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, serviceWorkers: 'block' });
    await ctx.route('**/*', route => route.request().url().startsWith(base + '/') ? route.continue() : route.abort());
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
    await ctx.addInitScript(() => localStorage.setItem('ebctf_locale', 'zh'));
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.setDefaultTimeout(15000);
    const input = page.locator('#ioIn'), output = page.locator('#ioOut');
    await page.goto(base + '/#/op/pemParse');

    async function checkOutputAndCopies(needle, checkText) {
      try { await page.waitForFunction(needle => document.querySelector('#ioOut')?.value.includes(needle), needle); }
      catch (error) {
        const brief = await output.evaluate(el => (el.value || '').split('\n')[0].slice(0, 180));
        throw new Error(`Expected output not produced; first line: ${brief}; page errors: ${errors.join('; ')}`, { cause: error });
      }
      const text = await output.evaluate(el => el.value);
      checkText(text);
      const copy = page.locator('.io-pane-output button[title="复制"]').first();
      await copy.click();
      // The OS clipboard may represent LF as CRLF on Windows.
      await page.waitForFunction(async expected => (await navigator.clipboard.readText()).replace(/\r\n/g, '\n') === expected, text, { timeout: 5000 });
      const [textDownload] = await Promise.all([
        page.waitForEvent('download'), page.locator('.io-pane-output button[title="导出为文件"]').first().click(),
      ]);
      assert((await readFile(await textDownload.path(), 'utf8')) === text, 'downloaded text must match the full output');
      const [download] = await Promise.all([page.waitForEvent('download'), page.locator('.io-report').click()]);
      const md = await readFile(await download.path(), 'utf8');
      const report = JSON.parse(md.match(/\r?\n```json\r?\n([\s\S]*?)\r?\n```/)?.[1]);
      assert(report.output.text === text, 'downloaded report JSON must match the full output');
      assert(md.includes('\n```text\n' + text + '\n```'), 'downloaded Markdown must also contain the full output');
    }

    await input.evaluate((el, text) => { el.value = text; el.dispatchEvent(new Event('input', { bubbles: true })); }, spki.toString('hex'));
    await page.locator('.io-actions .act-btn.primary').click();
    await checkOutputAndCopies('  modulus_n: ', text => checkRsa(text, spki));
    const fileChosen = page.waitForEvent('filechooser');
    await page.locator('.io-pane-input button[title="选择文件"]').first().click();
    await (await fileChosen).setFiles({ name: 'public.der', mimeType: 'application/octet-stream', buffer: pkcs1 });
    await page.waitForFunction(value => document.querySelector('#ioOut')?.textContent.includes('DER hex: ' + value), pkcs1.toString('hex'));
    await checkOutputAndCopies('DER hex: ' + pkcs1.toString('hex'), text => checkRsa(text, pkcs1));
    console.log('PASS Edge: paste and load a DER file, complete display, clipboard, and downloaded TXT/Markdown/JSON');

    await page.goto(base + '/#/op/mimeMultipart');
    await page.locator('.dir-seg:not(.fam-seg) button').nth(1).click();
    const longBody = 'Z'.repeat(512) + '末尾😀';
    const mimeInput = mimeMultipartEncode(longBody + ' | short').replace(/\r\n/g, '\n');
    await input.evaluate((el, text) => { el.value = text; el.dispatchEvent(new Event('input', { bubbles: true })); }, mimeInput);
    await page.locator('.io-actions .act-btn.primary').click();
    await checkOutputAndCopies('末尾😀', text => assert.equal(text, mimeMultipartOp(mimeInput)));
    console.log('PASS Edge: MIME retains long Unicode body in display, clipboard, and downloaded TXT/Markdown/JSON');

    await page.goto(base + '/#/op/archiveUnified');
    const binary = Buffer.concat([Buffer.alloc(4500, 0xff), Buffer.from([0, 0xff, 0x13, 0x37])]);
    const chooseArchive = page.waitForEvent('filechooser');
    await page.locator('.io-pane-input button[title="选择文件"]').first().click();
    await (await chooseArchive).setFiles({ name: 'fixture.gz', mimeType: 'application/gzip', buffer: gzipSync(binary) });
    const artifact = page.getByRole('button', { name: /下载\s+decompressed\.bin/ });
    const [file] = await Promise.all([page.waitForEvent('download'), artifact.click()]);
    assert.deepEqual(await readFile(await file.path()), binary, 'actual downloaded binary must equal the original uncompressed bytes');
    console.log('PASS Edge: gzip raw artifact download is byte-identical beyond the former 4096-byte limit');

    if (process.argv.includes('--offline')) {
      const offline = await browser.newContext();
      try {
        const tab = await offline.newPage();
        const offlineErrors = [];
        tab.on('pageerror', error => offlineErrors.push(error.message));
        await tab.goto(base + '/#/op/pemParse');
        const readCacheState = () => tab.evaluate(async () => {
          const reg = await navigator.serviceWorker.getRegistration();
          const paths = ['./index.html', './src/main.js', './src/core/eccdetect.js'];
          const entries = await Promise.all(paths.map(path => caches.match(path)));
          return { worker: navigator.serviceWorker.controller?.state, updating: !!(reg?.installing || reg?.waiting), entries: entries.map(entry => entry?.status) };
        });
        const offlineInput = tab.locator('#ioIn');
        await offlineInput.waitFor({ timeout: 15000 });
        const deadline = Date.now() + 45000;
        let cacheState;
        do {
          cacheState = await readCacheState();
          if (cacheState.worker === 'activated' && !cacheState.updating && cacheState.entries.every(status => status === 200)) break;
          await new Promise(resolve => setTimeout(resolve, 250));
        } while (Date.now() < deadline);
        assert(cacheState.worker === 'activated' && !cacheState.updating && cacheState.entries.every(status => status === 200), `incomplete precache: ${JSON.stringify(cacheState)}`);
        originUnavailable = true;
        const assetPath = '/src/core/eccdetect.js';
        const requestsBefore = parserRequests;
        const cachedParser = await tab.evaluate(async assetPath => {
          const online = await fetch('/network-probe-' + Date.now()).then(res => res.ok, () => false);
          if (online) throw new Error('network probe unexpectedly succeeded');
          const cached = await fetch(assetPath).catch(async error => {
            throw new Error(`${error.message}; worker=${navigator.serviceWorker.controller?.state}; caches=${(await caches.keys()).join(',')}`);
          });
          if (!cached.ok) throw new Error(`parser unavailable without origin: HTTP ${cached.status}`);
          return cached.text();
        }, assetPath).catch(error => { throw new Error(`${error.message}; before disconnect=${JSON.stringify(cacheState)}`, { cause: error }); });
        assert.equal(cachedParser, await readFile(resolve(root, '.' + assetPath), 'utf8'));
        assert.equal(parserRequests, requestsBefore, 'offline parser check must not fetch from the server');
        await offlineInput.evaluate((el, text) => { el.value = text; el.dispatchEvent(new Event('input', { bubbles: true })); }, spki.toString('hex'));
        await tab.locator('.io-actions .act-btn.primary').click();
        await tab.waitForFunction(() => document.querySelector('#ioOut')?.value.includes('modulus_n:'));
        checkRsa(await tab.locator('#ioOut').evaluate(el => el.value), spki);
        assert.deepEqual(offlineErrors, []);
        console.log('PASS Edge: cached parser bytes match disk, and the open DER workspace works offline');
      } finally { originUnavailable = false; await offline.close(); }
    }

    for (const [locale, location, panelLabel, entryLabel, fullLabel] of (process.argv.includes('--skip-editor') ? [] : [
      ['zh', '右下角', '助手面板', '仅载入入口', '载入完整实现（含依赖）'],
      ['en', 'bottom-right corner', 'Assistant panel', 'Entry only', 'Load full implementation (with deps)'],
    ])) {
      const editorCtx = await browser.newContext({ serviceWorkers: 'block' });
      try {
        await editorCtx.route('**/*', route => route.request().url().startsWith(base + '/') ? route.continue() : route.abort());
        await editorCtx.addInitScript(lang => localStorage.setItem('ebctf_locale', lang), locale);
        const editorPage = await editorCtx.newPage();
        editorPage.on('pageerror', e => errors.push(e.message));
        editorPage.setDefaultTimeout(15000);
        await editorPage.goto(base + '/#/op/freqDist');
        await editorPage.waitForFunction(label => document.querySelector('.ci-edit-btn')?.textContent.includes(label), locale === 'zh' ? '编辑代码' : 'Edit code');
        await editorPage.locator('.ci-edit-btn').click();
        try { await editorPage.locator('.ci-foot .ci-tools-toggle').click(); }
        catch (error) {
          const dialog = await editorPage.locator('.ci-mask').allTextContents();
          throw new Error(`${locale}: assistant button missing; dialog=${JSON.stringify(dialog.map(s => s.slice(0, 250)))}; errors=${JSON.stringify(errors)}`, { cause: error });
        }
        const panel = editorPage.getByRole('region', { name: panelLabel });
        assert(await panel.getByRole('button', { name: fullLabel }).isVisible());
        await panel.getByRole('button', { name: entryLabel }).click();
        await editorPage.waitForFunction(([location, panelLabel, fullLabel]) => {
          const text = document.querySelector('.ci-editor-wrap .cm-content')?.textContent || '';
          return text.includes('xxx is not defined') && text.includes(location) && text.includes(panelLabel) && text.includes(fullLabel) && !text.includes('点上方');
        }, [location, panelLabel, fullLabel]);
      } finally { await editorCtx.close(); }
    }
    assert.deepEqual(errors, []);
    if (!process.argv.includes('--skip-editor')) console.log('PASS Edge: entry-only hint points to the real assistant panel and button in zh/en');
  } finally {
    await browser?.close();
    await new Promise(done => server.close(done));
  }
}
