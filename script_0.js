
(function(){
  const key='dm_theme_preference';
  let pref='system';
  try{const saved=localStorage.getItem(key);if(saved==='light'||saved==='dark'||saved==='system'||saved==='colorblind')pref=saved}catch(e){}
  const systemDark=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme=pref==='system'?(systemDark?'dark':'light'):pref;
  document.documentElement.dataset.themePreference=pref;
})();
