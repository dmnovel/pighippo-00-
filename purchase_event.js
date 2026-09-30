(function(){
'use strict';
const STORAGE_KEY='dm_purchase_records_v1';
const BACKUP_FORMAT='dm-master-backup';
const BACKUP_VERSION=2;
const PLATFORM_OPTIONS=['리디','교보eBook','YES24','알라딘','카카오페이지','네이버시리즈','봄툰','레진','기타'];
const isMaster=!!document.getElementById('mobileMenuBtn');
const state=window.__dmState;
function persistMasterTab(tab){try{sessionStorage.setItem('dm_master_active_tab',tab)}catch{}}
const MASTER_DATA_FILE='cefc6b96f8f7df3b.bin';
const norm=v=>String(v||'').trim().toLowerCase().replace(/\s+/g,'');
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function readStore(){
  try{
    const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    if(raw&&raw.version===1&&raw.works&&typeof raw.works==='object')return raw;
  }catch(e){}
  return{version:1,works:{}};
}
function saveStore(data){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data));}catch(e){alert('구매기록을 저장하지 못했습니다.');}}
function getItems(){try{return(typeof state!=='undefined'&&Array.isArray(state.items))?state.items:[]}catch(e){return[]}}
let masterCatalogCache=null,masterCatalogPromise=null;
async function loadMasterCatalog(){
  if(Array.isArray(masterCatalogCache))return masterCatalogCache;
  if(masterCatalogPromise)return masterCatalogPromise;
  masterCatalogPromise=(async()=>{
    const base=isMaster?'./':'../';
    const res=await fetch(base+MASTER_DATA_FILE,{cache:'no-store'});
    if(!res.ok)throw new Error('master data missing');
    let payload=await res.json();
    if(payload&&payload.__dm_enc===1){
      const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
      const kh='fe6d8dac744fb58d2d956a5ecab60acc97f414e48bb8f99b18ec1539fa8ecab8',kb=new Uint8Array(kh.match(/../g).map(x=>parseInt(x,16)));
      const key=await crypto.subtle.importKey('raw',kb,{name:'AES-GCM'},false,['decrypt']);
      const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64(payload.iv)},key,b64(payload.data));
      payload=JSON.parse(new TextDecoder().decode(plain));
    }
    masterCatalogCache=Array.isArray(payload)?payload:[];
    return masterCatalogCache;
  })().catch(err=>{masterCatalogPromise=null;throw err});
  return masterCatalogPromise;
}
function itemKey(item){
  const id=String(item?.workId??item?.id??'').trim();
  if(id)return id;
  return 'ta:'+norm(item?.title)+'|'+norm(item?.author);
}
function workMatches(a,b){
  const aid=String(a?.workId??a?.id??'').trim(),bid=String(b?.workId??b?.id??'').trim();
  if(aid&&bid&&aid===bid)return true;
  return norm(a?.title)===norm(b?.title)&&norm(a?.author)===norm(b?.author);
}
function findStoredWork(item,store){
  store=store||readStore();
  const key=itemKey(item);
  if(store.works[key])return store.works[key];
  return Object.values(store.works).find(w=>workMatches(w,item))||null;
}
function isPurchased(item){const w=findStoredWork(item);return!!(w&&Array.isArray(w.records)&&w.records.length)}
window.dmIsPurchasedForMasterFilter=isPurchased;
function ensureStyle(){if(document.getElementById('dmPurchaseStyles'))return;const s=document.createElement('style');s.id='dmPurchaseStyles';s.textContent=`
.purchase-top-btn,.pc-backup-btn{display:inline-flex;align-items:center;justify-content:center;min-height:36px;border:1px solid #E5E7EB;border-radius:9px;background:#fff;color:var(--brown,#6b5a50);cursor:pointer;font-weight:700;font-size:15px;padding:0 14px;box-shadow:0 1px 5px rgba(0,0,0,.035)}
.purchase-top-btn:hover,.pc-backup-btn:hover{background:#F4F4F5}.favorite-action-btn.dm-purchased-replacement{background:#FFF0F3!important;color:#C2415B!important;border-color:#F2B8C4!important}.favorite-toggle.dm-purchased-replacement{font-size:11px!important;font-weight:700!important;letter-spacing:-.06em!important;background:#FFF0F3!important;color:#C2415B!important;border-color:#F2B8C4!important}
.dm-event-purchase-btn{display:inline-flex;align-items:center;justify-content:center;width:100%;min-height:40px;padding:0 10px;box-sizing:border-box;border-radius:4px;border:1px solid #F2B8C4;background:#FFF0F3;color:#C2415B;font-size:12px;font-weight:800;white-space:nowrap}.history-btn.dm-event-purchased-history{background:#fff!important;color:var(--brown,#6b5a50)!important;border-color:#D9DCE1!important}.history-btn.dm-event-purchased-history:hover{background:#F7F7F8!important;border-color:#D9DCE1!important}.card.dm-event-purchased .cart-btn{display:none!important}.card.dm-event-purchased>.favorite-toggle{display:none!important}html[data-theme="dark"] .dm-event-purchase-btn{background:#442A33;color:#FFB4C3;border-color:#71404F}html[data-theme="dark"] .history-btn.dm-event-purchased-history{background:#242427!important;color:#E4E4E7!important;border-color:#3F3F46!important}
.dm-purchase-backdrop,.dm-backup-backdrop,.dm-purchase-form-backdrop{position:fixed;inset:0;z-index:1200;background:rgba(20,20,24,.48);display:none;align-items:center;justify-content:center;padding:18px}.dm-purchase-backdrop.open,.dm-backup-backdrop.open,.dm-purchase-form-backdrop.open{display:flex}.dm-purchase-modal,.dm-backup-modal,.dm-purchase-form-modal{width:min(760px,100%);max-height:min(88vh,840px);overflow:auto;background:#fff;border:1px solid #E5E7EB;border-radius:14px;box-shadow:0 18px 48px rgba(0,0,0,.22);padding:18px}.dm-backup-modal{width:min(520px,100%)}.dm-purchase-form-modal{width:min(560px,100%)}
.dm-modal-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.dm-modal-head h2{margin:0;font-size:20px;font-weight:700;letter-spacing:-.03em}.dm-modal-close{width:38px;height:38px;padding:0;border:1px solid #E5E7EB;border-radius:8px;background:#fff;font-size:24px;line-height:1;color:#52525B}.dm-purchase-addbox{padding:12px;border:1px solid #E5E7EB;border-radius:10px;background:#F7F7F8;margin-bottom:14px}.dm-purchase-addrow{display:grid;grid-template-columns:1fr auto;gap:8px}.dm-purchase-addrow input{min-width:0}.dm-purchase-search-results{display:grid;gap:7px;margin-top:9px}.dm-purchase-search-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px;padding:9px 10px;border:1px solid #E5E7EB;border-radius:8px;background:#fff}.dm-purchase-search-text{min-width:0}.dm-purchase-search-title{font-size:14px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dm-purchase-search-author{margin-top:2px;color:#71717A;font-size:12px;font-weight:600}.dm-purchase-search-row button,.dm-record-btn,.dm-record-edit,.dm-record-delete,.dm-work-delete,.dm-backup-actions button,.dm-form-actions button{min-height:36px;border-radius:7px;border:1px solid #D9DCE1;background:#fff;font-size:13px;font-weight:700;padding:0 12px}.dm-purchase-search-row button,.dm-record-btn,.dm-form-save,.dm-backup-primary{background:#9370DB!important;border-color:#9370DB!important;color:#fff!important}.dm-work-list{display:grid;gap:10px}.dm-work-card{border:1px solid #E5E7EB;border-radius:10px;padding:12px;background:#fff}.dm-work-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.dm-work-title{margin:0;font-size:15px;font-weight:700;line-height:1.35}.dm-work-author{margin:3px 0 0;color:#71717A;font-size:12px;font-weight:600}.dm-work-tools{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.dm-record-edit{color:#52525B!important}.dm-work-delete,.dm-record-delete{color:#9B3B35;border-color:#E5C8C4}.dm-record-list{display:grid;gap:7px;margin-top:10px}.dm-record{border-top:1px solid #ECECF0;padding-top:9px}.dm-record-summary{font-size:13px;line-height:1.55;color:#3F3F46}.dm-record-memo{margin-top:4px;color:#71717A;font-size:12px;white-space:pre-wrap;word-break:break-word}.dm-record-actions{display:flex;gap:6px;margin-top:7px}.dm-empty{padding:22px 8px;text-align:center;color:#71717A;font-size:13px;border:1px dashed #D9DCE1;border-radius:9px}.dm-purchase-count{margin:0 0 9px;color:#52525B;font-size:13px;font-weight:700}.dm-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px}.dm-field{display:grid;gap:5px}.dm-field.full{grid-column:1/-1}.dm-field label{font-size:12px;font-weight:700;color:#52525B}.dm-field input,.dm-field select,.dm-field textarea,.dm-purchase-addrow input{width:100%;min-height:42px;border:1px solid #D9DCE1;border-radius:7px;background:#fff;color:#27272A;font-size:16px;padding:8px 10px}.dm-field textarea{min-height:88px;resize:vertical}.dm-platform-other{display:none}.dm-platform-other.show{display:grid}.dm-form-actions,.dm-backup-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:15px;flex-wrap:wrap}.dm-backup-desc{margin:0 0 14px;color:#52525B;font-size:13px;line-height:1.55}.dm-backup-pc-wrap{display:flex;justify-content:flex-end;margin:-2px 0 8px}.pc-backup-btn{min-height:32px;border-radius:7px;font-size:13px;padding:0 11px}#dmBackupFile{display:none!important}#dmBackupImport{color:#52525B!important}html[data-theme="dark"] #dmBackupImport{color:#E4E4E7!important}
html[data-theme="dark"] .purchase-top-btn,html[data-theme="dark"] .pc-backup-btn,html[data-theme="dark"] .dm-modal-close,html[data-theme="dark"] .dm-record-btn,html[data-theme="dark"] .dm-record-edit,html[data-theme="dark"] .dm-record-delete,html[data-theme="dark"] .dm-work-delete,html[data-theme="dark"] .dm-backup-actions button,html[data-theme="dark"] .dm-form-actions button{background:#242427;color:#E4E4E7;border-color:#3F3F46}html[data-theme="dark"] .favorite-action-btn.dm-purchased-replacement,html[data-theme="dark"] .favorite-toggle.dm-purchased-replacement{background:#442A33!important;border-color:#71404F!important;color:#FFB4C3!important}html[data-theme="dark"] .dm-purchase-modal,html[data-theme="dark"] .dm-backup-modal,html[data-theme="dark"] .dm-purchase-form-modal,html[data-theme="dark"] .dm-work-card,html[data-theme="dark"] .dm-purchase-search-row{background:#242427;color:#F4F4F5;border-color:#3F3F46}html[data-theme="dark"] .dm-purchase-addbox{background:#1F1F22;border-color:#3F3F46}html[data-theme="dark"] .dm-field input,html[data-theme="dark"] .dm-field select,html[data-theme="dark"] .dm-field textarea,html[data-theme="dark"] .dm-purchase-addrow input{background:#1F1F22;border-color:#4A4A52;color:#F4F4F5}html[data-theme="dark"] .dm-record-summary,html[data-theme="dark"] .dm-purchase-count{color:#E4E4E7}html[data-theme="dark"] .dm-work-author,html[data-theme="dark"] .dm-record-memo,html[data-theme="dark"] .dm-backup-desc,html[data-theme="dark"] .dm-field label{color:#A1A1AA}
@media(max-width:980px){.purchase-top-btn,.dm-backup-pc-wrap{display:none!important}.dm-purchase-backdrop,.dm-backup-backdrop,.dm-purchase-form-backdrop{padding:10px;align-items:flex-end}.dm-purchase-modal,.dm-backup-modal,.dm-purchase-form-modal{max-height:88vh;border-radius:14px 14px 0 0;padding:15px}.dm-form-grid{grid-template-columns:1fr}.dm-field.full{grid-column:auto}.dm-purchase-addrow{grid-template-columns:1fr auto}.dm-work-head{display:block}.dm-work-tools{justify-content:flex-start;margin-top:9px}.dm-purchase-search-title{white-space:normal}}

/* 20260929 UI sizing patch: compact PC top buttons + device-safe purchase form */
@media(min-width:981px){
  .top-actions{gap:8px!important;justify-content:flex-start!important;}
  .top-actions>.ridi-top-btn,
  .top-actions>.top-menu-btn,
  .top-actions>.heart-top-btn,
  .top-actions>.purchase-top-btn,
  .top-actions>.pc-theme-top-btn,
  .top-actions>.event-alert-top-btn{
    flex:0 0 auto!important;width:max-content!important;min-width:0!important;max-width:max-content!important;
    height:36px!important;min-height:36px!important;padding:0 13px!important;box-sizing:border-box!important;
    border-radius:4px!important;font-size:13px!important;box-shadow:none!important;white-space:nowrap!important;
  }
  .top-actions>.event-alert-top-btn{padding:0 12px!important;font-size:18px!important;}
}
@media(max-width:980px){
  .dm-purchase-backdrop{align-items:center!important;padding:10px!important;}
  .dm-purchase-modal{
    width:min(94vw,760px)!important;max-width:calc(100vw - 20px)!important;
    max-height:72vh!important;max-height:72dvh!important;overflow-y:auto!important;
    border-radius:14px!important;padding:15px!important;overscroll-behavior:contain;
  }
}
@media(max-width:980px){
  .dm-purchase-form-backdrop{align-items:center!important;padding:10px!important;}
  .dm-purchase-form-modal{
    width:min(94vw,520px)!important;max-width:calc(100vw - 20px)!important;
    max-height:78vh!important;max-height:78dvh!important;overflow-y:auto!important;
    border-radius:14px!important;padding:14px!important;overscroll-behavior:contain;
  }
}

/* mobile purchase tab + moved date-list button */
.dm-purchase-tab-panel{display:none}
.dm-mobile-list-top-btn{display:none}
@media(max-width:980px){
  .dm-mobile-list-top-btn{display:inline-flex!important;align-items:center;justify-content:center;order:-30;width:auto!important;min-width:52px!important;height:34px!important;min-height:34px!important;padding:0 10px!important;border:1px solid #D9DCE1!important;border-radius:4px!important;background:#fff!important;color:#52525B!important;font-size:12px!important;font-weight:700!important;line-height:1!important;box-shadow:none!important}
  .event-alert-top-btn{order:-20!important}
  .mobile-menu-btn{order:40!important}
  body.dm-purchase-tab-mode .panel,
  body.dm-purchase-tab-mode .summary,
  body.dm-purchase-tab-mode #list,
  body.dm-purchase-tab-mode #empty,
  body.dm-purchase-tab-mode #error,
  body.dm-purchase-tab-mode #loadMoreWrap,
  body.dm-purchase-tab-mode .date-list-view,
  body.dm-purchase-tab-mode .favorite-list-bar,
  body.dm-purchase-tab-mode .favorite-filter-bar{display:none!important}
  body.dm-purchase-tab-mode .dm-purchase-tab-panel{display:block!important}
  .dm-purchase-tab-panel{margin:0 0 12px;padding:0;background:transparent;border:0;border-radius:0;box-shadow:none}
  .dm-purchase-tab-filterbox,.dm-purchase-tab-listbox{background:#fff;border:1px solid #E5E7EB;border-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,.035);padding:12px}
  .dm-purchase-tab-listbox{margin-top:10px}
  .dm-purchase-tab-title{margin:0 0 10px;font-size:17px;font-weight:800;color:#27272A;letter-spacing:-.03em}
  .dm-purchase-tab-filter{display:grid;grid-template-columns:minmax(0,1fr) 118px 58px;gap:7px;align-items:end;margin-bottom:9px}
  .dm-purchase-tab-field{display:grid;gap:5px;min-width:0}
  .dm-purchase-tab-field label{margin:0;font-size:11px;font-weight:700;color:#71717A}
  .dm-purchase-tab-field input,.dm-purchase-tab-field select{width:100%;min-width:0;height:40px;min-height:40px;border:1px solid #D9DCE1;border-radius:4px;background:#fff;color:#27272A;font-size:16px;padding:0 9px}
  .dm-purchase-tab-search-btn{height:40px;min-height:40px;padding:0 8px;border-radius:4px!important;background:var(--accent)!important;border-color:var(--accent)!important;color:#fff!important;font-size:16px!important;line-height:1!important;font-weight:800!important;text-shadow:0 1px 1px rgba(0,0,0,.16)!important;letter-spacing:-.01em!important}
  .dm-purchase-tab-results{display:grid;gap:6px;margin:0 0 10px}
  .dm-purchase-tab-results:empty{display:none}
  .dm-purchase-tab-count{margin:5px 0 8px;color:#52525B;font-size:12px;font-weight:700}
  .dm-purchase-tab-list{display:grid;gap:8px}
  .dm-purchase-tab-card{border:1px solid #D9DCE1;border-radius:4px;background:#fff;padding:11px}
  .dm-purchase-tab-card-head{margin-bottom:8px}
  .dm-purchase-tab-card-title{margin:0;font-size:15px;font-weight:800;line-height:1.35;color:#27272A}
  .dm-purchase-tab-card-author{margin:3px 0 0;font-size:12px;font-weight:600;color:#71717A}
  .dm-purchase-tab-record{border-top:1px solid #ECECF0;padding-top:8px;margin-top:8px}
  .dm-purchase-tab-record:first-of-type{margin-top:0}
  .dm-purchase-tab-meta{display:flex;flex-wrap:wrap;gap:6px;font-size:12px;line-height:1.5;color:#3F3F46;align-items:center}
  .dm-purchase-tab-meta span{white-space:nowrap}
  .dm-purchase-chip{display:inline-flex;align-items:center;gap:4px;padding:5px 8px;border:1px solid #D9DCE1;border-radius:6px;font-weight:700}
  .dm-purchase-chip b{font-size:10px;font-weight:700}
  .dm-purchase-chip i{font-style:normal;font-size:12px;font-weight:800}
  .dm-chip-platform{background:#EEF6FF;border-color:#BFD9F5;color:#2563A6}
  .dm-chip-platform b{color:#5F8FBE}.dm-chip-platform i{color:#1F5E97}
  .dm-chip-discount{background:#EEF8F1;border-color:#CAE8D2;color:#287A49}
  .dm-chip-discount b{color:#5C9470}.dm-chip-discount i{color:#21683E}
  .dm-chip-amount{background:#FFF6E8;border-color:#F0D9B5;color:#9A641B}
  .dm-chip-amount b{color:#AE8247}.dm-chip-amount i{color:#815313}
  .dm-purchase-tab-memo{margin-top:5px;padding:7px 8px;background:#F7F7F8;border-radius:4px;color:#52525B;font-size:12px;line-height:1.5;white-space:pre-wrap;word-break:break-word}
  .dm-purchase-tab-actions{display:flex;gap:6px;margin-top:7px}
  .dm-purchase-tab-actions button{min-height:32px;height:32px;padding:0 10px;border:1px solid #D9DCE1;border-radius:4px;background:#fff;font-size:12px;font-weight:700}
  .dm-purchase-tab-actions .dm-record-delete{color:#9B3B35;border-color:#E5C8C4}
  html[data-theme="dark"] .dm-mobile-list-top-btn{background:#242427!important;color:#E4E4E7!important;border-color:#3F3F46!important}
  html[data-theme="dark"] .dm-purchase-tab-filterbox,html[data-theme="dark"] .dm-purchase-tab-listbox,html[data-theme="dark"] .dm-purchase-tab-card{background:#242427!important;border-color:#3F3F46!important;color:#F4F4F5!important}
  html[data-theme="dark"] .dm-purchase-tab-title,html[data-theme="dark"] .dm-purchase-tab-card-title{color:#F4F4F5!important}
  html[data-theme="dark"] .dm-purchase-tab-card-author,html[data-theme="dark"] .dm-purchase-tab-field label,html[data-theme="dark"] .dm-purchase-tab-count{color:#A1A1AA!important}
  html[data-theme="dark"] .dm-purchase-tab-field input,html[data-theme="dark"] .dm-purchase-tab-field select{background:#1F1F22!important;color:#F4F4F5!important;border-color:#4A4A52!important}
  html[data-theme="dark"] .dm-purchase-tab-meta{color:#D4D4D8!important}html[data-theme="dark"] .dm-purchase-chip{border-color:#4A4A52!important}html[data-theme="dark"] .dm-chip-platform{background:#1E3044!important;color:#A9D2FF!important}html[data-theme="dark"] .dm-chip-discount{background:#1E3326!important;color:#A7E2BA!important}html[data-theme="dark"] .dm-chip-amount{background:#3A2E1D!important;color:#F0D09C!important}html[data-theme="dark"] .dm-purchase-chip b{color:#B4B4BC!important}html[data-theme="dark"] .dm-purchase-chip i{color:inherit!important}
  html[data-theme="dark"] .dm-purchase-tab-memo{background:#1F1F22!important;color:#C4C4CC!important}
  .dm-purchase-form-backdrop{overflow:hidden!important;touch-action:none!important;overscroll-behavior:none!important}
  .dm-purchase-form-modal{box-sizing:border-box!important;width:calc(100vw - 20px)!important;max-width:560px!important;min-width:0!important;margin:0 auto!important;left:auto!important;right:auto!important;transform:none!important;overflow-x:hidden!important;overscroll-behavior:contain!important;touch-action:pan-y!important}
  .dm-purchase-form-modal *{max-width:100%;box-sizing:border-box}
  @media(max-width:430px){.dm-purchase-tab-filter{grid-template-columns:minmax(0,1fr) 108px}.dm-purchase-tab-search-btn{grid-column:1/-1;width:100%}}
}

`;
document.head.appendChild(s)}
function makeModals(){
  if(document.getElementById('dmPurchaseBackdrop'))return;
  const wrap=document.createElement('div');wrap.innerHTML=`
<div id="dmPurchaseBackdrop" class="dm-purchase-backdrop" aria-hidden="true"><section class="dm-purchase-modal" role="dialog" aria-modal="true" aria-labelledby="dmPurchaseTitle"><div class="dm-modal-head"><h2 id="dmPurchaseTitle">구매한 작품</h2><button id="dmPurchaseClose" class="dm-modal-close" type="button" aria-label="닫기">×</button></div><div class="dm-purchase-addbox"><div class="dm-purchase-addrow"><input id="dmPurchaseSearch" type="search" placeholder="제목 또는 작가 검색" autocomplete="off"><button id="dmPurchaseSearchBtn" type="button">검색</button></div><div id="dmPurchaseSearchResults" class="dm-purchase-search-results"></div></div><p id="dmPurchaseCount" class="dm-purchase-count"></p><div id="dmPurchaseList" class="dm-work-list"></div></section></div>
<div id="dmPurchaseFormBackdrop" class="dm-purchase-form-backdrop" aria-hidden="true"><section class="dm-purchase-form-modal" role="dialog" aria-modal="true" aria-labelledby="dmPurchaseFormTitle"><div class="dm-modal-head"><h2 id="dmPurchaseFormTitle">구매기록</h2><button id="dmPurchaseFormClose" class="dm-modal-close" type="button" aria-label="닫기">×</button></div><div id="dmPurchaseFormWork" class="dm-purchase-count"></div><div class="dm-form-grid"><div class="dm-field"><label for="dmPurchaseType">구매유형</label><select id="dmPurchaseType"><option value="소장">소장</option><option value="대여">대여</option></select></div><div class="dm-field"><label for="dmPurchasePlatform">구매처</label><select id="dmPurchasePlatform">${PLATFORM_OPTIONS.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select></div><div id="dmPlatformOtherWrap" class="dm-field full dm-platform-other"><label for="dmPurchasePlatformOther">기타 구매처</label><input id="dmPurchasePlatformOther" type="text" maxlength="40" placeholder="플랫폼 이름"></div><div class="dm-field"><label for="dmPurchaseAmount">구매금액</label><input id="dmPurchaseAmount" type="number" inputmode="numeric" min="0" step="1" placeholder="원"></div><div class="dm-field"><label for="dmPurchaseDiscount">할인율</label><input id="dmPurchaseDiscount" type="number" inputmode="decimal" min="0" max="100" step="0.1" placeholder="%"></div><div class="dm-field full"><label for="dmPurchaseDate">구매일자</label><input id="dmPurchaseDate" type="date"></div><div class="dm-field full"><label for="dmPurchaseMemo">기타메모</label><textarea id="dmPurchaseMemo" maxlength="1000" placeholder="메모"></textarea></div></div><div class="dm-form-actions"><button id="dmPurchaseFormCancel" type="button">취소</button><button id="dmPurchaseFormSave" class="dm-form-save" type="button">저장</button></div></section></div>
<div id="dmBackupBackdrop" class="dm-backup-backdrop" aria-hidden="true"><section class="dm-backup-modal" role="dialog" aria-modal="true" aria-labelledby="dmBackupTitle"><div class="dm-modal-head"><h2 id="dmBackupTitle">설정백업</h2><button id="dmBackupClose" class="dm-modal-close" type="button" aria-label="닫기">×</button></div><p class="dm-backup-desc">찜, 최근 본 작품, 최근 검색어, 구매기록 등 이 사이트의 저장값을 하나의 파일로 내보내고 다른 기기에서 그대로 가져올 수 있습니다.</p><input id="dmBackupFile" type="file" accept="application/json,.json" hidden><div class="dm-backup-actions"><button id="dmBackupImport" type="button">가져오기</button><button id="dmBackupExport" class="dm-backup-primary" type="button">내보내기</button></div></section></div>`;
  while(wrap.firstChild)document.body.appendChild(wrap.firstChild);
}
function openBackdrop(id){const b=document.getElementById(id);if(!b)return;b.classList.add('open');b.setAttribute('aria-hidden','false');document.body.classList.add('modal-open')}
function closeBackdrop(id){const b=document.getElementById(id);if(!b)return;b.classList.remove('open');b.setAttribute('aria-hidden','true');if(!document.querySelector('.dm-purchase-backdrop.open,.dm-backup-backdrop.open,.dm-purchase-form-backdrop.open'))document.body.classList.remove('modal-open')}
function mobileMaster(){return isMaster&&window.matchMedia&&window.matchMedia('(max-width:980px)').matches}
function ensurePurchaseTabUI(){
  if(!isMaster)return;
  const nav=document.querySelector('.mobile-tabbar');
  let tab=document.getElementById('tabPurchaseBtn');
  if(nav&&!tab){tab=document.createElement('button');tab.id='tabPurchaseBtn';tab.type='button';tab.className='mobile-tab';tab.innerHTML='<span>✓</span><em>구매목록</em>';nav.appendChild(tab)}
  let panel=document.getElementById('dmPurchaseTabPanel');
  if(!panel){
    panel=document.createElement('section');panel.id='dmPurchaseTabPanel';panel.className='dm-purchase-tab-panel';panel.setAttribute('aria-label','구매목록');
    panel.innerHTML=`<div class="dm-purchase-tab-filterbox"><h2 class="dm-purchase-tab-title">구매목록</h2><div class="dm-purchase-tab-filter"><div class="dm-purchase-tab-field"><label for="dmPurchaseTabQuery">제목·작가 검색</label><input id="dmPurchaseTabQuery" type="search" placeholder="제목 또는 작가" autocomplete="off"></div><div class="dm-purchase-tab-field"><label for="dmPurchaseTabPlatform">구매 플랫폼</label><select id="dmPurchaseTabPlatform"><option value="">전체 플랫폼</option>${PLATFORM_OPTIONS.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select></div><button id="dmPurchaseTabSearchBtn" class="dm-purchase-tab-search-btn" type="button">검색</button></div><div id="dmPurchaseTabSearchResults" class="dm-purchase-tab-results"></div></div><div class="dm-purchase-tab-listbox"><p id="dmPurchaseTabCount" class="dm-purchase-tab-count"></p><div id="dmPurchaseTabList" class="dm-purchase-tab-list"></div></div>`;
    const list=document.getElementById('list');if(list&&list.parentNode)list.parentNode.insertBefore(panel,list);else document.querySelector('main.page')?.appendChild(panel);
  }
  const listTab=document.getElementById('tabListBtn'),menu=document.getElementById('mobileMenuBtn'),top=document.querySelector('.top-actions');
  if(mobileMaster()&&listTab&&menu&&top&&listTab.parentNode!==top){listTab.classList.remove('mobile-tab');listTab.classList.add('dm-mobile-list-top-btn');listTab.innerHTML='목록';top.insertBefore(listTab,menu)}
}
function purchasePlatformName(r){return r?.platform==='기타'?(r?.platformOther||'기타'):(r?.platform||'')}
function purchaseRecordMeta(r){const out=[];const platform=purchasePlatformName(r);if(platform)out.push(`<span class="dm-purchase-chip dm-chip-platform"><b>플랫폼</b><i>${esc(platform)}</i></span>`);if(r.discount!==''&&r.discount!=null)out.push(`<span class="dm-purchase-chip dm-chip-discount"><b>구매할인율</b><i>${esc(String(r.discount))}%</i></span>`);if(r.amount!==''&&r.amount!=null)out.push(`<span class="dm-purchase-chip dm-chip-amount"><b>구매가</b><i>${esc(money(r.amount))}</i></span>`);return out.join('')}
function filteredPurchaseWorks(){
  const store=readStore(),q=norm(document.getElementById('dmPurchaseTabQuery')?.value),platform=document.getElementById('dmPurchaseTabPlatform')?.value||'';
  return Object.values(store.works).filter(w=>Array.isArray(w.records)&&w.records.length).filter(w=>!q||norm(w.title).includes(q)||norm(w.author).includes(q)).filter(w=>!platform||w.records.some(r=>r.platform===platform)).sort((a,b)=>String(a.title||'').localeCompare(String(b.title||''),'ko-KR',{numeric:true}));
}
function renderPurchaseTab(focusItem){
  const box=document.getElementById('dmPurchaseTabList'),count=document.getElementById('dmPurchaseTabCount');if(!box)return;const works=filteredPurchaseWorks();if(count)count.textContent=`구매한 작품 ${works.length.toLocaleString('ko-KR')}개`;box.innerHTML='';
  if(!works.length){box.innerHTML='<div class="dm-empty">조건에 맞는 구매 작품이 없습니다.</div>';return}
  works.forEach(w=>{const card=document.createElement('article');card.className='dm-purchase-tab-card';const records=(w.records||[]).slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||Number(b.updatedAt||0)-Number(a.updatedAt||0));card.innerHTML=`<div class="dm-purchase-tab-card-head"><h3 class="dm-purchase-tab-card-title">${esc(w.title||'(제목 없음)')}</h3><p class="dm-purchase-tab-card-author">${esc(w.author||'작가 정보 없음')}</p></div>`;records.forEach(r=>{const el=document.createElement('div');el.className='dm-purchase-tab-record';el.innerHTML=`<div class="dm-purchase-tab-meta">${purchaseRecordMeta(r)}</div>${r.memo?`<div class="dm-purchase-tab-memo">${esc(r.memo)}</div>`:''}<div class="dm-purchase-tab-actions"><button class="dm-record-edit" type="button">수정</button><button class="dm-record-delete" type="button">삭제</button></div>`;el.querySelector('.dm-record-edit').addEventListener('click',()=>openRecordForm(w,r));el.querySelector('.dm-record-delete').addEventListener('click',()=>deleteRecord(w,r.id));card.appendChild(el)});box.appendChild(card);if(focusItem&&workMatches(w,focusItem))setTimeout(()=>card.scrollIntoView({block:'center'}),0)})
}
async function searchMasterFromPurchaseTab(){
  const q=norm(document.getElementById('dmPurchaseTabQuery')?.value),box=document.getElementById('dmPurchaseTabSearchResults');if(!box)return;box.innerHTML='';if(!q)return;
  box.innerHTML='<div class="dm-empty">검색 중...</div>';let all=[];try{all=await loadMasterCatalog()}catch(e){box.innerHTML='<div class="dm-empty">마스터 목록을 불러오지 못했습니다.</div>';return}
  const hits=all.filter(x=>norm(x.title).includes(q)||norm(x.author).includes(q)).slice(0,20);box.innerHTML='';if(!hits.length){box.innerHTML='<div class="dm-empty">마스터 검색 결과가 없습니다.</div>';return}
  hits.forEach(item=>{const row=document.createElement('div');row.className='dm-purchase-search-row';row.innerHTML=`<div class="dm-purchase-search-text"><div class="dm-purchase-search-title">${esc(item.title||'(제목 없음)')}</div><div class="dm-purchase-search-author">${esc(item.author||'작가 정보 없음')}</div></div><button type="button">${resultButtonText(item)}</button>`;row.querySelector('button').addEventListener('click',()=>openRecordForm(item,null));box.appendChild(row)})
}
let purchaseTabScrollY=0,purchaseTabHasPosition=false;
function showPurchaseTab(focusItem,restore){
  if(!mobileMaster()){openPurchase(focusItem);return}
  const alreadyPurchase=document.body.classList.contains('dm-purchase-tab-mode')||state.activeMasterTab==='purchase';
  if(alreadyPurchase&&!focusItem)return;
  ensurePurchaseTabUI();try{state.showFavorites=false;state.showDateList=false;state.activeMasterTab='purchase';document.body.classList.remove('favorite-mode','date-list-mode');persistMasterTab('purchase')}catch(e){}
  document.body.classList.add('dm-purchase-tab-mode');document.getElementById('tabSearchBtn')?.classList.remove('active');document.getElementById('tabFavBtn')?.classList.remove('active');document.getElementById('tabListBtn')?.classList.remove('active');document.getElementById('tabPurchaseBtn')?.classList.add('active');renderPurchaseTab(focusItem);
  if(!focusItem){const y=(restore||purchaseTabHasPosition)?Math.max(0,purchaseTabScrollY||0):0;requestAnimationFrame(()=>window.scrollTo({top:y,behavior:'auto'}));purchaseTabHasPosition=true}
}
function hidePurchaseTab(){const wasPurchase=document.body.classList.contains('dm-purchase-tab-mode')||state.activeMasterTab==='purchase';if(wasPurchase){purchaseTabScrollY=window.scrollY||document.documentElement.scrollTop||0;purchaseTabHasPosition=true}document.body.classList.remove('dm-purchase-tab-mode');document.getElementById('tabPurchaseBtn')?.classList.remove('active');if(wasPurchase){state.activeMasterTab='search';persistMasterTab('search');document.getElementById('tabSearchBtn')?.classList.add('active')}}
function openPurchaseSurface(focusItem){if(mobileMaster())showPurchaseTab(focusItem);else openPurchase(focusItem)}
window.dmOpenPurchaseRecord=function(item){if(item)openRecordForm(item,null)};
function setupControls(){
  if(!isMaster)return;
  ensurePurchaseTabUI();
  const top=document.querySelector('.top-actions');
  if(top&&!document.getElementById('purchaseTopBtn')){const btn=document.createElement('button');btn.id='purchaseTopBtn';btn.className='purchase-top-btn';btn.type='button';btn.textContent='구매';btn.setAttribute('aria-label','구매한 작품');const taste=document.getElementById('tasteTopBtn');if(taste&&taste.parentNode===top)taste.after(btn);else top.appendChild(btn);btn.addEventListener('click',()=>openPurchaseSurface())}
  document.getElementById('mobilePurchaseBtn')?.remove();
  const menuList=document.querySelector('.mobile-menu-list');
  if(menuList&&!document.getElementById('mobileBackupBtn')){const b=document.createElement('button');b.id='mobileBackupBtn';b.className='mobile-menu-link';b.type='button';b.innerHTML='<span>설정백업</span><span class="mobile-menu-arrow" aria-hidden="true">›</span>';menuList.appendChild(b);b.addEventListener('click',()=>{document.getElementById('mobileMenuBackdrop')?.classList.remove('open');openBackdrop('dmBackupBackdrop')})}
  const panel=document.querySelector('main.page .panel');
  if(panel&&!document.getElementById('pcBackupBtn')){const row=document.createElement('div');row.className='dm-backup-pc-wrap';const b=document.createElement('button');b.id='pcBackupBtn';b.className='pc-backup-btn';b.type='button';b.textContent='설정백업';row.appendChild(b);panel.insertBefore(row,panel.firstChild);b.addEventListener('click',()=>openBackdrop('dmBackupBackdrop'))}
}
function findItemFromCard(card){
  if(!card)return null;const workId=String(card.dataset.workId||'').trim();const title=String(card.querySelector('.book-title')?.textContent||'').trim();const author=String(card.querySelector('.book-meta')?.textContent||'').trim();const items=getItems();let item=workId?items.find(x=>String(x.workId??x.id??'')===workId):null;if(!item)item=items.find(x=>norm(x.title)===norm(title)&&norm(x.author)===norm(author));return item||{workId,title,author,link:card.querySelector('.book-title[href]')?.href||''}
}
let badgeScheduled=false;
function refreshBadges(){
  badgeScheduled=false;
  const store=readStore();
  document.querySelectorAll('.card').forEach(card=>{
    const item=findItemFromCard(card);if(!item)return;
    const purchased=!!findStoredWork(item,store)?.records?.length;
    const eventActions=!isMaster?card.querySelector('.card-actions.two-actions'):null;
    const eventFavorite=!isMaster?card.querySelector('.favorite-toggle'):null;
    const eventHistory=!isMaster?eventActions?.querySelector('.history-btn'):null;
    const eventCart=!isMaster?eventActions?.querySelector('.cart-btn'):null;

    if(eventActions){
      let purchaseBtn=eventActions.querySelector('.dm-event-purchase-btn');
      if(purchased){
        card.classList.add('dm-event-purchased');
        if(eventFavorite)eventFavorite.hidden=true;
        if(eventHistory)eventHistory.classList.add('dm-event-purchased-history');
        if(eventCart)eventCart.hidden=true;
        if(!purchaseBtn){
          purchaseBtn=document.createElement('button');
          purchaseBtn.type='button';
          purchaseBtn.className='dm-event-purchase-btn';
          purchaseBtn.textContent='구매한작품✓';
          purchaseBtn.setAttribute('aria-label','구매기록 보기');
          purchaseBtn.title='구매기록 보기';
          purchaseBtn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openPurchaseSurface(item)});
          eventActions.insertBefore(purchaseBtn,eventHistory||eventActions.firstChild);
        }
      }else{
        card.classList.remove('dm-event-purchased');
        if(eventFavorite)eventFavorite.hidden=false;
        if(eventHistory)eventHistory.classList.remove('dm-event-purchased-history');
        if(eventCart)eventCart.hidden=false;
        purchaseBtn?.remove();
      }
      return;
    }

    card.querySelectorAll('.favorite-action-btn,.favorite-toggle').forEach(btn=>{
      if(btn.disabled||btn.classList.contains('discontinued-action'))return;
      if(purchased){
        btn.classList.add('dm-purchased-replacement');
        btn.textContent=btn.classList.contains('favorite-toggle')?'구매':'구매✓';
        btn.setAttribute('aria-label','구매기록 보기');btn.title='구매기록 보기';
      }else if(btn.classList.contains('dm-purchased-replacement')){
        btn.classList.remove('dm-purchased-replacement');
        if(btn.classList.contains('favorite-toggle')){
          const on=btn.classList.contains('is-on');btn.textContent=on?'♥':'♡';btn.setAttribute('aria-label',on?'찜 해제':'찜하기');btn.title='';
        }else{
          const on=btn.classList.contains('is-on');btn.textContent=on?'찜됨':'찜';btn.setAttribute('aria-label',on?'찜됨':'찜하기');btn.title=on?'다른 찜목록으로 이동하거나 찜 해제':'현재 찜목록에 추가';
        }
      }
    });
  });
}
function scheduleBadges(){if(badgeScheduled)return;badgeScheduled=true;requestAnimationFrame(refreshBadges)}
function resultButtonText(item){return isPurchased(item)?'기록 추가':'등록'}
async function searchWorks(){
  const q=norm(document.getElementById('dmPurchaseSearch')?.value);const box=document.getElementById('dmPurchaseSearchResults');if(!box)return;box.innerHTML='';if(!q)return;
  box.innerHTML='<div class="dm-empty">검색 중...</div>';
  let all=[];try{all=await loadMasterCatalog()}catch(e){box.innerHTML='<div class="dm-empty">마스터 목록을 불러오지 못했습니다.</div>';return}
  const hits=all.filter(x=>norm(x.title).includes(q)||norm(x.author).includes(q)).slice(0,20);box.innerHTML='';if(!hits.length){box.innerHTML='<div class="dm-empty">검색 결과가 없습니다.</div>';return}hits.forEach(item=>{const row=document.createElement('div');row.className='dm-purchase-search-row';row.innerHTML=`<div class="dm-purchase-search-text"><div class="dm-purchase-search-title">${esc(item.title||'(제목 없음)')}</div><div class="dm-purchase-search-author">${esc(item.author||'작가 정보 없음')}</div></div><button type="button">${resultButtonText(item)}</button>`;row.querySelector('button').addEventListener('click',()=>openRecordForm(item,null));box.appendChild(row)})
}
function money(v){const n=Number(v);return Number.isFinite(n)&&n>=0?n.toLocaleString('ko-KR')+'원':''}
function recordSummary(r){const parts=[];if(r.type)parts.push(r.type);if(r.platform)parts.push(r.platform==='기타'?(r.platformOther||'기타'):r.platform);if(r.amount!==''&&r.amount!=null)parts.push(money(r.amount));if(r.discount!==''&&r.discount!=null)parts.push(String(r.discount)+'%');if(r.date)parts.push(r.date);return parts.join(' · ')||'상세 정보 없음'}
function renderPurchaseList(focusItem){
  const box=document.getElementById('dmPurchaseList'),count=document.getElementById('dmPurchaseCount');if(!box)return;const store=readStore();const works=Object.values(store.works).filter(w=>Array.isArray(w.records)&&w.records.length).sort((a,b)=>String(a.title||'').localeCompare(String(b.title||''),'ko-KR',{numeric:true}));if(count)count.textContent=`구매한 작품 ${works.length.toLocaleString('ko-KR')}개`;box.innerHTML='';if(!works.length){box.innerHTML='<div class="dm-empty">등록된 구매 작품이 없습니다.</div>';return}works.forEach(w=>{const card=document.createElement('article');card.className='dm-work-card';card.dataset.purchaseKey=w.key||itemKey(w);const records=(w.records||[]).slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||Number(b.updatedAt||0)-Number(a.updatedAt||0));card.innerHTML=`<div class="dm-work-head"><div><h3 class="dm-work-title">${esc(w.title||'(제목 없음)')}</h3><p class="dm-work-author">${esc(w.author||'작가 정보 없음')}</p></div></div><div class="dm-record-list"></div>`;const list=card.querySelector('.dm-record-list');records.forEach(r=>{const el=document.createElement('div');el.className='dm-record';el.innerHTML=`<div class="dm-record-summary">${esc(recordSummary(r))}</div>${r.memo?`<div class="dm-record-memo">${esc(r.memo)}</div>`:''}<div class="dm-record-actions"><button class="dm-record-edit" type="button" aria-label="구매기록 수정">수정</button><button class="dm-record-delete" type="button">삭제</button></div>`;el.querySelector('.dm-record-edit').addEventListener('click',()=>openRecordForm(w,r));el.querySelector('.dm-record-delete').addEventListener('click',()=>deleteRecord(w,r.id));list.appendChild(el)});box.appendChild(card);if(focusItem&&workMatches(w,focusItem)){card.dataset.purchaseFocus='true';requestAnimationFrame(()=>requestAnimationFrame(()=>{const modal=document.querySelector('#dmPurchaseBackdrop .dm-purchase-modal');if(modal){const top=card.offsetTop-Math.max(12,(modal.clientHeight-card.offsetHeight)/2);modal.scrollTo({top:Math.max(0,top),behavior:'auto'})}else card.scrollIntoView({block:'center',behavior:'auto'})}))}})
}
function openPurchase(focusItem){openBackdrop('dmPurchaseBackdrop');renderPurchaseList(focusItem);const q=document.getElementById('dmPurchaseSearch');if(q&&!focusItem)q.value='';const sr=document.getElementById('dmPurchaseSearchResults');if(sr)sr.innerHTML=''}
let formContext=null;
function openRecordForm(item,record){
  const stored=findStoredWork(item);const base=stored||item;formContext={item:base,recordId:record?.id||null};document.getElementById('dmPurchaseFormTitle').textContent=record?'구매기록 수정':'구매기록 추가';document.getElementById('dmPurchaseFormWork').textContent=`${base.title||'(제목 없음)'} · ${base.author||'작가 정보 없음'}`;document.getElementById('dmPurchaseType').value=record?.type||'소장';document.getElementById('dmPurchasePlatform').value=PLATFORM_OPTIONS.includes(record?.platform)?record.platform:'리디';document.getElementById('dmPurchasePlatformOther').value=record?.platformOther||'';document.getElementById('dmPurchaseAmount').value=record?.amount??'';document.getElementById('dmPurchaseDiscount').value=record?.discount??'';document.getElementById('dmPurchaseDate').value=record?.date||'';document.getElementById('dmPurchaseMemo').value=record?.memo||'';syncOtherPlatform();openBackdrop('dmPurchaseFormBackdrop')
}
function syncOtherPlatform(){const show=document.getElementById('dmPurchasePlatform')?.value==='기타';document.getElementById('dmPlatformOtherWrap')?.classList.toggle('show',!!show)}
function removePurchasedFromFavoriteViewNow(item){
  try{
    if(typeof state==='undefined'||!state)return;
    const matchesKey=favKey=>{
      const key=String(favKey??'').trim();
      if(!key)return false;
      const direct=[itemKey(item),item?.workId??item?.id,item?.link,`${item?.title||''}__${item?.author||''}`].map(v=>String(v??'').trim()).filter(Boolean);
      if(direct.includes(key))return true;
      try{
        const master=getItems().find(x=>String(itemKey(x))===key||String(x.workId??x.id??'').trim()===key||String(x.link||'').trim()===key||`${x.title||''}__${x.author||''}`===key);
        return !!(master&&workMatches(master,item));
      }catch(e){return false}
    };
    if(state.favoriteLists&&typeof state.favoriteLists==='object')Object.keys(state.favoriteLists).forEach(id=>{state.favoriteLists[id]=(state.favoriteLists[id]||[]).filter(k=>!matchesKey(k))});
    if(state.favorites&&typeof state.favorites.forEach==='function')[...state.favorites].forEach(k=>{if(matchesKey(k))state.favorites.delete(k)});
    if(state.eventCartSelection&&typeof state.eventCartSelection.forEach==='function')[...state.eventCartSelection].forEach(k=>{if(matchesKey(k))state.eventCartSelection.delete(k)});
    if(typeof saveFavorites==='function')saveFavorites();
    if(typeof refreshFavoriteListUI==='function')refreshFavoriteListUI();
    if(typeof updateBottomTabs==='function')updateBottomTabs();
    if(typeof render==='function'&&state.showFavorites)render(false);
  }catch(e){}
}
async function removePurchasedFromFavorites(item){
  try{
    const keys=new Set();
    const addKey=v=>{v=String(v??'').trim();if(v)keys.add(v)};
    addKey(item?.workId??item?.id); addKey(item?.link); addKey(`${item?.title||''}__${item?.author||''}`);
    // Favorite keys use the master's canonical workId/link/title-author key. Resolve it too,
    // especially when a purchase is added from the event page.
    let masterItem=null;
    try{
      const current=(typeof state!=='undefined'&&Array.isArray(state.items))?state.items:[];
      masterItem=current.find(x=>workMatches(x,item))||null;
    }catch(e){}
    if(!masterItem){try{const all=await loadMasterCatalog();masterItem=all.find(x=>workMatches(x,item))||null}catch(e){}}
    if(masterItem){addKey(masterItem.workId??masterItem.id);addKey(masterItem.link);addKey(`${masterItem.title||''}__${masterItem.author||''}`)}
    const removeKeys=arr=>(Array.isArray(arr)?arr:[]).filter(k=>!keys.has(String(k)));
    const raw=localStorage.getItem('dm_favorite_lists');
    if(raw){
      const data=JSON.parse(raw);let changed=false;
      if(data&&data.lists&&typeof data.lists==='object'){
        Object.keys(data.lists).forEach(id=>{const before=Array.isArray(data.lists[id])?data.lists[id]:[];const after=removeKeys(before);if(after.length!==before.length){data.lists[id]=after;changed=true}});
        if(changed)localStorage.setItem('dm_favorite_lists',JSON.stringify(data));
      }
    }
    const legacyRaw=localStorage.getItem('dm_favorites');
    if(legacyRaw){const arr=JSON.parse(legacyRaw);if(Array.isArray(arr)){const next=removeKeys(arr);if(next.length!==arr.length)localStorage.setItem('dm_favorites',JSON.stringify(next))}}
    try{
      if(typeof state!=='undefined'&&state){
        if(state.favoriteLists&&typeof state.favoriteLists==='object')Object.keys(state.favoriteLists).forEach(id=>{state.favoriteLists[id]=removeKeys(state.favoriteLists[id])});
        if(state.favorites&&typeof state.favorites.delete==='function')keys.forEach(k=>state.favorites.delete(k));
        if(state.eventCartSelection&&typeof state.eventCartSelection.delete==='function')keys.forEach(k=>state.eventCartSelection.delete(k));
        if(typeof saveFavorites==='function')saveFavorites();
        if(typeof refreshFavoriteListUI==='function')refreshFavoriteListUI();
        if(typeof updateBottomTabs==='function')updateBottomTabs();
        if(typeof render==='function'&&state.showFavorites)render(false);
      }
    }catch(e){}
    window.dispatchEvent(new CustomEvent('dm-purchase-saved',{detail:{workId:String(masterItem?.workId??item?.workId??item?.id??''),link:String((masterItem?.link??item?.link)||''),title:String((masterItem?.title??item?.title)||''),author:String((masterItem?.author??item?.author)||'')}}));
  }catch(e){}
}
function saveRecord(){
  if(!formContext)return;const item=formContext.item;const store=readStore();let work=findStoredWork(item,store);let key=work?Object.keys(store.works).find(k=>store.works[k]===work):itemKey(item);if(!work){work={key,workId:String(item.workId??item.id??'').trim(),title:String(item.title||'').trim(),author:String(item.author||'').trim(),link:String(item.link||'').trim(),records:[]};store.works[key]=work}if(!Array.isArray(work.records))work.records=[];const amountRaw=document.getElementById('dmPurchaseAmount').value.trim(),discountRaw=document.getElementById('dmPurchaseDiscount').value.trim();const data={type:document.getElementById('dmPurchaseType').value,platform:document.getElementById('dmPurchasePlatform').value,platformOther:document.getElementById('dmPurchasePlatformOther').value.trim(),amount:amountRaw===''?'':Math.max(0,Math.round(Number(amountRaw)||0)),discount:discountRaw===''?'':Math.max(0,Math.min(100,Number(discountRaw)||0)),date:document.getElementById('dmPurchaseDate').value,memo:document.getElementById('dmPurchaseMemo').value.trim(),updatedAt:Date.now()};if(formContext.recordId){const idx=work.records.findIndex(r=>r.id===formContext.recordId);if(idx>=0)work.records[idx]={...work.records[idx],...data}}else work.records.push({id:'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),createdAt:Date.now(),...data});saveStore(store);removePurchasedFromFavoriteViewNow(item);removePurchasedFromFavorites(item);closeBackdrop('dmPurchaseFormBackdrop');renderPurchaseList(item);renderPurchaseTab(item);searchWorks();scheduleBadges();window.dispatchEvent(new CustomEvent('dm-purchase-changed',{detail:{type:'save'}}))}
function deleteRecord(item,recordId){if(!confirm('이 구매기록을 삭제할까요?'))return;const store=readStore();const work=findStoredWork(item,store);if(!work)return;work.records=(work.records||[]).filter(r=>r.id!==recordId);if(!work.records.length){const k=Object.keys(store.works).find(k=>store.works[k]===work);if(k)delete store.works[k]}saveStore(store);renderPurchaseList();renderPurchaseTab();scheduleBadges();window.dispatchEvent(new CustomEvent('dm-purchase-changed',{detail:{type:'delete'}}))}
function maskId(v){try{const bytes=new TextEncoder().encode(String(v??''));let bin='';bytes.forEach(b=>bin+=String.fromCharCode(b));return btoa(bin).split('').reverse().join('')}catch(e){return''}}
function unmaskId(v){try{const b64=String(v??'').split('').reverse().join(''),bin=atob(b64),bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));return new TextDecoder().decode(bytes)}catch(e){return''}}
function packPurchaseBackup(raw){
  try{
    const src=JSON.parse(raw||'null');
    if(!src||!src.works||typeof src.works!=='object')return raw;
    const works=Object.entries(src.works).map(([storeKey,w])=>{
      const copy={...(w||{})};
      const wid=String(copy.workId??'').trim();
      delete copy.workId; delete copy.key;
      return {...copy,_k:maskId(storeKey),_w:wid?maskId(wid):''};
    });
    return JSON.stringify({__dm_purchase_backup:1,version:src.version||1,works});
  }catch(e){return raw}
}
function unpackPurchaseBackup(raw){
  try{
    const src=JSON.parse(raw||'null');
    if(!src||src.__dm_purchase_backup!==1||!Array.isArray(src.works))return raw;
    const works={};
    src.works.forEach(entry=>{
      const copy={...(entry||{})};
      const storeKey=unmaskId(copy._k),wid=unmaskId(copy._w);
      delete copy._k; delete copy._w;
      if(wid)copy.workId=wid;
      const key=storeKey||wid||('ta:'+norm(copy.title)+'|'+norm(copy.author));
      copy.key=key;
      works[key]=copy;
    });
    return JSON.stringify({version:src.version||1,works});
  }catch(e){return raw}
}
function collectBackup(){const data={};for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key&&key.startsWith('dm_')){const value=localStorage.getItem(key);data[key]=key===STORAGE_KEY?packPurchaseBackup(value):value}}return{format:BACKUP_FORMAT,version:BACKUP_VERSION,exportedAt:new Date().toISOString(),storage:data}}
async function exportBackup(){const payload=JSON.stringify(collectBackup(),null,2);const d=new Date(),pad=n=>String(n).padStart(2,'0'),name=`마스터검색_백업_${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.json`;const blob=new Blob([payload],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function importBackupFile(file){let raw;try{raw=JSON.parse(await file.text())}catch(e){alert('백업 파일을 읽을 수 없습니다.');return}if(!raw||raw.format!==BACKUP_FORMAT||!raw.storage||typeof raw.storage!=='object'){alert('마스터검색 백업 파일이 아닙니다.');return}if(!confirm('현재 저장값을 백업 파일의 내용으로 가져올까요?'))return;try{Object.entries(raw.storage).forEach(([k,v])=>{if(k.startsWith('dm_')&&typeof v==='string')localStorage.setItem(k,k===STORAGE_KEY?unpackPurchaseBackup(v):v)});alert('가져오기가 완료되었습니다. 페이지를 새로고침합니다.');location.reload()}catch(e){alert('가져오기 중 오류가 발생했습니다.')}}
function bind(){
  document.getElementById('dmPurchaseClose')?.addEventListener('click',()=>closeBackdrop('dmPurchaseBackdrop'));document.getElementById('dmPurchaseFormClose')?.addEventListener('click',()=>closeBackdrop('dmPurchaseFormBackdrop'));document.getElementById('dmPurchaseFormCancel')?.addEventListener('click',()=>closeBackdrop('dmPurchaseFormBackdrop'));document.getElementById('dmBackupClose')?.addEventListener('click',()=>closeBackdrop('dmBackupBackdrop'));
  ['dmPurchaseBackdrop','dmPurchaseFormBackdrop','dmBackupBackdrop'].forEach(id=>document.getElementById(id)?.addEventListener('click',e=>{if(e.target.id===id)closeBackdrop(id)}));
  document.getElementById('dmPurchaseSearchBtn')?.addEventListener('click',searchWorks);document.getElementById('dmPurchaseSearch')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();searchWorks()}});document.getElementById('dmPurchasePlatform')?.addEventListener('change',syncOtherPlatform);document.getElementById('dmPurchaseFormSave')?.addEventListener('click',saveRecord);
  document.getElementById('dmBackupExport')?.addEventListener('click',exportBackup);document.getElementById('dmBackupImport')?.addEventListener('click',()=>document.getElementById('dmBackupFile')?.click());document.getElementById('dmBackupFile')?.addEventListener('change',e=>{const f=e.target.files?.[0];if(f)importBackupFile(f);e.target.value=''})
  document.addEventListener('click',e=>{const btn=e.target.closest?.('.favorite-action-btn.dm-purchased-replacement,.favorite-toggle.dm-purchased-replacement');if(!btn)return;const item=findItemFromCard(btn.closest('.card'));if(!item||!isPurchased(item))return;e.preventDefault();e.stopImmediatePropagation();openPurchaseSurface(item)},true);
  document.getElementById('tabPurchaseBtn')?.addEventListener('click',()=>showPurchaseTab());
  document.getElementById('dmPurchaseTabQuery')?.addEventListener('input',()=>{renderPurchaseTab();const b=document.getElementById('dmPurchaseTabSearchResults');if(b&&!document.getElementById('dmPurchaseTabQuery').value.trim())b.innerHTML='' });
  document.getElementById('dmPurchaseTabQuery')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();searchMasterFromPurchaseTab()}});
  document.getElementById('dmPurchaseTabPlatform')?.addEventListener('change',()=>renderPurchaseTab());
  document.getElementById('dmPurchaseTabSearchBtn')?.addEventListener('click',searchMasterFromPurchaseTab);
  ['tabSearchBtn','tabFavBtn','tabListBtn'].forEach(id=>document.getElementById(id)?.addEventListener('click',hidePurchaseTab,true));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeBackdrop('dmPurchaseFormBackdrop');closeBackdrop('dmPurchaseBackdrop');closeBackdrop('dmBackupBackdrop')}})
}
function init(){ensureStyle();makeModals();setupControls();bind();if(isMaster&&mobileMaster()&&state.activeMasterTab==='purchase')showPurchaseTab(null,true);scheduleBadges();const list=document.getElementById('list');if(list)new MutationObserver(scheduleBadges).observe(list,{childList:true,subtree:true});window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY)scheduleBadges()});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

