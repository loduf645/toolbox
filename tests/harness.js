/* ============================================================
   tests/harness.js — micro test framework TANPA dependensi npm.
   Jalankan semua test:  node tests/run.js
   ============================================================ */
'use strict';

let passed = 0, failed = 0;
const failures = [];
let currentSuite = '';

/** Cetak judul grup test. */
function suite(name){ currentSuite = name; console.log('\n■ ' + name); }

/** Jalankan satu test; error = gagal. */
function test(name, fn){
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch(e){
    failed++; failures.push({ suite: currentSuite, name, e });
    console.log('  ✗ ' + name + '\n      ' + (e && e.message));
  }
}

/** Bandingkan sama persis (deep, via JSON). */
function eq(actual, expected, msg){
  const a = JSON.stringify(actual), b = JSON.stringify(expected);
  if(a !== b) throw new Error((msg ? msg + ' — ' : '') + `diharapkan ${b}, dapat ${a}`);
}

/** Bandingkan angka dengan toleransi. */
function approx(actual, expected, tol = 1e-9, msg){
  if(!(Math.abs(actual - expected) <= tol)){
    throw new Error((msg ? msg + ' — ' : '') + `diharapkan ≈ ${expected} (tol ${tol}), dapat ${actual}`);
  }
}

/** Assert kondisi truthy. */
function ok(cond, msg){ if(!cond) throw new Error(msg || 'kondisi tidak terpenuhi'); }

/** Assert bahwa fn melempar error. */
function throws(fn, msg){
  let threw = false;
  try { fn(); } catch(e){ threw = true; }
  if(!threw) throw new Error(msg || 'seharusnya melempar error, tapi tidak');
}

/** Ringkasan akhir; set exit code 1 bila ada kegagalan. */
function summary(){
  console.log('\n========================================');
  console.log(`TOTAL: ${passed + failed} test — ${passed} lulus, ${failed} gagal`);
  if(failed){
    console.log('\nTest yang gagal:');
    failures.forEach(f => console.log(` - [${f.suite}] ${f.name}: ${f.e.message}`));
    process.exitCode = 1;
  } else {
    console.log('Semua logic murni terverifikasi. Aman untuk refactor berikutnya.');
  }
  return failed === 0;
}

module.exports = { suite, test, eq, approx, ok, throws, summary };


