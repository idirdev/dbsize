'use strict';

/**
 * @fileoverview Estimate database and directory sizes.
 * @module dbsize
 * @author idirdev
 */

const fs = require('fs');
const path = require('path');

/**
 * Format a byte value into a human-readable string.
 * @param {number} bytes - Number of bytes.
 * @returns {string} Formatted string with unit.
 */
function formatBytes(bytes) {
  if (bytes < 0) throw new RangeError('bytes must be non-negative');
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log2(bytes) / 10), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${i === 0 ? value : value.toFixed(2)} ${units[i]}`;
}

/**
 * Recursively sum file sizes in a directory.
 * @param {string} dirPath - Path to directory.
 * @returns {number} Total size in bytes.
 */
function dirSize(dirPath) {
  let total = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      total += dirSize(full);
    } else if (entry.isFile()) {
      total += fs.statSync(full).size;
    }
  }
  return total;
}

/**
 * Estimate the size of a single database table.
 * @param {number} rowCount - Number of rows in the table.
 * @param {number} avgRowBytes - Average bytes per row.
 * @returns {{ rows: number, avgRowBytes: number, estimatedBytes: number, formatted: string }}
 */
function estimateTableSize(rowCount, avgRowBytes) {
  if (rowCount < 0) throw new RangeError('rowCount must be non-negative');
  if (avgRowBytes <= 0) throw new RangeError('avgRowBytes must be positive');
  const estimatedBytes = rowCount * avgRowBytes;
  return {
    rows: rowCount,
    avgRowBytes,
    estimatedBytes,
    formatted: formatBytes(estimatedBytes),
  };
}

/**
 * Estimate the total database size from an array of table definitions.
 * @param {Array<{ name: string, rowCount: number, avgRowBytes: number }>} tables
 * @returns {{ tables: object[], totalBytes: number, formatted: string }}
 */
function estimateDbSize(tables) {
  const results = tables.map((t) => ({
    name: t.name,
    ...estimateTableSize(t.rowCount, t.avgRowBytes),
  }));
  const totalBytes = results.reduce((s, t) => s + t.estimatedBytes, 0);
  return {
    tables: results,
    totalBytes,
    formatted: formatBytes(totalBytes),
  };
}

/**
 * Count the total number of files in a directory (recursive).
 * @param {string} dirPath - Path to directory.
 * @returns {number} File count.
 */
function fileCount(dirPath) {
  let count = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      count += fileCount(full);
    } else if (entry.isFile()) {
      count++;
    }
  }
  return count;
}

/**
 * Return the top N largest files in a directory, sorted descending by size.
 * @param {string} dirPath - Path to directory.
 * @param {number} [n=10] - Number of results.
 * @returns {Array<{ file: string, size: number, formatted: string }>}
 */
function largestFiles(dirPath, n = 10) {
  const files = [];

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        const size = fs.statSync(full).size;
        files.push({ file: full, size, formatted: formatBytes(size) });
      }
    }
  }

  walk(dirPath);
  files.sort((a, b) => b.size - a.size);
  return files.slice(0, n);
}

/**
 * Group files in a directory by extension and report size per group.
 * @param {string} dirPath - Path to directory.
 * @returns {Array<{ ext: string, count: number, totalBytes: number, formatted: string }>}
 */
function breakdown(dirPath) {
  const groups = {};

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name) || '(no ext)';
        const size = fs.statSync(full).size;
        if (!groups[ext]) groups[ext] = { count: 0, totalBytes: 0 };
        groups[ext].count++;
        groups[ext].totalBytes += size;
      }
    }
  }

  walk(dirPath);
  return Object.entries(groups)
    .map(([ext, g]) => ({ ext, count: g.count, totalBytes: g.totalBytes, formatted: formatBytes(g.totalBytes) }))
    .sort((a, b) => b.totalBytes - a.totalBytes);
}

/**
 * Produce a summary report of a directory.
 * @param {string} dirPath - Path to directory.
 * @returns {{ path: string, totalSize: number, formatted: string, files: number, breakdown: Array }}
 */
function summary(dirPath) {
  const totalSize = dirSize(dirPath);
  return {
    path: dirPath,
    totalSize,
    formatted: formatBytes(totalSize),
    files: fileCount(dirPath),
    breakdown: breakdown(dirPath),
  };
}

module.exports = { formatBytes, dirSize, estimateTableSize, estimateDbSize, fileCount, largestFiles, breakdown, summary };
