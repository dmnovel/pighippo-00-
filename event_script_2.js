
document.addEventListener('click',function(e){
  var a=e.target.closest&&e.target.closest('.ridi-top-btn');
  if(!a)return;
  try{if(window.gtag)window.gtag('event','ridi_click',{page_title:document.title,link_url:a.href||''});}catch(err){}
},true);
