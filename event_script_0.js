
(()=>{
  const key='dm_theme_preference';
  const mq=window.matchMedia?window.matchMedia('(prefers-color-scheme: dark)'):null;
  const readPref=()=>{try{const v=localStorage.getItem(key);return(v==='light'||v==='dark'||v==='system')?v:'system'}catch(e){return'system'}};
  const applyMasterTheme=()=>{
    const pref=readPref();
    const resolved=pref==='system'?((mq&&mq.matches)?'dark':'light'):pref;
    document.documentElement.dataset.theme=resolved;
    document.documentElement.dataset.themePreference=pref;
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.setAttribute('content',resolved==='dark'?'#18181B':'#F7F7F8');
  };
  applyMasterTheme();
  window.addEventListener('pageshow',applyMasterTheme);
  window.addEventListener('focus',applyMasterTheme);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)applyMasterTheme()});
  window.addEventListener('storage',e=>{if(e.key===key)applyMasterTheme()});
  if(mq){const fn=()=>{if(readPref()==='system')applyMasterTheme()};if(mq.addEventListener)mq.addEventListener('change',fn);else if(mq.addListener)mq.addListener(fn)}
})();
