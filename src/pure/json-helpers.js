/* ============================================================
   PURE: json-helpers.js
   Operasi JSON murni — TANPA DOM. Diuji di tests/json.test.js
   Berisi: format/minify + syntax highlighting output JSON.
   ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory();                    // Node (unit test)
  } else {
    root.TB = root.TB || {};
    root.TB.Json = factory();                      // Browser (bundel)
  }
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  /**
   * Parse + format ulang JSON. Melempar SyntaxError bila input tidak valid
   * (caller menampilkan pesan error-nya).
   * @param {string} str - teks JSON @param {number|string} indent - spasi/tab
   * @returns {string} JSON terformat
   */
  function formatJson(str, indent) {
    return JSON.stringify(JSON.parse(str), null, indent);
  }

  /**
   * Parse + minify JSON. Melempar SyntaxError bila input tidak valid.
   * @param {string} str @returns {string}
   */
  function minifyJson(str) {
    return JSON.stringify(JSON.parse(str));
  }

  /**
   * Syntax highlighting JSON yang SUDAH berbentuk string (hasil stringify).
   * Output berupa HTML dengan span ber-class json-key/string/number/boolean/null;
   * karakter & < > di-escape dulu agar aman dimasukkan via innerHTML.
   * @param {string} json @returns {string} HTML
   */
  function highlightJson(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      let cls = 'json-number'; if(/^"/.test(match)) { if(/:$/.test(match)) cls = 'json-key'; else cls = 'json-string'; } else if(/true|false/.test(match)) cls = 'json-boolean'; else if(/null/.test(match)) cls = 'json-null';
      return `<span class="${cls}">${match}</span>`;
    });
  }

  return { formatJson, minifyJson, highlightJson };
});


