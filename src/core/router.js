/* ============================================================
   CORE: router.js — Hash routing (#tool/<id>) & render dispatcher
   ============================================================ */
const homeView = document.getElementById('home-view');
const toolView = document.getElementById('tool-view');

function getRoute(){
  const hash = location.hash.slice(1);
  if(hash.startsWith('tool/')){
    return { view:'tool', id: hash.slice(5) };
  }
  return { view:'home' };
}

function navigate(route){
  const newHash = route === 'home' ? '' : `tool/${route}`;
  if(location.hash.slice(1) !== newHash){
    location.hash = newHash; // Ini akan memicu 'hashchange' -> render()
  } else {
    render(); // Force render jika hash sama
  }
}

function render(){
  const route = getRoute();
  if(route.view === 'home'){
    // Wajib: bersihkan resource tool sebelumnya (interval/rAF/observer).
    // Sebelumnya cleanup hanya dipanggil di renderTool(), sehingga keluar ke
    // beranda meninggalkan setInterval & requestAnimationFrame tetap berjalan.
    runToolCleanup();
    toolView.innerHTML = '';
    homeView.style.display = '';
    toolView.style.display = 'none';
    renderHome();
  } else {
    const tool = TOOLS.find(t => t.id === route.id);
    if(!tool){ navigate('home'); return; }
    addToRecent(tool.id);
    homeView.style.display = 'none';
    toolView.style.display = '';
    renderTool(tool);
  }
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', render);
document.addEventListener('keydown', e => {
  if(e.key === 'Escape' && getRoute().view === 'tool') navigate('home');
});



