/* ============================================================
   CORE: search.js — UI pencarian live (panel, riwayat, keyboard nav)
   Logika matching murni: pure/search-engine.js (TB.SearchEngine)
   ============================================================ */
const SEARCH_HISTORY_KEY = 'toolbox-search-history';
const SEARCH_HISTORY_MAX = 6;
let searchQuery = '';       // query aktif (mempengaruhi grid)
let searchActiveIdx = -1;   // index item terpilih di panel
let searchItems = [];       // item panel saat ini (untuk keyboard nav)

/* Konteks data statis untuk mesin pencari murni (TOOLS dkk didefinisikan di src/data/). */
const SEARCH_CTX = { categories: CATEGORIES, aliases: ALIASES };

/* ---------- Recent search (localStorage) ---------- */
function getSearchHistory(){
  try { const v = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]'); return Array.isArray(v) ? v.filter(x => typeof x === 'string') : []; }
  catch(e){ console.warn('search history read error:', e); return []; }
}
function addSearchHistory(q){
  q = String(q).trim(); if(q.length < 2) return;
  try {
    const list = getSearchHistory().filter(x => TB.TextUtils.normalizeText(x) !== TB.TextUtils.normalizeText(q));
    list.unshift(q);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(list.slice(0, SEARCH_HISTORY_MAX)));
  } catch(e){ console.warn('search history write error:', e); }
}
function removeSearchHistory(q){
  try { localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(getSearchHistory().filter(x => x !== q))); }
  catch(e){ console.warn('search history remove error:', e); }
}
function clearSearchHistory(){
  try { localStorage.removeItem(SEARCH_HISTORY_KEY); } catch(e){ console.warn(e); }
}

/* ---------- Smart empty state ---------- */
function popularTools(){ return ['qr','password','json','unit'].map(id => TOOLS.find(t => t.id === id)).filter(Boolean); }

function renderGridEmpty(q){
  const sugs = TB.SearchEngine.suggestTerms(q, TOOLS, ALIASES);
  const catNote = currentFilter !== 'all'
    ? `<p>Tidak ada di kategori <strong>${esc((CATEGORIES.find(c=>c.id===currentFilter)||{}).name || '')}</strong>. Coba cari di semua kategori.</p>` : '';
  return `<div class="grid-empty">
    <h3>Tidak ada alat untuk “${esc(q)}”</h3>
    ${catNote || '<p>Coba kata kunci lain, atau gunakan salah satu saran di bawah.</p>'}
    <div class="search-sugs">
      ${currentFilter !== 'all' ? `<button class="search-sug" data-act="allcat">Cari di semua kategori</button>` : ''}
      ${sugs.map(s => `<button class="search-sug" data-act="term" data-term="${esc(s)}">${esc(s)}</button>`).join('')}
      <button class="search-sug" data-act="reset">Reset pencarian</button>
    </div>
  </div>`;
}
function wireGridEmpty(root){
  root.querySelectorAll('.search-sug').forEach(btn => {
    btn.onclick = () => {
      const act = btn.dataset.act;
      if(act === 'allcat'){ currentFilter = 'all'; }
      else if(act === 'term'){ setSearchQuery(btn.dataset.term); return; }
      else { setSearchQuery(''); return; }
      renderHome();
    };
  });
}


/* ---------- Panel UI ---------- */
const searchWrap  = document.getElementById('search-wrap');
const searchInput = document.getElementById('search-input');
const searchPanel = document.getElementById('search-panel');
const searchClear = document.getElementById('search-clear');
const searchBoxEl = searchWrap ? searchWrap.querySelector('.search-box') : null;

function setSearchQuery(q, opts = {}){
  searchQuery = typeof q === 'string' ? q : '';
  if(searchInput && searchInput.value !== searchQuery) searchInput.value = searchQuery;
  if(searchWrap) searchWrap.classList.toggle('has-value', searchQuery.length > 0);
  renderHome();
  if(opts.closePanel) closeSearchPanel(); else renderSearchPanel();
  if(opts.focus !== false && searchInput) searchInput.focus();
}

function openSearchPanel(){ if(searchWrap && searchBoxEl){ searchWrap.classList.add('open'); searchBoxEl.setAttribute('aria-expanded','true'); } }
function closeSearchPanel(){
  if(searchWrap && searchBoxEl){ searchWrap.classList.remove('open'); searchBoxEl.setAttribute('aria-expanded','false'); }
  searchActiveIdx = -1; searchItems = [];
}

