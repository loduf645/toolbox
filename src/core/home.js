/* ============================================================
   CORE: home.js — Render beranda, grid tool, recent tools, wrapper tool view
   ============================================================ */
function renderHome(){
  const filterBar = document.getElementById('filter-bar');
  filterBar.innerHTML = CATEGORIES.map(c => 
    `<button class="filter-chip ${c.id===currentFilter?'active':''}" data-cat="${c.id}">${c.name}</button>`
  ).join('');
  filterBar.querySelectorAll('.filter-chip').forEach(btn => {
    btn.onclick = () => { currentFilter = btn.dataset.cat; renderHome(); };
  });
  
  const byCat = currentFilter === 'all' ? TOOLS : TOOLS.filter(t => t.cat === currentFilter);
  const q = (typeof searchQuery === 'string' ? searchQuery : '').trim();
  let filtered = byCat, hits = null;
  if(q){
    hits = new Map(TB.SearchEngine.searchTools(q, byCat, SEARCH_CTX).map(r => [r.tool.id, r]));
    filtered = byCat.filter(t => hits.has(t.id));
    filtered.sort((a,b) => hits.get(b.id).score - hits.get(a.id).score);
  }
  document.getElementById('tools-count').textContent =
    q ? `${filtered.length} hasil untuk "${q}"` : `${filtered.length} tools`;
  const grid = document.getElementById('tools-grid');
  if(filtered.length === 0){
    grid.innerHTML = renderGridEmpty(q);
    wireGridEmpty(grid);
    renderRecent();
    return;
  }
  grid.innerHTML = filtered.map((t,i) => `
    <article class="tool-card" data-id="${t.id}" style="animation:slideUp .4s ease ${Math.min(i,12)*0.04}s backwards">
      <div class="tool-card-icon">${ICONS[t.id] || ICONS.arrow}</div>
      <h3>${hits ? TB.SearchEngine.highlight(t.name, hits.get(t.id).matches.name) : esc(t.name)}</h3>
      <p>${hits ? TB.SearchEngine.highlight(t.desc, hits.get(t.id).matches.desc) : esc(t.desc)}</p>
      <div class="tool-card-foot">
        <span class="tool-card-cat">${CATEGORIES.find(c=>c.id===t.cat).name}</span>
        <span class="tool-card-arrow">${ICONS.arrow}</span>
      </div>
    </article>
  `).join('');
  grid.querySelectorAll('.tool-card').forEach(card => {
    card.onclick = () => navigate(card.dataset.id);
  });
  renderRecent();
}

function renderRecent(){
  const recent = getRecent();
  const section = document.getElementById('recent-section');
  const strip = document.getElementById('recent-strip');
  if(recent.length === 0){ section.style.display = 'none'; return; }
  section.style.display = '';
  strip.innerHTML = recent.map(id => {
    const t = TOOLS.find(x => x.id === id);
    return t ? `<button class="recent-chip" data-id="${t.id}">${ICONS[t.id] || ICONS.arrow}<span>${esc(t.name)}</span></button>` : '';
  }).join('');
  strip.querySelectorAll('.recent-chip').forEach(btn => {
    btn.onclick = () => navigate(btn.dataset.id);
  });
}


function getRecent(){
  // JSON.parse bisa sukses tapi mengembalikan non-array (mis. '"str"' atau '{}'),
  // yang membuat .map() melempar dan merusak seluruh render beranda.
  try {
    const v = JSON.parse(localStorage.getItem('toolbox-recent') || '[]');
    return Array.isArray(v) ? v.filter(x => typeof x === 'string') : [];
  } catch(e) { console.warn('localStorage read error:', e); return []; }
}
function addToRecent(id){
  try {
    let r = getRecent().filter(x => x !== id);
    r.unshift(id);
    localStorage.setItem('toolbox-recent', JSON.stringify(r.slice(0, 6)));
  } catch(e) { console.warn('localStorage write error:', e); }
}
function clearRecent(){ try { localStorage.removeItem('toolbox-recent'); } catch(e) { console.warn('localStorage remove error:', e); } renderRecent(); toast('Riwayat dibersihkan'); }

function renderTool(tool){
  runToolCleanup();
  // Fallback: kategori tak dikenal tidak boleh membuat seluruh halaman blank.
  const catName = (CATEGORIES.find(c => c.id === tool.cat) || {}).name || 'Lainnya';
  toolView.innerHTML = `
    <div class="tool-header">
      <button class="back-btn" onclick="navigate('home')" aria-label="Kembali">${ICONS.back}<span>Kembali</span></button>
      <div class="tool-title-block">
        <div class="eyebrow">${catName}</div>
        <h1>${tool.name}</h1>
        <p>${tool.desc}</p>
      </div>
    </div>
    <div class="tool-content" id="tool-content"></div>
  `;
  const content = document.getElementById('tool-content');
  content.innerHTML = tool.render();
  tool.mount(content);
}



