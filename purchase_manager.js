(function(){
'use strict';
const STORAGE_KEY='dm_purchase_records_v1';
const BACKUP_FORMAT='dm-master-backup';
const BACKUP_VERSION=2;
const PLATFORM_OPTIONS=['리디','교보eBook','YES24','알라딘','카카오페이지','네이버시리즈','봄툰','레진','기타'];
const isMaster=!!document.getElementById('mobileMenuBtn');
const MASTER_DATA_FILE='works.json';
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
function ensureStyle(){if(document.getElementById('dmPurchaseStyles'))return;const s=document.createElement('style');s.id='dmPurchaseStyles';s.textContent=`
.purchase-top-btn,.pc-backup-btn{display:inline-flex;align-items:center;justify-content:center;min-height:36px;border:1px solid #E5E7EB;border-radius:9px;background:#fff;color:var(--brown,#6b5a50);cursor:pointer;font-weight:700;font-size:15px;padding:0 14px;box-shadow:0 1px 5px rgba(0,0,0,.035)}
.purchase-top-btn:hover,.pc-backup-btn:hover{background:#F4F4F5}.favorite-action-btn.dm-purchased-replacement{background:#F2F0FA!important;color:#6E619D!important;border-color:#CFC7EA!important}.favorite-toggle.dm-purchased-replacement{font-size:11px!important;font-weight:700!important;letter-spacing:-.06em!important;background:#F2F0FA!important;color:#6E619D!important;border-color:#CFC7EA!important}
.dm-purchase-backdrop,.dm-backup-backdrop,.dm-purchase-form-backdrop{position:fixed;inset:0;z-index:1200;background:rgba(20,20,24,.48);display:none;align-items:center;justify-content:center;padding:18px}.dm-purchase-backdrop.open,.dm-backup-backdrop.open,.dm-purchase-form-backdrop.open{display:flex}.dm-purchase-modal,.dm-backup-modal,.dm-purchase-form-modal{width:min(760px,100%);max-height:min(88vh,840px);overflow:auto;background:#fff;border:1px solid #E5E7EB;border-radius:14px;box-shadow:0 18px 48px rgba(0,0,0,.22);padding:18px}.dm-backup-modal{width:min(520px,100%)}.dm-purchase-form-modal{width:min(560px,100%)}
.dm-modal-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.dm-modal-head h2{margin:0;font-size:20px;font-weight:700;letter-spacing:-.03em}.dm-modal-close{width:38px;height:38px;padding:0;border:1px solid #E5E7EB;border-radius:8px;background:#fff;font-size:24px;line-height:1;color:#52525B}.dm-purchase-addbox{padding:12px;border:1px solid #E5E7EB;border-radius:10px;background:#F7F7F8;margin-bottom:14px}.dm-purchase-addrow{display:grid;grid-template-columns:1fr auto;gap:8px}.dm-purchase-addrow input{min-width:0}.dm-purchase-search-results{display:grid;gap:7px;margin-top:9px}.dm-purchase-search-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px;padding:9px 10px;border:1px solid #E5E7EB;border-radius:8px;background:#fff}.dm-purchase-search-text{min-width:0}.dm-purchase-search-title{font-size:14px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dm-purchase-search-author{margin-top:2px;color:#71717A;font-size:12px;font-weight:600}.dm-purchase-search-row button,.dm-record-btn,.dm-record-edit,.dm-record-delete,.dm-work-delete,.dm-backup-actions button,.dm-form-actions button{min-height:36px;border-radius:7px;border:1px solid #D9DCE1;background:#fff;font-size:13px;font-weight:700;padding:0 12px}.dm-purchase-search-row button,.dm-record-btn,.dm-form-save,.dm-backup-primary{background:#9370DB!important;border-color:#9370DB!important;color:#fff!important}.dm-work-list{display:grid;gap:10px}.dm-work-card{border:1px solid #E5E7EB;border-radius:10px;padding:12px;background:#fff}.dm-work-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.dm-work-title{margin:0;font-size:15px;font-weight:700;line-height:1.35}.dm-work-author{margin:3px 0 0;color:#71717A;font-size:12px;font-weight:600}.dm-work-tools{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.dm-work-delete,.dm-record-delete{color:#9B3B35;border-color:#E5C8C4}.dm-record-list{display:grid;gap:7px;margin-top:10px}.dm-record{border-top:1px solid #ECECF0;padding-top:9px}.dm-record-summary{font-size:13px;line-height:1.55;color:#3F3F46}.dm-record-memo{margin-top:4px;color:#71717A;font-size:12px;white-space:pre-wrap;word-break:break-word}.dm-record-actions{display:flex;gap:6px;margin-top:7px}.dm-empty{padding:22px 8px;text-align:center;color:#71717A;font-size:13px;border:1px dashed #D9DCE1;border-radius:9px}.dm-purchase-count{margin:0 0 9px;color:#52525B;font-size:13px;font-weight:700}.dm-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px}.dm-field{display:grid;gap:5px}.dm-field.full{grid-column:1/-1}.dm-field label{font-size:12px;font-weight:700;color:#52525B}.dm-field input,.dm-field select,.dm-field textarea,.dm-purchase-addrow input{width:100%;min-height:42px;border:1px solid #D9DCE1;border-radius:7px;background:#fff;color:#27272A;font-size:16px;padding:8px 10px}.dm-field textarea{min-height:88px;resize:vertical}.dm-platform-other{display:none}.dm-platform-other.show{display:grid}.dm-form-actions,.dm-backup-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:15px;flex-wrap:wrap}.dm-backup-desc{margin:0 0 14px;color:#52525B;font-size:13px;line-height:1.55}.dm-backup-pc-wrap{display:flex;justify-content:flex-end;margin:-2px 0 8px}.pc-backup-btn{min-height:32px;border-radius:7px;font-size:13px;padding:0 11px}#dmBackupFile{display:none!important}#dmBackupImport{color:#52525B!important}html[data-theme="dark"] #dmBackupImport{color:#E4E4E7!important}
html[data-theme="dark"] .purchase-top-btn,html[data-theme="dark"] .pc-backup-btn,html[data-theme="dark"] .dm-modal-close,html[data-theme="dark"] .dm-record-btn,html[data-theme="dark"] .dm-record-edit,html[data-theme="dark"] .dm-record-delete,html[data-theme="dark"] .dm-work-delete,html[data-theme="dark"] .dm-backup-actions button,html[data-theme="dark"] .dm-form-actions button{background:#242427;color:#E4E4E7;border-color:#3F3F46}html[data-theme="dark"] .favorite-action-btn.dm-purchased-replacement,html[data-theme="dark"] .favorite-toggle.dm-purchased-replacement{background:#312E3D!important;border-color:#4A4657!important;color:#C4B5FD!important}html[data-theme="dark"] .dm-purchase-modal,html[data-theme="dark"] .dm-backup-modal,html[data-theme="dark"] .dm-purchase-form-modal,html[data-theme="dark"] .dm-work-card,html[data-theme="dark"] .dm-purchase-search-row{background:#242427;color:#F4F4F5;border-color:#3F3F46}html[data-theme="dark"] .dm-purchase-addbox{background:#1F1F22;border-color:#3F3F46}html[data-theme="dark"] .dm-field input,html[data-theme="dark"] .dm-field select,html[data-theme="dark"] .dm-field textarea,html[data-theme="dark"] .dm-purchase-addrow input{background:#1F1F22;border-color:#4A4A52;color:#F4F4F5}html[data-theme="dark"] .dm-record-summary,html[data-theme="dark"] .dm-purchase-count{color:#E4E4E7}html[data-theme="dark"] .dm-work-author,html[data-theme="dark"] .dm-record-memo,html[data-theme="dark"] .dm-backup-desc,html[data-theme="dark"] .dm-field label{color:#A1A1AA}
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
  .dm-purchase-form-backdrop{align-items:center!important;padding:10px!important;}
  .dm-purchase-form-modal{
    width:min(94vw,520px)!important;max-width:calc(100vw - 20px)!important;
    max-height:78vh!important;max-height:78dvh!important;overflow-y:auto!important;
    border-radius:14px!important;padding:14px!important;overscroll-behavior:contain;
  }
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
function setupControls(){
  if(!isMaster)return;
  const top=document.querySelector('.top-actions');
  if(top&&!document.getElementById('purchaseTopBtn')){const btn=document.createElement('button');btn.id='purchaseTopBtn';btn.className='purchase-top-btn';btn.type='button';btn.textContent='구매';btn.setAttribute('aria-label','구매한 작품');const taste=document.getElementById('tasteTopBtn');if(taste&&taste.parentNode===top)taste.after(btn);else top.appendChild(btn);btn.addEventListener('click',openPurchase)}
  const menuList=document.querySelector('.mobile-menu-list');
  if(menuList&&!document.getElementById('mobilePurchaseBtn')){const p=document.createElement('button');p.id='mobilePurchaseBtn';p.className='mobile-menu-link';p.type='button';p.innerHTML='<span>구매한 작품</span><span class="mobile-menu-arrow" aria-hidden="true">›</span>';const recent=document.getElementById('mobileRecentViewedBtn');if(recent&&recent.parentNode===menuList)recent.before(p);else menuList.appendChild(p);p.addEventListener('click',()=>{document.getElementById('mobileMenuBackdrop')?.classList.remove('open');openPurchase()})}
  if(menuList&&!document.getElementById('mobileBackupBtn')){const b=document.createElement('button');b.id='mobileBackupBtn';b.className='mobile-menu-link';b.type='button';b.innerHTML='<span>설정백업</span><span class="mobile-menu-arrow" aria-hidden="true">›</span>';menuList.appendChild(b);b.addEventListener('click',()=>{document.getElementById('mobileMenuBackdrop')?.classList.remove('open');openBackdrop('dmBackupBackdrop')})}
  const panel=document.querySelector('main.page .panel');
  if(panel&&!document.getElementById('pcBackupBtn')){const row=document.createElement('div');row.className='dm-backup-pc-wrap';const b=document.createElement('button');b.id='pcBackupBtn';b.className='pc-backup-btn';b.type='button';b.textContent='설정백업';row.appendChild(b);panel.insertBefore(row,panel.firstChild);b.addEventListener('click',()=>openBackdrop('dmBackupBackdrop'))}
}
function findItemFromCard(card){
  if(!card)return null;const workId=String(card.dataset.workId||'').trim();const title=String(card.querySelector('.book-title')?.textContent||'').trim();const author=String(card.querySelector('.book-meta')?.textContent||'').trim();const items=getItems();let item=workId?items.find(x=>String(x.workId??x.id??'')===workId):null;if(!item)item=items.find(x=>norm(x.title)===norm(title)&&norm(x.author)===norm(author));return item||{workId,title,author,link:card.querySelector('.book-title[href]')?.href||''}
}
let badgeScheduled=false;
function refreshBadges(){badgeScheduled=false;const store=readStore();document.querySelectorAll('.card').forEach(card=>{const item=findItemFromCard(card);if(!item)return;const purchased=!!findStoredWork(item,store)?.records?.length;card.querySelectorAll('.favorite-action-btn,.favorite-toggle').forEach(btn=>{if(btn.disabled||btn.classList.contains('discontinued-action'))return;if(purchased){btn.classList.add('dm-purchased-replacement');btn.textContent=btn.classList.contains('favorite-toggle')?'구매':'구매✓';btn.setAttribute('aria-label','구매기록 보기');btn.title='구매기록 보기'}else if(btn.classList.contains('dm-purchased-replacement')){btn.classList.remove('dm-purchased-replacement');if(btn.classList.contains('favorite-toggle')){const on=btn.classList.contains('is-on');btn.textContent=on?'♥':'♡';btn.setAttribute('aria-label',on?'찜 해제':'찜하기');btn.title=''}else{const on=btn.classList.contains('is-on');btn.textContent=on?'찜됨':'찜';btn.setAttribute('aria-label',on?'찜됨':'찜하기');btn.title=on?'다른 찜목록으로 이동하거나 찜 해제':'현재 찜목록에 추가'}}})})}
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
  const box=document.getElementById('dmPurchaseList'),count=document.getElementById('dmPurchaseCount');if(!box)return;const store=readStore();const works=Object.values(store.works).filter(w=>Array.isArray(w.records)&&w.records.length).sort((a,b)=>String(a.title||'').localeCompare(String(b.title||''),'ko-KR',{numeric:true}));if(count)count.textContent=`구매한 작품 ${works.length.toLocaleString('ko-KR')}개`;box.innerHTML='';if(!works.length){box.innerHTML='<div class="dm-empty">등록된 구매 작품이 없습니다.</div>';return}works.forEach(w=>{const card=document.createElement('article');card.className='dm-work-card';card.dataset.purchaseKey=w.key||itemKey(w);const records=(w.records||[]).slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||Number(b.updatedAt||0)-Number(a.updatedAt||0));card.innerHTML=`<div class="dm-work-head"><div><h3 class="dm-work-title">${esc(w.title||'(제목 없음)')}</h3><p class="dm-work-author">${esc(w.author||'작가 정보 없음')}</p></div><div class="dm-work-tools"><button class="dm-record-btn" type="button">기록 추가</button><button class="dm-work-delete" type="button">전체 삭제</button></div></div><div class="dm-record-list"></div>`;card.querySelector('.dm-record-btn').addEventListener('click',()=>openRecordForm(w,null));card.querySelector('.dm-work-delete').addEventListener('click',()=>{if(!confirm('이 작품의 구매기록을 모두 삭제할까요?'))return;const s=readStore();const found=findStoredWork(w,s);if(found){const k=Object.keys(s.works).find(k=>s.works[k]===found);if(k)delete s.works[k];saveStore(s);renderPurchaseList();scheduleBadges()}});const list=card.querySelector('.dm-record-list');records.forEach(r=>{const el=document.createElement('div');el.className='dm-record';el.innerHTML=`<div class="dm-record-summary">${esc(recordSummary(r))}</div>${r.memo?`<div class="dm-record-memo">${esc(r.memo)}</div>`:''}<div class="dm-record-actions"><button class="dm-record-edit" type="button">수정</button><button class="dm-record-delete" type="button">삭제</button></div>`;el.querySelector('.dm-record-edit').addEventListener('click',()=>openRecordForm(w,r));el.querySelector('.dm-record-delete').addEventListener('click',()=>deleteRecord(w,r.id));list.appendChild(el)});box.appendChild(card);if(focusItem&&workMatches(w,focusItem))setTimeout(()=>card.scrollIntoView({block:'nearest'}),0)})
}
function openPurchase(focusItem){openBackdrop('dmPurchaseBackdrop');renderPurchaseList(focusItem);const q=document.getElementById('dmPurchaseSearch');if(q&&!focusItem)q.value='';const sr=document.getElementById('dmPurchaseSearchResults');if(sr)sr.innerHTML=''}
let formContext=null;
function openRecordForm(item,record){
  const stored=findStoredWork(item);const base=stored||item;formContext={item:base,recordId:record?.id||null};document.getElementById('dmPurchaseFormTitle').textContent=record?'구매기록 수정':'구매기록 추가';document.getElementById('dmPurchaseFormWork').textContent=`${base.title||'(제목 없음)'} · ${base.author||'작가 정보 없음'}`;document.getElementById('dmPurchaseType').value=record?.type||'소장';document.getElementById('dmPurchasePlatform').value=PLATFORM_OPTIONS.includes(record?.platform)?record.platform:'리디';document.getElementById('dmPurchasePlatformOther').value=record?.platformOther||'';document.getElementById('dmPurchaseAmount').value=record?.amount??'';document.getElementById('dmPurchaseDiscount').value=record?.discount??'';document.getElementById('dmPurchaseDate').value=record?.date||'';document.getElementById('dmPurchaseMemo').value=record?.memo||'';syncOtherPlatform();openBackdrop('dmPurchaseFormBackdrop')
}
function syncOtherPlatform(){const show=document.getElementById('dmPurchasePlatform')?.value==='기타';document.getElementById('dmPlatformOtherWrap')?.classList.toggle('show',!!show)}
function saveRecord(){
  if(!formContext)return;const item=formContext.item;const store=readStore();let work=findStoredWork(item,store);let key=work?Object.keys(store.works).find(k=>store.works[k]===work):itemKey(item);if(!work){work={key,workId:String(item.workId??item.id??'').trim(),title:String(item.title||'').trim(),author:String(item.author||'').trim(),link:String(item.link||'').trim(),records:[]};store.works[key]=work}if(!Array.isArray(work.records))work.records=[];const amountRaw=document.getElementById('dmPurchaseAmount').value.trim(),discountRaw=document.getElementById('dmPurchaseDiscount').value.trim();const data={type:document.getElementById('dmPurchaseType').value,platform:document.getElementById('dmPurchasePlatform').value,platformOther:document.getElementById('dmPurchasePlatformOther').value.trim(),amount:amountRaw===''?'':Math.max(0,Math.round(Number(amountRaw)||0)),discount:discountRaw===''?'':Math.max(0,Math.min(100,Number(discountRaw)||0)),date:document.getElementById('dmPurchaseDate').value,memo:document.getElementById('dmPurchaseMemo').value.trim(),updatedAt:Date.now()};if(formContext.recordId){const idx=work.records.findIndex(r=>r.id===formContext.recordId);if(idx>=0)work.records[idx]={...work.records[idx],...data}}else work.records.push({id:'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),createdAt:Date.now(),...data});saveStore(store);closeBackdrop('dmPurchaseFormBackdrop');renderPurchaseList(item);searchWorks();scheduleBadges()}
function deleteRecord(item,recordId){if(!confirm('이 구매기록을 삭제할까요?'))return;const store=readStore();const work=findStoredWork(item,store);if(!work)return;work.records=(work.records||[]).filter(r=>r.id!==recordId);if(!work.records.length){const k=Object.keys(store.works).find(k=>store.works[k]===work);if(k)delete store.works[k]}saveStore(store);renderPurchaseList();scheduleBadges()}
function collectBackup(){const data={};for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key&&key.startsWith('dm_'))data[key]=localStorage.getItem(key)}return{format:BACKUP_FORMAT,version:BACKUP_VERSION,exportedAt:new Date().toISOString(),storage:data}}
async function exportBackup(){const payload=JSON.stringify(collectBackup(),null,2);const d=new Date(),pad=n=>String(n).padStart(2,'0'),name=`마스터검색_백업_${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.json`;const blob=new Blob([payload],{type:'application/json'});const file=new File([blob],name,{type:'application/json'});if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:'마스터검색 설정백업'});return}catch(e){if(e?.name==='AbortError')return}}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function importBackupFile(file){let raw;try{raw=JSON.parse(await file.text())}catch(e){alert('백업 파일을 읽을 수 없습니다.');return}if(!raw||raw.format!==BACKUP_FORMAT||!raw.storage||typeof raw.storage!=='object'){alert('마스터검색 백업 파일이 아닙니다.');return}if(!confirm('현재 저장값을 백업 파일의 내용으로 가져올까요?'))return;try{Object.entries(raw.storage).forEach(([k,v])=>{if(k.startsWith('dm_')&&typeof v==='string')localStorage.setItem(k,v)});alert('가져오기가 완료되었습니다. 페이지를 새로고침합니다.');location.reload()}catch(e){alert('가져오기 중 오류가 발생했습니다.')}}
function bind(){
  document.getElementById('dmPurchaseClose')?.addEventListener('click',()=>closeBackdrop('dmPurchaseBackdrop'));document.getElementById('dmPurchaseFormClose')?.addEventListener('click',()=>closeBackdrop('dmPurchaseFormBackdrop'));document.getElementById('dmPurchaseFormCancel')?.addEventListener('click',()=>closeBackdrop('dmPurchaseFormBackdrop'));document.getElementById('dmBackupClose')?.addEventListener('click',()=>closeBackdrop('dmBackupBackdrop'));
  ['dmPurchaseBackdrop','dmPurchaseFormBackdrop','dmBackupBackdrop'].forEach(id=>document.getElementById(id)?.addEventListener('click',e=>{if(e.target.id===id)closeBackdrop(id)}));
  document.getElementById('dmPurchaseSearchBtn')?.addEventListener('click',searchWorks);document.getElementById('dmPurchaseSearch')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();searchWorks()}});document.getElementById('dmPurchasePlatform')?.addEventListener('change',syncOtherPlatform);document.getElementById('dmPurchaseFormSave')?.addEventListener('click',saveRecord);
  document.getElementById('dmBackupExport')?.addEventListener('click',exportBackup);document.getElementById('dmBackupImport')?.addEventListener('click',()=>document.getElementById('dmBackupFile')?.click());document.getElementById('dmBackupFile')?.addEventListener('change',e=>{const f=e.target.files?.[0];if(f)importBackupFile(f);e.target.value=''})
  document.addEventListener('click',e=>{const btn=e.target.closest?.('.favorite-action-btn.dm-purchased-replacement,.favorite-toggle.dm-purchased-replacement');if(!btn)return;const item=findItemFromCard(btn.closest('.card'));if(!item||!isPurchased(item))return;e.preventDefault();e.stopImmediatePropagation();openPurchase(item)},true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeBackdrop('dmPurchaseFormBackdrop');closeBackdrop('dmPurchaseBackdrop');closeBackdrop('dmBackupBackdrop')}})
}
function init(){ensureStyle();makeModals();setupControls();bind();scheduleBadges();const list=document.getElementById('list');if(list)new MutationObserver(scheduleBadges).observe(list,{childList:true,subtree:true});window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY)scheduleBadges()});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
