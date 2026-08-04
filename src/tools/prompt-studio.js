/* ============================================================
   TOOLS: prompt-studio.js — Prompt Studio [Text]
   Operasi string editor: pure/text-transforms.js; data template: data/prompt-data.js
   ============================================================ */

function renderPromptStudio(){
  return `
    <div class="panel">
      <div class="ps-toolbar">
        <button type="button" class="ps-tb-btn" data-act="bold" title="Tebal (Ctrl+B)"><b>B</b></button>
        <button type="button" class="ps-tb-btn" data-act="italic" title="Miring (Ctrl+I)"><i>I</i></button>
        <button type="button" class="ps-tb-btn" data-act="strike" title="Coret (Ctrl+Shift+S)"><s>S</s></button>
        <span class="ps-tb-sep"></span>
        <button type="button" class="ps-tb-btn" data-act="h1" title="Heading 1">H1</button>
        <button type="button" class="ps-tb-btn" data-act="h2" title="Heading 2">H2</button>
        <button type="button" class="ps-tb-btn" data-act="h3" title="Heading 3">H3</button>
        <span class="ps-tb-sep"></span>
        <button type="button" class="ps-tb-btn" data-act="bullet" title="Bullet List">•</button>
        <button type="button" class="ps-tb-btn" data-act="number" title="Numbered List">1.</button>
        <button type="button" class="ps-tb-btn" data-act="code" title="Kode">\`</button>
        <button type="button" class="ps-tb-btn" data-act="quote" title="Quote">❝</button>
        <button type="button" class="ps-tb-btn" data-act="divider" title="Divider">—</button>
        <span class="ps-tb-sep"></span>
        <button type="button" class="ps-tb-btn" id="ps-undo" title="Undo (Ctrl+Z)">${ICONS.undo}</button>
        <button type="button" class="ps-tb-btn" id="ps-redo" title="Redo (Ctrl+Shift+Z)">${ICONS.redo}</button>
        <span class="ps-tb-sep ps-tb-grow"></span>
        <button type="button" class="btn btn-secondary ps-btn-sm ps-side-toggle" id="ps-side-toggle">☰ Template</button>
        <button type="button" class="btn btn-secondary ps-btn-sm" id="ps-copy">${ICONS.copy} Salin</button>
        <button type="button" class="btn btn-secondary ps-btn-sm" id="ps-dl-md">${ICONS.download} .md</button>
        <button type="button" class="btn btn-secondary ps-btn-sm" id="ps-dl-txt">${ICONS.download} .txt</button>
        <button type="button" class="btn btn-secondary ps-btn-sm" id="ps-clear">Clear</button>
      </div>
    </div>
    <div class="ps-main">
      <div class="panel ps-side" id="ps-side">
        <div class="ps-side-title">📁 Template</div>
        <div class="ps-cats" id="ps-cats"></div>
        <div class="ps-tpls" id="ps-tpls"></div>
        <hr class="ps-hr">
        <div class="ps-side-title">🧩 Blok Prompt</div>
        <div class="ps-blocks" id="ps-blocks"></div>
      </div>
      <div class="tool-layout">
        <div class="panel">
          <div class="panel-title">${ICONS.markdown} Editor Markdown</div>
          <textarea class="textarea mono" id="ps-input" style="min-height:460px;font-size:14px;line-height:1.65" placeholder="Mulai menulis, atau pilih template / blok prompt di sidebar…"></textarea>
          <div class="stat-grid" style="margin-top:14px">
            <div class="stat-card"><div class="label">Kata</div><div class="value" id="ps-wc-words">0</div></div>
            <div class="stat-card"><div class="label">Karakter</div><div class="value" id="ps-wc-chars">0</div></div>
            <div class="stat-card"><div class="label">Baris</div><div class="value" id="ps-wc-lines">0</div></div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-title">${ICONS.eye} Live Preview</div>
          <div class="markdown-body ps-preview" id="ps-preview"><p class="ps-empty">Mulai menulis untuk melihat preview…</p></div>
        </div>
      </div>
    </div>`;
}