function renderSearchPanel(){
  if(!searchPanel) return;
  const q = searchQuery.trim();
  searchItems = [];
  let html = '';

  if(!q){
    const hist = getSearchHistory();
    if(hist.length){
      html += `<div class="search-group-label">Pencarian terakhir <button type="button" data-clear-hist>Bersihkan</button></div>`;
      hist.forEach(term => {
        searchItems.push({ type:'history', value: term });
        html += `<div class="search-item" role="option" id="search-opt-${searchItems.length-1}" data-idx="${searchItems.length-1}">
          <span class="si-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg></span>
          <span class="si-body"><span class="si-title">${esc(term)}</span></span>
          <button class="si-remove" type="button" data-remove="${esc(term)}" aria-label="Hapus ${esc(term)} dari riwayat" tabindex="-1">
            <svg viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button></div>`;
      });
    }
    html += `<div class="search-group-label">Populer</div>`;
    popularTools().forEach(t => {
      searchItems.push({ type:'tool', value: t.id });
      html += toolItemHTML(t, null, searchItems.length-1);
    });
  } else {
    const results = TB.SearchEngine.searchTools(q, TOOLS, SEARCH_CTX);
    if(results.length){
      html += `<div class="search-group-label">${results.length} hasil</div>`;
      results.slice(0, 8).forEach(r => {
        searchItems.push({ type:'tool', value: r.tool.id });
        html += toolItemHTML(r.tool, r.matches, searchItems.length-1);
      });
      if(results.length > 8){
        searchItems.push({ type:'showall' });
        html += `<div class="search-item" role="option" id="search-opt-${searchItems.length-1}" data-idx="${searchItems.length-1}">
          <span class="si-icon">${ICONS.arrow}</span>
          <span class="si-body"><span class="si-title">Lihat semua ${results.length} hasil</span></span></div>`;
      }
    } else {
      const sugs = TB.SearchEngine.suggestTerms(q, TOOLS, ALIASES);
      html += `<div class="search-empty">
        <h4>Tidak ditemukan</h4>
        <p>Tidak ada alat yang cocok dengan “${esc(q)}”.${sugs.length ? ' Mungkin maksud Anda:' : ' Coba kata kunci lain.'}</p>
        <div class="search-sugs">
          ${sugs.map(s => `<button class="search-sug" type="button" data-term="${esc(s)}">${esc(s)}</button>`).join('')}
        </div></div>`;
      html += `<div class="search-group-label">Coba yang populer</div>`;
      popularTools().forEach(t => {
        searchItems.push({ type:'tool', value: t.id });
        html += toolItemHTML(t, null, searchItems.length-1);
      });
    }
  }

  html += `<div class="search-foot">
    <span><kbd>↑</kbd><kbd>↓</kbd> navigasi</span><span><kbd>Enter</kbd> buka</span><span><kbd>Esc</kbd> tutup</span></div>`;

  searchPanel.innerHTML = html;
  const live = document.getElementById('search-live');
  if(live){
    const n = searchItems.filter(i => i.type === 'tool').length;
    live.textContent = q ? (n ? `${n} hasil untuk ${q}` : `Tidak ada hasil untuk ${q}`) : '';
  }
  if(searchActiveIdx >= searchItems.length) searchActiveIdx = searchItems.length ? 0 : -1;
  paintActive();
  wireSearchPanel();
}

function toolItemHTML(t, matches, idx){
  const cat = (CATEGORIES.find(c => c.id === t.cat) || {}).name || '';
  return `<div class="search-item" role="option" id="search-opt-${idx}" data-idx="${idx}">
    <span class="si-icon">${ICONS[t.id] || ICONS.arrow}</span>
    <span class="si-body">
      <span class="si-title">${matches ? TB.SearchEngine.highlight(t.name, matches.name) : esc(t.name)}</span>
      <span class="si-desc">${matches ? TB.SearchEngine.highlight(t.desc, matches.desc) : esc(t.desc)}</span>
    </span>
    <span class="si-tag">${esc(cat)}</span></div>`;
}

function wireSearchPanel(){
  searchPanel.querySelectorAll('.search-item').forEach(el => {
    const idx = Number(el.dataset.idx);
    el.addEventListener('mousemove', () => { if(searchActiveIdx !== idx){ searchActiveIdx = idx; paintActive(); } });
    el.addEventListener('mousedown', e => e.preventDefault()); // jaga fokus input
    el.addEventListener('click', e => {
      if(e.target.closest('[data-remove]')) return;
      activateSearchItem(idx);
    });
  });
  searchPanel.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('mousedown', e => e.preventDefault());
    btn.addEventListener('click', e => { e.stopPropagation(); removeSearchHistory(btn.dataset.remove); renderSearchPanel(); });
  });
  const clearBtn = searchPanel.querySelector('[data-clear-hist]');
  if(clearBtn){
    clearBtn.addEventListener('mousedown', e => e.preventDefault());
    clearBtn.addEventListener('click', () => { clearSearchHistory(); renderSearchPanel(); toast('Riwayat pencarian dibersihkan'); });
  }
  searchPanel.querySelectorAll('.search-sug').forEach(btn => {
    btn.addEventListener('mousedown', e => e.preventDefault());
    btn.addEventListener('click', () => setSearchQuery(btn.dataset.term));
  });
}

function paintActive(){
  let activeId = '';
  searchPanel.querySelectorAll('.search-item').forEach(el => {
    const on = Number(el.dataset.idx) === searchActiveIdx;
    el.classList.toggle('active', on);
    el.setAttribute('aria-selected', on ? 'true' : 'false');
    if(on){ activeId = el.id; el.scrollIntoView({ block:'nearest' }); }
  });
  // Beritahu screen reader option mana yang sedang aktif tanpa memindah fokus.
  if(searchInput){
    if(activeId) searchInput.setAttribute('aria-activedescendant', activeId);
    else searchInput.removeAttribute('aria-activedescendant');
  }
}

