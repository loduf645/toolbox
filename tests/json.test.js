/* Unit test: pure/json-helpers.js
   Jalankan: node tests/run.js */
'use strict';
const { suite, test, eq, ok, throws } = require('./harness.js');
const J = require('../src/pure/json-helpers.js');

suite('JSON formatter');

test('format dengan indentasi 2 spasi', () => {
  eq(J.formatJson('{"a":1}', 2), '{\n  "a": 1\n}');
});

test('format dengan tab', () => {
  eq(J.formatJson('[1,2]', '\t'), '[\n\t1,\n\t2\n]');
});

test('minify membuang spasi', () => {
  eq(J.minifyJson('{ "a" : 1 , "b": [ true , null ] }'), '{"a":1,"b":[true,null]}');
});

test('input tidak valid melempar SyntaxError', () => {
  throws(() => J.formatJson('{a:1}', 2));
  throws(() => J.minifyJson(''));
});

suite('JSON syntax highlighting');

test('key, string, number, boolean, null dapat class benar', () => {
  const html = J.highlightJson('{"nama":"Budi","umur":25,"aktif":true,"pasangan":null}');
  ok(html.includes('<span class="json-key">"nama":</span>'));
  ok(html.includes('<span class="json-string">"Budi"</span>'));
  ok(html.includes('<span class="json-number">25</span>'));
  ok(html.includes('<span class="json-boolean">true</span>'));
  ok(html.includes('<span class="json-null">null</span>'));
});

test('karakter HTML di-escape agar aman', () => {
  const html = J.highlightJson('{"x":"<b>"}');
  ok(html.includes('&lt;b&gt;'));
  ok(!html.includes('<b>'));
});


