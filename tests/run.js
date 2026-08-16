/* ============================================================
   tests/run.js — jalankan SEMUA unit test logic murni.
   Pakai:  node tests/run.js
   Tanpa dependensi npm apa pun (hanya Node >= 18).
   ============================================================ */
'use strict';

require('./calculators.test.js');
require('./diff.test.js');
require('./text-transforms.test.js');
require('./crypto.test.js');
require('./search.test.js');
require('./json.test.js');
require('./base64.test.js');
require('./color.test.js');
require('./gradient.test.js');

require('./harness.js').summary();
