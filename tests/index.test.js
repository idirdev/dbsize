'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { formatBytes, dirSize, estimateTableSize, estimateDbSize, fileCount, largestFiles, breakdown, summary } = require('../src/index.js');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'dbsize-test-'));
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test('formatBytes: 0 bytes', () => {
  assert.equal(formatBytes(0), '0 B');
});

test('formatBytes: bytes, KB, MB, GB, TB', () => {
  assert.equal(formatBytes(500), '500 B');
  assert.equal(formatBytes(1024), '1.00 KB');
  assert.equal(formatBytes(1024 * 1024), '1.00 MB');
  assert.equal(formatBytes(1024 ** 3), '1.00 GB');
  assert.equal(formatBytes(1024 ** 4), '1.00 TB');
});

test('formatBytes: negative throws', () => {
  assert.throws(() => formatBytes(-1), RangeError);
});

test('dirSize: sums file sizes accurately', () => {
  const tmp = makeTmpDir();
  fs.writeFileSync(path.join(tmp, 'a.txt'), Buffer.alloc(100));
  fs.writeFileSync(path.join(tmp, 'b.txt'), Buffer.alloc(200));
  const sub = path.join(tmp, 'sub');
  fs.mkdirSync(sub);
  fs.writeFileSync(path.join(sub, 'c.txt'), Buffer.alloc(50));
  assert.equal(dirSize(tmp), 350);
  fs.rmSync(tmp, { recursive: true });
});

test('estimateTableSize: correct math', () => {
  const result = estimateTableSize(1000, 128);
  assert.equal(result.estimatedBytes, 128000);
  assert.equal(result.rows, 1000);
  assert.equal(result.avgRowBytes, 128);
  assert.ok(typeof result.formatted === 'string');
});

test('estimateTableSize: invalid inputs throw', () => {
  assert.throws(() => estimateTableSize(-1, 100), RangeError);
  assert.throws(() => estimateTableSize(100, 0), RangeError);
});

test('estimateDbSize: sums tables correctly', () => {
  const tables = [
    { name: 'users', rowCount: 1000, avgRowBytes: 200 },
    { name: 'posts', rowCount: 5000, avgRowBytes: 500 },
  ];
  const result = estimateDbSize(tables);
  assert.equal(result.totalBytes, 1000 * 200 + 5000 * 500);
  assert.equal(result.tables.length, 2);
});

test('fileCount: counts recursively', () => {
  const tmp = makeTmpDir();
  fs.writeFileSync(path.join(tmp, 'a.txt'), 'x');
  fs.writeFileSync(path.join(tmp, 'b.txt'), 'x');
  const sub = path.join(tmp, 'sub');
  fs.mkdirSync(sub);
  fs.writeFileSync(path.join(sub, 'c.txt'), 'x');
  assert.equal(fileCount(tmp), 3);
  fs.rmSync(tmp, { recursive: true });
});

test('largestFiles: returns top N sorted by size', () => {
  const tmp = makeTmpDir();
  fs.writeFileSync(path.join(tmp, 'small.txt'), Buffer.alloc(10));
  fs.writeFileSync(path.join(tmp, 'large.txt'), Buffer.alloc(500));
  fs.writeFileSync(path.join(tmp, 'medium.txt'), Buffer.alloc(100));
  const top = largestFiles(tmp, 2);
  assert.equal(top.length, 2);
  assert.equal(top[0].size, 500);
  assert.equal(top[1].size, 100);
  fs.rmSync(tmp, { recursive: true });
});

test('breakdown: groups by extension', () => {
  const tmp = makeTmpDir();
  fs.writeFileSync(path.join(tmp, 'a.js'), Buffer.alloc(50));
  fs.writeFileSync(path.join(tmp, 'b.js'), Buffer.alloc(50));
  fs.writeFileSync(path.join(tmp, 'c.txt'), Buffer.alloc(200));
  const result = breakdown(tmp);
  const txt = result.find((r) => r.ext === '.txt');
  const js = result.find((r) => r.ext === '.js');
  assert.ok(txt, '.txt group missing');
  assert.ok(js, '.js group missing');
  assert.equal(txt.totalBytes, 200);
  assert.equal(js.totalBytes, 100);
  assert.equal(js.count, 2);
  fs.rmSync(tmp, { recursive: true });
});

test('summary: returns full report object', () => {
  const tmp = makeTmpDir();
  fs.writeFileSync(path.join(tmp, 'x.txt'), Buffer.alloc(128));
  const result = summary(tmp);
  assert.equal(result.path, tmp);
  assert.equal(result.totalSize, 128);
  assert.equal(result.files, 1);
  assert.ok(Array.isArray(result.breakdown));
  fs.rmSync(tmp, { recursive: true });
});
