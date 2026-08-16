/* ============================================================
   TOOLS: markdown.js — Markdown Previewer [Text]
   Tidak ada logic murni yang diekstrak (dominan wiring UI/CDN).
   ============================================================ */
function renderMarkdown(){
  return `
    <div class="tool-layout">
      <div class="panel"><div class="panel-title">${ICONS.markdown} Markdown Input</div><textarea class="textarea mono" id="md-input" style="min-height:400px;font-family:var(--font-mono);font-size:14px;line-height:1.6"># Judul Utama\n\nIni adalah paragraf biasa dengan **teks tebal** dan *teks miring*.\n\n## Sub Judul\n\n- List item 1\n- List item 2\n\n\`\`\`javascript\nconst x = 10;\nconsole.log(x);\n\`\`\`\n\n> Ini adalah blockquote.</textarea></div>
      <div class="panel"><div class="panel-title">${ICONS.markdown} Live Preview</div><div class="markdown-body" id="md-output" style="min-height:400px"></div></div>
    </div>`;
}
function mountMarkdown(root){
  const input = $('#md-input', root); const out = $('#md-output', root);
  function update(){
    try {
      let rawHtml = marked.parse(input.value);
      out.innerHTML = sanitizeHTML(rawHtml);
    } catch(e) { out.innerHTML = '<span style="color:var(--danger)">Error parsing markdown</span>'; }
  }
  input.addEventListener('input', update); update();
}