/** Kosongkan query tanpa memicu render (dipakai saat berpindah ke tool). */
function resetSearchQuery(){
  searchQuery = '';
  if(searchInput) searchInput.value = '';
  if(searchWrap) searchWrap.classList.remove('has-value');
}

function moveActive(delta){
  if(!searchItems.length) return;
  searchActiveIdx = (searchActiveIdx + delta + searchItems.length) % searchItems.length;
  paintActive();
}

function activateSearchItem(idx){
  const item = searchItems[idx];
  if(!item) return;
  if(item.type === 'history'){ setSearchQuery(item.value); return; }
  if(item.type === 'showall'){ addSearchHistory(searchQuery); closeSearchPanel(); searchInput.blur();
    document.getElementById('tools-grid').scrollIntoView({ behavior:'smooth', block:'start' }); return; }
  if(item.type === 'tool'){
    if(searchQuery.trim()) addSearchHistory(searchQuery);
    closeSearchPanel();
    if(searchInput) searchInput.blur();
    resetSearchQuery();   // beranda kembali bersih saat pengguna menekan "Kembali"
    navigate(item.value);
  }
}

function initSearch(){
  // Defensif: bila markup pencarian tidak ada (mis. HTML dipangkas), seluruh
  // aplikasi harus tetap berjalan tanpa melempar error.
  if(!searchWrap || !searchInput || !searchPanel || !searchClear || !searchBoxEl){
    console.warn('Live search: elemen tidak lengkap, fitur dinonaktifkan.');
    return;
  }
  let debounce = null;
  searchInput.addEventListener('input', () => {
    const val = searchInput.value;
    searchWrap.classList.toggle('has-value', val.length > 0);
    openSearchPanel();
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      searchQuery = val;
      searchActiveIdx = val.trim() ? 0 : -1;
      renderHome();
      renderSearchPanel();
    }, 90);
  });
  searchInput.addEventListener('focus', () => { searchWrap.classList.add('focused'); openSearchPanel(); renderSearchPanel(); });
  searchInput.addEventListener('blur', () => { searchWrap.classList.remove('focused'); setTimeout(closeSearchPanel, 120); });
  searchInput.addEventListener('keydown', e => {
    switch(e.key){
      case 'ArrowDown': e.preventDefault(); if(!searchWrap.classList.contains('open')){ openSearchPanel(); renderSearchPanel(); } moveActive(1); break;
      case 'ArrowUp':   e.preventDefault(); moveActive(-1); break;
      case 'Home':      if(searchItems.length){ e.preventDefault(); searchActiveIdx = 0; paintActive(); } break;
      case 'End':       if(searchItems.length){ e.preventDefault(); searchActiveIdx = searchItems.length-1; paintActive(); } break;
      case 'Tab':       closeSearchPanel(); break;
      case 'Enter': {
        e.preventDefault();
        clearTimeout(debounce);
        if(searchQuery !== searchInput.value){ searchQuery = searchInput.value; renderHome(); renderSearchPanel(); }
        if(searchActiveIdx >= 0) activateSearchItem(searchActiveIdx);
        else if(searchQuery.trim()){ addSearchHistory(searchQuery); closeSearchPanel(); searchInput.blur(); }
        break;
      }
      case 'Escape':
        e.preventDefault(); e.stopPropagation();
        if(searchWrap.classList.contains('open') && searchInput.value === searchQuery && searchQuery === '') { searchInput.blur(); closeSearchPanel(); }
        else if(searchInput.value){ setSearchQuery(''); }
        else { closeSearchPanel(); searchInput.blur(); }
        break;
    }
  });
  searchClear.addEventListener('mousedown', e => e.preventDefault());
  searchClear.addEventListener('click', () => setSearchQuery(''));

  document.addEventListener('click', e => { if(!searchWrap.contains(e.target)) closeSearchPanel(); });
  // Tutup panel saat pengguna menggulir halaman (pakai gesture asli, bukan event
  // 'scroll', karena re-render grid memicu scroll sintetis dan menutup panel).
  const closeOnGesture = e => {
    if(searchWrap.contains(e.target)) return;      // biarkan panel bisa di-scroll sendiri
    if(searchWrap.classList.contains('open')){ closeSearchPanel(); searchInput.blur(); }
  };
  window.addEventListener('wheel', closeOnGesture, { passive: true });
  window.addEventListener('touchmove', closeOnGesture, { passive: true });

  // Shortcut global: "/" atau Ctrl/Cmd+K
  document.addEventListener('keydown', e => {
    const tag = (e.target.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
    if((e.key === '/' && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')){
      e.preventDefault();
      if(getRoute().view !== 'home') navigate('home');
      setTimeout(() => { searchInput.focus(); searchInput.select(); }, 60);
    }
  });
}


