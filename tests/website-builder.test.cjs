const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const admin = fs.readFileSync("admin/index.html", "utf8");
const preview = fs.readFileSync("preview/index.html", "utf8");
const worker = fs.readFileSync("worker", "utf8");

function inlineScripts(source) {
  return [...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
}

function parseScripts(source, label) {
  const scripts = inlineScripts(source);
  assert.ok(scripts.length, label + " should contain inline scripts");
  scripts.forEach((script, index) => {
    assert.doesNotThrow(() => new Function(script), label + " inline script " + index + " must parse");
  });
}

test("admin and preview inline JavaScript parses", () => {
  parseScripts(admin, "admin");
  parseScripts(preview, "preview");
});

test("Worker module parses with its default export wrapper normalized", () => {
  const normalized = worker.replace(/export\s+default\s*\{/, "const worker = {");
  assert.notEqual(normalized, worker, "expected a default-export Worker module");
  assert.doesNotThrow(() => new Function(normalized));
});

test("visual editor provides live preview, layers, drag and resize", () => {
  for (const marker of [
    'id="x7ElementFrame"',
    'id="x7ElementLayers"',
    'function x7RenderLayers',
    'function x7StartElementMove',
    'Resize selected element',
    'id="x7ElementViewport"',
    'function x7StableIdentity'
  ]) assert.ok(admin.includes(marker), "missing editor capability: " + marker);
});

test("published runtime applies edits in the editor preview and resolves stable IDs first", () => {
  assert.match(preview, /if\(e\.elementId\)[\s\S]{0,120}getElementById/);
  assert.match(preview, /e\.type==="identify"/);
  assert.match(preview, /safeSelector\(e\.selector/);
});

test("responsive styles are reapplied when viewport size changes", () => {
  assert.match(preview, /const device=\(\)=>innerWidth<=620\?"mobile":innerWidth<=1024\?"tablet":"desktop"/);
  assert.match(preview, /addEventListener\("resize"/);
  assert.match(preview, /apply\(publishedEdits\)/);
});

test("Worker validates persistent IDs, protected selectors and responsive style values", () => {
  assert.match(worker, /"identify"/);
  assert.match(worker, /x7-managed-\[a-z0-9\]/i);
  assert.match(worker, /form\|input\|button\|select\|textarea\|script\|style/);
  assert.match(worker, /Unsupported design setting/);
  assert.match(worker, /Invalid responsive design settings/);
});

test("Worker and browser runtime share the same style-property allowlist", () => {
  const workerMatch = worker.match(/const allowedStyles = new Set\(\[([\s\S]*?)\]\);/);
  const runtimeMatch = preview.match(/const allowed=new Set\(\[([\s\S]*?)\]\);/);
  assert.ok(workerMatch, "Worker style allowlist not found");
  assert.ok(runtimeMatch, "browser style allowlist not found");
  const extract = value => [...value.matchAll(/"([A-Za-z]+)"/g)].map(match => match[1]).sort();
  assert.deepEqual(extract(runtimeMatch[1]), extract(workerMatch[1]));
});

test("legacy selector-based edit records remain supported", () => {
  assert.match(preview, /return safeSelector\(e\.selector\|\|""\)/);
  assert.match(worker, /item\.type === "style"/);
  assert.match(worker, /item\.type === "element"/);
});


test("element sizing starts from explicit inline dimensions, not computed layout widths", () => {
  assert.ok(admin.includes('$("x7ElementW").value=node.style.width||""'));
  assert.ok(admin.includes('$("x7ElementH").value=node.style.height||""'));
  assert.ok(admin.includes('x7Frame?.contentDocument?.getElementById(item.id)'));
});

test("publishing a new draft retains all previously published edits", () => {
  assert.match(admin, /websiteBuilderPublished=Array\.isArray\(d\.published\)/);
  assert.match(admin, /const publishSet=action==="publish"\?\[\.\.\.websiteBuilderPublished,\.\.\.websiteBuilderDraft\]/);
  assert.match(admin, /draft:publishSet/);
});

test("editor preview avoids unsafe generated CSS selectors", () => {
  assert.match(admin, /filter\(c=>\/\^\[A-Za-z0-9_-\]\+\$\//);
  assert.match(admin, /node\.id&&\/\^\[A-Za-z\]\[A-Za-z0-9_-\]/);
});

test("existing draft, publish and version history routes remain in Worker", () => {
  for (const marker of [
    '/admin/website-builder',
    '/admin/website-builder/versions',
    '/admin/website-builder/restore',
    '/website-content'
  ]) assert.ok(worker.includes(marker), "missing existing route: " + marker);
});
