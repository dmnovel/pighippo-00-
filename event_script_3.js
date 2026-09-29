
(function(){
  const dock=document.getElementById('desktopCartDock');
  const btn=document.getElementById('pcCartCollapseBtn');
  if(!dock||!btn)return;
  function sync(){
    const collapsed=dock.classList.contains('is-collapsed');
    btn.textContent=collapsed?'cart◀️':'cart▶️';
    btn.setAttribute('aria-expanded',collapsed?'false':'true');
    btn.setAttribute('aria-label',collapsed?'장바구니 펼치기':'장바구니 접기');
    btn.title=collapsed?'장바구니 펼치기':'장바구니 접기';
  }
  btn.addEventListener('click',function(){
    dock.classList.toggle('is-collapsed');
    sync();
  });
  sync();
})();