function mountPromptStudio(root){
  root.classList.add('wide'); // layout lebih lebar untuk tool kompleks

  const editor = $('#ps-input', root);
  const previewEl = $('#ps-preview', root);
  const undoBtn = $('#ps-undo', root), redoBtn = $('#ps-redo', root);
  const catsEl = $('#ps-cats', root), tplsEl = $('#ps-tpls', root), blocksEl = $('#ps-blocks', root);
  const sideEl = $('#ps-side', root);
  const copyBtn = $('#ps-copy', root), dlMdBtn = $('#ps-dl-md', root), dlTxtBtn = $('#ps-dl-txt', root), clearBtn = $('#ps-clear', root);

  /* ---------- state ---------- */
  const PS_HISTORY_MAX = 50;
  const PS_TYPING_IDLE_MS = 500; // jeda ketikan sebelum dianggap "unit undo" baru
  const PS_STORAGE_KEY = 'toolbox-prompt-studio';
  let undoStack = [], redoStack = [], lastSnap = null;
  let urls = [], saveTimer = null, clearTimer = null;
  let typingTimer = null, pendingSnap = null;
  let activeCat = 0;

  // Muat draft dari localStorage, fallback ke starter prompt
  let initial = '';
  try { initial = localStorage.getItem(PS_STORAGE_KEY) || ''; } catch(e){ initial = ''; }
  if(!initial.trim()){ initial = PS_STARTER; }
  editor.value = initial;
  lastSnap = initial;

  /* ---------- helpers ---------- */
  // Catat state sebelum perubahan ke stack undo (dengan dedupe beruntun).
  function pushHistory(prevState){
    if(undoStack.length && undoStack[undoStack.length - 1] === prevState) return;
    undoStack.push(prevState);
    if(undoStack.length > PS_HISTORY_MAX) undoStack.shift();
    redoStack = [];
  }
  // Ketikan beruntun (tanpa jeda) dianggap SATU unit undo, bukan satu entri per
  // huruf. Tanpa ini, undo stack (maks 50 entri) langsung habis dalam ~50 huruf
  // pertama, membuat undo praktis tidak berguna untuk mengetik prompt yang panjang.
  function flushTypingHistory(){
    if(typingTimer){ clearTimeout(typingTimer); typingTimer = null; }
    if(pendingSnap !== null){ pushHistory(pendingSnap); pendingSnap = null; }
  }
  function updateHistoryBtns(){
    undoBtn.disabled = !undoStack.length && pendingSnap === null;
    redoBtn.disabled = !redoStack.length;
  }
  function renderPreview(){
    try{
      const raw = marked.parse(editor.value);
      previewEl.innerHTML = sanitizeHTML(raw);
    }catch(e){
      previewEl.innerHTML = '<p style="color:var(--danger)">Gagal merender markdown</p>';
    }
  }
  function renderStats(){
    const t = editor.value;
    const words = TB.TextUtils.countWords(t);
    const chars = TB.TextUtils.countCodePoints(t);
    const lines = TB.TextUtils.countLines(t);
    $('#ps-wc-words', root).textContent = fmtNum(words, 0);
    $('#ps-wc-chars', root).textContent = fmtNum(chars, 0);
    $('#ps-wc-lines', root).textContent = fmtNum(lines, 0);
  }
  function scheduleSave(){
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(PS_STORAGE_KEY, editor.value); } catch(e){ console.warn('Autosave gagal:', e); }
    }, 400);
  }
  function afterMutation(){
    renderPreview(); renderStats(); updateHistoryBtns(); scheduleSave();
  }
  function setEditorValue(nv, selStart, selEnd){
    flushTypingHistory();      // commit burst ketikan yg belum tersimpan (kalau ada)
    pushHistory(editor.value); // state sebelum perubahan
    editor.value = nv;
    lastSnap = nv;
    if(selStart != null){ editor.focus(); editor.setSelectionRange(selStart, selEnd); }
    afterMutation();
  }

  /* ---------- toolbar: format ----------
     Operasi string editor (wrap, prefix, numbering, insert) adalah fungsi murni
     di pure/text-transforms.js (TB.TextTransforms) — teruji unit. File ini hanya
     membaca/menulis nilai textarea + seleksi. */
  function wrapSelection(before, after, placeholder){
    const r = TB.TextTransforms.mdWrapSelection(editor.value, editor.selectionStart, editor.selectionEnd, before, after, placeholder);
    setEditorValue(r.value, r.start, r.end);
  }
  function linePrefix(prefix){
    const r = TB.TextTransforms.mdLinePrefix(editor.value, editor.selectionStart, editor.selectionEnd, prefix);
    setEditorValue(r.value, r.start, r.end);
  }
  function numberedList(){
    const r = TB.TextTransforms.mdNumberedList(editor.value, editor.selectionStart, editor.selectionEnd);
    setEditorValue(r.value, r.start, r.end);
  }
  function codeAction(){
    const r = TB.TextTransforms.mdCodeAction(editor.value, editor.selectionStart, editor.selectionEnd);
    setEditorValue(r.value, r.start, r.end);
  }
  function insertAtCursor(text){
    const r = TB.TextTransforms.mdInsertAtCursor(editor.value, editor.selectionStart, editor.selectionEnd, text);
    setEditorValue(r.value, r.start, r.end);
    return r.start;
  }
  const ACTIONS = {
    bold: () => wrapSelection('**', '**', 'teks tebal'),
    italic: () => wrapSelection('*', '*', 'teks miring'),
    strike: () => wrapSelection('~~', '~~', 'teks dicoret'),
    h1: () => linePrefix('# '),
    h2: () => linePrefix('## '),
    h3: () => linePrefix('### '),
    bullet: () => linePrefix('- '),
    number: numberedList,
    code: codeAction,
    quote: () => linePrefix('> '),
    divider: () => insertAtCursor('---')
  };
  $$('[data-act]', root).forEach(b => { b.onclick = () => ACTIONS[b.dataset.act](); });
  undoBtn.onclick = undo; redoBtn.onclick = redo;

  /* ---------- history ---------- */
  function undo(){
    flushTypingHistory();
    if(!undoStack.length) return;
    redoStack.push(editor.value);
    editor.value = undoStack.pop();
    lastSnap = editor.value;
    editor.focus();
    afterMutation();
  }
  function redo(){
    flushTypingHistory();
    if(!redoStack.length) return;
    undoStack.push(editor.value);
    editor.value = redoStack.pop();
    lastSnap = editor.value;
    editor.focus();
    afterMutation();
  }

  /* ---------- input ---------- */
  editor.addEventListener('input', () => {
    if(editor.value !== lastSnap){
      if(pendingSnap === null) pendingSnap = lastSnap; // awal burst ketikan ini
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        pushHistory(pendingSnap);
        pendingSnap = null;
        typingTimer = null;
      }, PS_TYPING_IDLE_MS);
      lastSnap = editor.value;
    }
    afterMutation();
  });

  /* ---------- keyboard shortcuts (Ctrl/Cmd) ---------- */
  root.addEventListener('keydown', e => {
    const mod = e.ctrlKey || e.metaKey;
    if(!mod) return;
    const k = e.key.toLowerCase();
    if(k === 'b'){ e.preventDefault(); ACTIONS.bold(); }
    else if(k === 'i'){ e.preventDefault(); ACTIONS.italic(); }
    else if(k === 'z'){ e.preventDefault(); e.shiftKey ? redo() : undo(); }
    else if(k === 'y'){ e.preventDefault(); redo(); }
    else if(k === 's' && e.shiftKey){ e.preventDefault(); ACTIONS.strike(); }
  });

  /* ---------- sidebar: template & blok ---------- */
  function renderSidebar(){
    catsEl.innerHTML = PS_CATEGORIES.map((c, i) =>
      `<button type="button" class="ps-cat ${i === activeCat ? 'active' : ''}" data-i="${i}">${c.emoji} ${esc(c.name)}</button>`).join('');
    $$('.ps-cat', catsEl).forEach(b => { b.onclick = () => { activeCat = +b.dataset.i; renderSidebar(); }; });
    const cat = PS_CATEGORIES[activeCat];
    tplsEl.innerHTML = cat.templates.map((t, i) => `
      <button type="button" class="ps-tpl" data-i="${i}">
        <div class="ps-tpl-name">${esc(t.name)}</div>
        <div class="ps-tpl-desc">${esc(t.desc)}</div>
      </button>`).join('');
    $$('.ps-tpl', tplsEl).forEach(b => { b.onclick = () => loadTemplate(cat.templates[+b.dataset.i]); });
    blocksEl.innerHTML = PS_BLOCKS.map((b, i) =>
      `<button type="button" class="ps-block" data-i="${i}">${esc(b.name)}</button>`).join('');
    $$('.ps-block', blocksEl).forEach(b => { b.onclick = () => {
      const blk = PS_BLOCKS[+b.dataset.i];
      const pos = insertAtCursor(blk.insert);
      // Pilih placeholder pertama di dalam blok agar bisa langsung diketik ulang
      const searchStart = pos - blk.insert.length;
      const s = editor.value.indexOf('[', searchStart);
      if(s !== -1){ const e = editor.value.indexOf(']', s); if(e !== -1){ editor.focus(); editor.setSelectionRange(s, e + 1); } }
      sideEl.classList.remove('open');
      toast(`Blok "${blk.name}" disisipkan`);
    }; });
  }
  function loadTemplate(t){
    const cur = editor.value;
    let nv;
    if(!cur.trim()) nv = t.content + '\n';
    else nv = cur.replace(/\s+$/, '') + '\n\n' + t.content + '\n';
    setEditorValue(nv, nv.length, nv.length);
    sideEl.classList.remove('open');
    toast(`Template "${t.name}" dimuat`);
  }
  $('#ps-side-toggle', root).onclick = () => { sideEl.classList.toggle('open'); };

  /* ---------- copy / export / clear ---------- */
  copyBtn.onclick = () => {
    if(!editor.value.trim()){ toast('Editor kosong — tidak ada yang disalin'); return; }
    copyText(editor.value);
  };
  function downloadText(filename, text, mime){
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    urls.push(url);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
  }
  dlMdBtn.onclick = () => { downloadText('prompt-studio.md', editor.value, 'text/markdown;charset=utf-8'); toast('File .md diunduh'); };
  dlTxtBtn.onclick = () => { downloadText('prompt-studio.txt', editor.value, 'text/plain;charset=utf-8'); toast('File .txt diunduh'); };
  function disarmClear(){
    clearBtn.dataset.armed = '';
    clearBtn.textContent = 'Clear';
    clearBtn.classList.remove('ps-danger');
    clearTimeout(clearTimer); clearTimer = null;
  }
  clearBtn.onclick = () => {
    if(!editor.value.trim()){ toast('Editor sudah kosong'); return; }
    if(clearBtn.dataset.armed){
      setEditorValue('', 0, 0);
      try { localStorage.removeItem(PS_STORAGE_KEY); } catch(e){}
      disarmClear();
      toast('Editor dibersihkan');
    } else {
      clearBtn.dataset.armed = '1';
      clearBtn.textContent = 'Yakin?';
      clearBtn.classList.add('ps-danger');
      clearTimer = setTimeout(disarmClear, 3000);
    }
  };

  /* ---------- init ---------- */
  renderSidebar();
  renderPreview();
  renderStats();
  updateHistoryBtns();

  /* ---------- cleanup ---------- */
  _toolCleanup = () => {
    // Flush autosave yang masih tertunda: bila user berpindah tool < 400 ms
    // setelah ketikan terakhir, draft terbaru tetap tersimpan (tidak hilang).
    if(saveTimer){
      clearTimeout(saveTimer); saveTimer = null;
      try { localStorage.setItem(PS_STORAGE_KEY, editor.value); } catch(e){ console.warn('Autosave gagal:', e); }
    }
    clearTimeout(clearTimer); clearTimer = null;
    clearTimeout(typingTimer); typingTimer = null; pendingSnap = null;
    urls.forEach(u => { try{ URL.revokeObjectURL(u); }catch(_){} }); urls = [];
    root.classList.remove('wide');
  };
}
