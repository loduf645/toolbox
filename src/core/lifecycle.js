/* ============================================================
   CORE: lifecycle.js — Cleanup resource tool aktif (interval/rAF/observer)
   ============================================================ */
let _toolCleanup = null;

/** Jalankan cleanup tool aktif sekali saja, aman terhadap error di dalamnya. */
function runToolCleanup(){
  if(!_toolCleanup) return;
  const fn = _toolCleanup;
  _toolCleanup = null;           // reset dulu agar tidak terpanggil ganda
  try { fn(); } catch(e){ console.warn('tool cleanup error:', e); }
}



