#!/usr/bin/env node
'use strict';

/**
 * @fileoverview CLI for dbsize — estimate directory sizes.
 * @author idirdev
 */

const path = require('path');
const { dirSize, formatBytes, largestFiles, breakdown, summary } = require('../src/index.js');

const args = process.argv.slice(2);

if (!args.length || args[0] === '--help') {
  console.log('Usage: dbsize <dir> [--top 10] [--breakdown] [--json]');
  process.exit(0);
}

const dirArg = args[0];
const topIdx = args.indexOf('--top');
const topN = topIdx !== -1 ? parseInt(args[topIdx + 1], 10) : 10;
const doBreakdown = args.includes('--breakdown');
const doJson = args.includes('--json');

try {
  const result = summary(dirArg);

  if (doBreakdown) {
    result.largest = largestFiles(dirArg, topN);
  }

  if (doJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`Directory : ${result.path}`);
    console.log(`Total size: ${result.formatted}`);
    console.log(`Files     : ${result.files}`);
    if (doBreakdown) {
      console.log('\nBreakdown by extension:');
      for (const g of result.breakdown) {
        console.log(`  ${g.ext.padEnd(12)} ${String(g.count).padStart(5)} files  ${g.formatted}`);
      }
      console.log(`\nTop ${topN} largest files:`);
      for (const f of result.largest) {
        console.log(`  ${f.formatted.padStart(10)}  ${f.file}`);
      }
    }
  }
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
