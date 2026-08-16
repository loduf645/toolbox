/* ============================================================
   CORE: utils.js — Helper DOM & UI global (sanitize, toast, copy, $, format)
   ============================================================ */
function sanitizeHTML(html) {
  // Utamakan DOMPurify: sanitizer buatan sendiri (blacklist) sulit dibuat benar
  // untuk semua kasus SVG/MathML/protokol aneh. Fallback di bawah hanya dipakai
  // bila CDN gagal dimuat (mis. offline).
  if (typeof DOMPurify !== 'undefined' && DOMPurify.sanitize) {
    return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  }
  console.warn('DOMPurify tidak tersedia, memakai sanitizer fallback.');
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // Remove dangerous elements entirely
  doc.querySelectorAll('script,style,iframe,object,embed,form,link,meta,base,template,noscript')
    .forEach(el => el.remove());
  // Remove dangerous attributes from all elements
  doc.querySelectorAll('*').forEach(el => {
    [...el.attributes].forEach(attr => {
      const name = attr.name.toLowerCase();
      const value = attr.value.toLowerCase().trim();
      if (name.startsWith('on') ||
          (name === 'href' && value.startsWith('javascript:')) ||
          (name === 'src' && value.startsWith('javascript:')) ||
          (name === 'action' && value.startsWith('javascript:')) ||
          (name === 'formaction' && value.startsWith('javascript:')) ||
          (name === 'xlink:href' && value.startsWith('javascript:')) ||
          (name === 'data' && value.startsWith('javascript:')) ||
          (name === 'background' && value.startsWith('javascript:')) ||
          (name === 'poster' && value.startsWith('javascript:'))) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return doc.body.innerHTML;
}


/* ---------- selector & format ---------- */
function $(sel, root=document){ return root.querySelector(sel); }
function $$(sel, root=document){ return [...root.querySelectorAll(sel)]; }

/** Escape HTML — delegasi ke modul pure TB.TextUtils agar hanya ada satu implementasi. */
function esc(s){ return TB.TextUtils.escapeHtml(s); }

/** Format angka id-ID — delegasi ke modul pure (diuji di tests/). */
function fmtNum(n, dec=2){ return TB.TextUtils.formatNumberID(n, dec); }

/**
 * Format Date -> nilai <input type="datetime-local"> memakai waktu LOKAL.
 * toISOString() memakai UTC sehingga default bergeser 7 jam di WIB.
 */
function toLocalDateTimeInput(date){
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}` +
         `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}


let _toastTimer = null;
function toast(msg){
  const el = document.getElementById('toast');
  el.innerHTML = `${ICONS.check}<span>${msg}</span>`;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

async function copyText(text){
  try { await navigator.clipboard.writeText(text); toast('Tersalin ke clipboard'); } 
  catch {
    const ta = document.createElement('textarea'); ta.value = text;
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta); toast('Tersalin');
  }
}



