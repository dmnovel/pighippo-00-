

async function loadProtectedJson(url,keyHex){const res=await fetch(url,{cache:'no-store'});if(!res.ok)throw new Error('data missing');return await res.json()}
const PAGE_SIZE=100;
// 이벤트 페이지 URL을 아래 따옴표 안에 넣으면 모바일 메뉴의 보라색 점과 최초 1회 공지 팝업이 자동 활성화됩니다.
const EVENT_PAGE_URL='./event/';
const FAVORITE_LEGACY_KEY='dm_favorites';
const FAVORITE_LISTS_STORAGE_KEY='dm_favorite_lists';
const ACTIVE_FAVORITE_LIST_KEY='dm_active_favorite_list';
const RECENT_SEARCH_STORAGE_KEY='dm_recent_searches';
const EVENT_CART_STORAGE_KEY='dm_202608_onepick_event_cart';
const RECENT_SEARCH_LIMIT=5;
const ALERT_DATA_VERSION='20260801-2';
const EVENT_ALERT_DATA_URL='./event/events.json';
const EVENT_ALERT_READ_KEY='dm_event_alert_read_items';
const MESSAGE_DATA_URL='./messages.json';
const MESSAGE_READ_KEY='dm_message_read_items';
const MASTER_ACTIVE_TAB_KEY='dm_master_active_tab';
function readMasterActiveTab(){try{const value=sessionStorage.getItem(MASTER_ACTIVE_TAB_KEY);return value==='favorites'||value==='list'||value==='purchase'?value:'search'}catch{return'search'}}
function saveMasterActiveTab(tab){try{const value=tab||state.activeMasterTab||'search';sessionStorage.setItem(MASTER_ACTIVE_TAB_KEY,value)}catch{}}
function readJsonStorage(key,fallback){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback}catch{return fallback}}
function loadFavoriteData(){const legacy=readJsonStorage(FAVORITE_LEGACY_KEY,[]);const saved=readJsonStorage(FAVORITE_LISTS_STORAGE_KEY,null);let lists=saved&&saved.lists&&typeof saved.lists==='object'?saved.lists:null;let names=saved&&saved.names&&typeof saved.names==='object'?saved.names:null;if(!lists){lists={fav1:Array.isArray(legacy)?legacy:[],fav2:[],fav3:[]};names={fav1:'',fav2:'',fav3:''}}['fav1','fav2','fav3'].forEach(id=>{if(!Array.isArray(lists[id]))lists[id]=[];if(!Object.prototype.hasOwnProperty.call(names,id))names[id]=''});let activeId=localStorage.getItem(ACTIVE_FAVORITE_LIST_KEY)||'fav1';if(!lists[activeId])activeId='fav1';return{lists,names,activeId}}
const loadedFavoriteData=loadFavoriteData();
const initialMasterTab=readMasterActiveTab();
const state={items:[],filtered:[],visibleCount:PAGE_SIZE,selectedHistoryDates:new Set(),eventCartSelection:new Set(),includeDiscontinued:false,excludePurchased:false,viewMode:"list",favoriteLists:loadedFavoriteData.lists,favoriteNames:loadedFavoriteData.names,activeFavoriteListId:loadedFavoriteData.activeId,favorites:new Set(loadedFavoriteData.lists[loadedFavoriteData.activeId]||[]),favoriteQuery:'',showFavorites:initialMasterTab==='favorites',showDateList:initialMasterTab==='list',activeMasterTab:initialMasterTab,eventAlerts:[],activeEvent:null,messages:[]};
const els={q:document.getElementById('q'),searchBtn:document.getElementById('searchBtn'),sortBy:document.getElementById('sortBy'),resetBtn:document.getElementById('resetBtn'),titleOnly:document.getElementById('titleOnly'),authorOnly:document.getElementById('authorOnly'),exclude:document.getElementById('exclude'),discountRate:document.getElementById('discountRate'),resultCount:document.getElementById('resultCount'),activeSummary:document.getElementById('activeSummary'),list:document.getElementById('list'),empty:document.getElementById('empty'),error:document.getElementById('error'),loadMoreWrap:document.getElementById('loadMoreWrap'),loadMoreBtn:document.getElementById('loadMoreBtn'),goTopBtn:document.getElementById('goTopBtn'),goBottomBtn:document.getElementById('goBottomBtn'),bottomAnchor:document.getElementById('bottomAnchor'),detailToggleBtn:document.getElementById('detailToggleBtn'),detailRow:document.getElementById('detailRow'),keywordPickerBtn:document.getElementById('keywordPickerBtn'),keywordPickerPanel:document.getElementById('keywordPickerPanel'),keywordPickerCount:document.getElementById('keywordPickerCount'),keywordQuery:document.getElementById('keywordQuery'),keywordFindBtn:document.getElementById('keywordFindBtn'),keywordSearchResetBtn:document.getElementById('keywordSearchResetBtn'),keywordPickerMessage:document.getElementById('keywordPickerMessage'),keywordSearchResultsWrap:document.getElementById('keywordSearchResultsWrap'),keywordResults:document.getElementById('keywordResults'),keywordIncludeMajor:document.getElementById('keywordIncludeMajor'),keywordIncludeDetail:document.getElementById('keywordIncludeDetail'),keywordExcludeMajor:document.getElementById('keywordExcludeMajor'),keywordExcludeDetail:document.getElementById('keywordExcludeDetail'),keywordSelectedWrap:document.getElementById('keywordSelectedWrap'),keywordIncludeChips:document.getElementById('keywordIncludeChips'),keywordExcludeChips:document.getElementById('keywordExcludeChips'),keywordClearBtn:document.getElementById('keywordClearBtn'),recentSearches:document.getElementById('recentSearches'),recentSearchList:document.getElementById('recentSearchList'),recentSearchClear:document.getElementById('recentSearchClear'),includeDiscontinued:document.getElementById('includeDiscontinued'),excludePurchased:document.getElementById('excludePurchased')};
Object.assign(els,{favListBar:document.getElementById('favoriteListBar'),favListSelect:document.getElementById('favListSelect'),favListMenuBtn:document.getElementById('favListMenuBtn'),favListMenu:document.getElementById('favListMenu'),favListAddBtn:document.getElementById('favListAddBtn'),favListDeleteBtn:document.getElementById('favListDeleteBtn'),favListNameInput:document.getElementById('favListNameInput'),favListRenameBtn:document.getElementById('favListRenameBtn'),favListCount:document.getElementById('favListCount'),favoriteSearchInput:document.getElementById('favoriteSearchInput'),favoriteSearchBtn:document.getElementById('favoriteSearchBtn'),favoriteSearchMessage:document.getElementById('favoriteSearchMessage'),favoriteToast:document.getElementById('favoriteToast'),tasteTopBtn:document.getElementById('tasteTopBtn'),eventAlertBtn:document.getElementById('eventAlertBtn'),eventAlertIcon:document.getElementById('eventAlertIcon'),eventAlertBadge:document.getElementById('eventAlertBadge'),eventAlertBackdrop:document.getElementById('eventAlertBackdrop'),eventAlertClose:document.getElementById('eventAlertClose'),eventAlertMeta:document.getElementById('eventAlertMeta'),eventAlertPeriod:document.getElementById('eventAlertPeriod'),eventAlertReadAll:document.getElementById('eventAlertReadAll'),eventAlertList:document.getElementById('eventAlertList')});

state.keywordInclude=new Set();
state.keywordExclude=new Set();
state.keywordCatalog=[];
state.keywordGroups=[];
state.keywordSearchDismissed=new Set();
state.keywordSearchQueryNorm='';
const KEYWORD_GROUP_ORDER=['장르','관계','인물(공)','인물(수)','소재','분위기/기타'];
const KEYWORD_GROUP_RULES={
'장르':new Set(['현대물','판타지물','서양풍','시대물','동양풍','SF/미래물','학원/캠퍼스물','리맨물','전문직물','궁정물','연예계','게임물','헌터물','정치/사회/재벌','미스터리/오컬트','추리/스릴러','추리/미스터리/스릴러','해외소설']),
'관계':new Set(['첫사랑','재회물','친구&gt;연인','동거/배우자','나이차이','신분차이','애증','계약','소꿉친구','사내연애','원나잇','금단의관계','라이벌/열등감','배틀연애','스폰서','하극상','사제관계','키잡물','역키잡물','다공일수','서브공있음','서브수있음','리버스','운명적사랑']),
'인물(공)':new Set(['다정공','집착공','절륜공','강공','미남공','미인공','사랑꾼공','순정공','연하공','헌신공','능글공','존댓말공','복흑/계략공','재벌공','능욕공','상처공','후회공','까칠공','대형견공','개아가공','광공','츤데레공','초딩공','무심공','냉혈공','귀염공','순진공','울보공','천재공','호구공','황제공','공시점','다정남','순정남']),
'인물(수)':new Set(['미인수','다정수','상처수','순진수','단정수','연상수','능력수','미남수','무심수','적극수','소심수','짝사랑수','외유내강수','강수','임신수','굴림수','순정수','명랑수','얼빠수','허당수','도망수','헌신수','잔망수','츤데레수','평범수','호구수','유혹수','떡대수','병약수','계략수','후회수','재벌수','군림수','우월수','냉혈수','중년수','수시점','엉뚱녀','쾌활발랄녀']),
'소재':new Set(['오메가버스','OO버스','가이드버스','초능력','차원이동/영혼바뀜','전생/환생','회귀물','인외존재','대학생','왕족/귀족','외국인','조직/암흑가','스포츠','SM','감금','복수','질투','구원']),
'분위기/기타':new Set(['달달물','일상물','사건물','성장물','오해/착각','삽질물','코믹/개그물','시리어스물','피폐물','힐링물','하드코어','잔잔물','애절물','할리킹','3인칭시점','단행본','연재완결','기다리면무료','2권이하','5권이상','5000원이하','3000~5000원','5000~10000원','10000~15000원','15000~20000원','2만원초과','10%할인','평점4점이상','리뷰100개이상','리뷰1000개이상','별점100개이상','별점500개이상','별점1000개이상','별점10000개이상'])
};
function getItemKeywordNorms(item){if(!item._keywordNorms)item._keywordNorms=(item.keywords||[]).map(normalizeText).filter(Boolean);return item._keywordNorms}
function classifyKeyword(keyword){for(const group of KEYWORD_GROUP_ORDER){if(KEYWORD_GROUP_RULES[group].has(keyword))return group}if(/공$/.test(keyword)||keyword==='공시점')return '인물(공)';if(/수$/.test(keyword)||keyword==='수시점')return '인물(수)';return '분위기/기타'}
function populateKeywordCatalog(){const map=new Map();state.items.forEach(item=>(item.keywords||[]).forEach(keyword=>{const key=normalizeText(keyword);if(key&&!map.has(key))map.set(key,String(keyword).trim())}));state.keywordCatalog=[...map.values()].sort((a,b)=>a.localeCompare(b,'ko-KR',{numeric:true}));state.keywordGroups=KEYWORD_GROUP_ORDER.map(name=>({name,keywords:state.keywordCatalog.filter(k=>classifyKeyword(k)===name)}));renderKeywordCategories();renderKeywordSelection();updateKeywordMessage()}
function updateKeywordMessage(text){if(!els.keywordPickerMessage)return;els.keywordPickerMessage.textContent=text??(state.keywordCatalog.length?'분류별 드롭다운에서 선택하거나 위에서 키워드를 검색하세요.':'등록된 키워드가 없습니다.')}
function toggleKeywordPanel(){const open=els.keywordPickerPanel.hidden;els.keywordPickerPanel.hidden=!open;els.keywordPickerBtn.setAttribute('aria-expanded',String(open));if(open)setTimeout(()=>els.keywordQuery.focus(),0)}
function dismissKeywordResult(keyword,row){
state.keywordSearchDismissed.add(keyword);
if(row)row.remove();
const remaining=els.keywordResults?els.keywordResults.querySelectorAll('.keyword-result-row').length:0;
if(!remaining){
if(els.keywordSearchResultsWrap){els.keywordSearchResultsWrap.hidden=true;els.keywordSearchResultsWrap.style.display=''}
updateKeywordMessage('검색 결과를 모두 삭제했습니다.')
}else updateKeywordMessage(`검색 결과 ${remaining}개`)
}
function createKeywordRow(keyword){const row=document.createElement('div');row.className='keyword-result-row';const name=document.createElement('span');name.className='keyword-result-name';name.textContent=keyword;const include=document.createElement('button');include.type='button';include.className=state.keywordInclude.has(keyword)?'is-selected secondary':'secondary';include.textContent=state.keywordInclude.has(keyword)?'포함됨':'포함';include.addEventListener('click',()=>selectKeyword(keyword,'include'));const exclude=document.createElement('button');exclude.type='button';exclude.className=state.keywordExclude.has(keyword)?'is-selected secondary':'secondary';exclude.textContent=state.keywordExclude.has(keyword)?'제외됨':'제외';exclude.addEventListener('click',()=>selectKeyword(keyword,'exclude'));const remove=document.createElement('button');remove.type='button';remove.className='secondary keyword-result-remove';remove.textContent='×';remove.setAttribute('aria-label',`${keyword} 검색 결과 삭제`);remove.title='검색 결과에서 삭제';remove.addEventListener('click',()=>dismissKeywordResult(keyword,row));row.append(name,include,exclude,remove);return row}
function renderKeywordCategories(){
const pairs=[
{major:els.keywordIncludeMajor,detail:els.keywordIncludeDetail,mode:'include'},
{major:els.keywordExcludeMajor,detail:els.keywordExcludeDetail,mode:'exclude'}
];
pairs.forEach(({major,detail,mode})=>{
if(!major||!detail)return;
const savedMajor=major.value;
major.innerHTML='<option value="">대분류 선택</option>';
state.keywordGroups.forEach(group=>{
const option=document.createElement('option');
option.value=group.name;
option.textContent=group.name;
major.appendChild(option)
});
if(savedMajor&&state.keywordGroups.some(group=>group.name===savedMajor))major.value=savedMajor;
const fillDetails=()=>{
const savedDetail=detail.value;
const group=state.keywordGroups.find(item=>item.name===major.value);
detail.innerHTML='<option value="">세부 키워드 선택</option>';
if(!group){detail.disabled=true;return}
group.keywords.forEach(keyword=>{
const option=document.createElement('option');
option.value=keyword;
const selected=mode==='include'?state.keywordInclude.has(keyword):state.keywordExclude.has(keyword);
option.textContent=(selected?'✓ ':'')+keyword;
detail.appendChild(option)
});
detail.disabled=!group.keywords.length;
if(savedDetail&&group.keywords.includes(savedDetail))detail.value=savedDetail
};
major.onchange=()=>{
detail.value='';
fillDetails()
};
detail.onchange=()=>{
const keyword=detail.value;
if(!keyword)return;
selectKeyword(keyword,mode);
detail.value=''
};
fillDetails()
})
}
function findKeywords(resetDismissed=false){
const raw=String(els.keywordQuery?.value??'').trim();
const q=normalizeText(raw);
if(!els.keywordResults)return;
if(resetDismissed||state.keywordSearchQueryNorm!==q){
state.keywordSearchDismissed.clear();
state.keywordSearchQueryNorm=q
}
els.keywordResults.innerHTML='';
if(els.keywordSearchResultsWrap){
els.keywordSearchResultsWrap.hidden=true;
els.keywordSearchResultsWrap.style.display=''
}
if(!state.keywordCatalog.length){
updateKeywordMessage('등록된 키워드가 없습니다.');
return
}
if(!q){
updateKeywordMessage('검색할 키워드를 입력하세요.');
return
}
const allMatches=state.keywordCatalog.filter(keyword=>normalizeText(keyword).includes(q));
const matches=allMatches.filter(keyword=>!state.keywordSearchDismissed.has(keyword));
if(!allMatches.length){
updateKeywordMessage('일치하는 키워드가 없습니다.');
return
}
if(!matches.length){
updateKeywordMessage('검색 결과를 모두 삭제했습니다.');
return
}
const frag=document.createDocumentFragment();
matches.forEach(keyword=>frag.appendChild(createKeywordRow(keyword)));
els.keywordResults.appendChild(frag);
if(els.keywordSearchResultsWrap){
els.keywordSearchResultsWrap.hidden=false;
els.keywordSearchResultsWrap.style.display='block'
}
updateKeywordMessage(`검색 결과 ${matches.length}개`)
}
function resetKeywordSearchResults(){
if(els.keywordQuery)els.keywordQuery.value='';
if(els.keywordResults)els.keywordResults.innerHTML='';
if(els.keywordSearchResultsWrap){els.keywordSearchResultsWrap.hidden=true;els.keywordSearchResultsWrap.style.display=''}
state.keywordSearchDismissed.clear();
state.keywordSearchQueryNorm='';
updateKeywordMessage();
if(els.keywordQuery)els.keywordQuery.focus()
}
function selectKeyword(keyword,mode){
const target=mode==='include'?state.keywordInclude:state.keywordExclude;
const other=mode==='include'?state.keywordExclude:state.keywordInclude;
if(target.has(keyword))target.delete(keyword);
else{
other.delete(keyword);
target.add(keyword)
}
renderKeywordSelection();
renderKeywordCategories();
applyFilters();
if(els.keywordQuery?.value.trim())findKeywords()
}
function makeKeywordChip(keyword,mode){
const chip=document.createElement('span');
chip.className='keyword-chip'+(mode==='exclude'?' exclude':'');
const text=document.createElement('span');
text.textContent=keyword;
const remove=document.createElement('button');
remove.type='button';
remove.className='keyword-chip-remove';
remove.setAttribute('aria-label',`${keyword} ${mode==='include'?'포함':'제외'} 해제`);
remove.textContent='×';
remove.addEventListener('click',()=>{
(mode==='include'?state.keywordInclude:state.keywordExclude).delete(keyword);
renderKeywordSelection();
renderKeywordCategories();
applyFilters();
if(els.keywordQuery?.value.trim())findKeywords()
});
chip.append(text,remove);
return chip
}
function renderKeywordSelection(){
if(!els.keywordPickerCount)return;
const total=state.keywordInclude.size+state.keywordExclude.size;
els.keywordPickerCount.textContent=`선택 ${total}개 ▼`;
els.keywordSelectedWrap.hidden=total===0;
els.keywordIncludeChips.innerHTML='';
els.keywordExcludeChips.innerHTML='';
if(state.keywordInclude.size){
const label=document.createElement('span');
label.className='keyword-selected-label';
label.textContent='포함';
els.keywordIncludeChips.appendChild(label);
state.keywordInclude.forEach(k=>els.keywordIncludeChips.appendChild(makeKeywordChip(k,'include')))
}
if(state.keywordExclude.size){
const label=document.createElement('span');
label.className='keyword-selected-label';
label.textContent='제외';
els.keywordExcludeChips.appendChild(label);
state.keywordExclude.forEach(k=>els.keywordExcludeChips.appendChild(makeKeywordChip(k,'exclude')))
}
updateSummary()
}
function clearKeywords(){
state.keywordInclude.clear();
state.keywordExclude.clear();
renderKeywordSelection();
renderKeywordCategories();
if(els.keywordQuery?.value.trim())findKeywords(false);
else updateKeywordMessage();
applyFilters()
}
function getRecentSearches(){const saved=readJsonStorage(RECENT_SEARCH_STORAGE_KEY,[]);return Array.isArray(saved)?saved.map(v=>String(v).trim()).filter(Boolean).slice(0,RECENT_SEARCH_LIMIT):[]}
function saveRecentSearch(term){const value=String(term||'').trim();if(!value)return;const next=[value,...getRecentSearches().filter(v=>normalizeText(v)!==normalizeText(value))].slice(0,RECENT_SEARCH_LIMIT);localStorage.setItem(RECENT_SEARCH_STORAGE_KEY,JSON.stringify(next));renderRecentSearches()}
function hideRecentSearches(){if(!els.recentSearches)return;els.recentSearches.hidden=true;els.q.setAttribute('aria-expanded','false')}
function showRecentSearches(){if(!els.recentSearches)return;renderRecentSearches();if(getRecentSearches().length){els.recentSearches.hidden=false;els.q.setAttribute('aria-expanded','true')}}
function removeRecentSearch(term){const next=getRecentSearches().filter(v=>normalizeText(v)!==normalizeText(term));if(next.length)localStorage.setItem(RECENT_SEARCH_STORAGE_KEY,JSON.stringify(next));else localStorage.removeItem(RECENT_SEARCH_STORAGE_KEY);renderRecentSearches()}
function renderRecentSearches(){if(!els.recentSearchList||!els.recentSearches)return;const items=getRecentSearches();els.recentSearchList.innerHTML='';items.forEach(term=>{const item=document.createElement('span');item.className='recent-search-item';const btn=document.createElement('button');btn.type='button';btn.className='recent-search-chip';btn.textContent=term;btn.addEventListener('click',()=>{els.q.value=term;hideRecentSearches();applyFilters()});const remove=document.createElement('button');remove.type='button';remove.className='recent-search-remove';remove.textContent='×';remove.setAttribute('aria-label',`${term} 검색 기록 삭제`);remove.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();removeRecentSearch(term)});item.append(btn,remove);els.recentSearchList.appendChild(item)});if(!items.length)hideRecentSearches()}
function runMainSearch(){saveRecentSearch(els.q.value);hideRecentSearches();applyFilters()}
function normalizeText(value){return String(value??'').trim().toLowerCase().replace(/\s+/g,'')}
function toNumber(value){if(typeof value==='number')return value;const text=String(value??'').replace(/[^\d.-]/g,'');const num=Number(text);return Number.isFinite(num)?num:0}
function historyCount(value){return String(value||'').split(',').map(v=>v.trim()).filter(Boolean).length}
function normalizeItem(item,index){
const title=String(item.title??'').trim();
const author=String(item.author??'').trim();
const history=String(item.history??item.pastDiscount??item['과거할인율']??'').trim();
const historyItems=parseHistory(history);
const latest=latestHistoryEntry(history);
return{
workId:String(item.workId??item.id??'').trim(),
title,author,
_titleNorm:normalizeText(title),
_authorNorm:normalizeText(author),
_joinedNorm:normalizeText(title+author),
link:String(item.link??'').trim(),
discount:toNumber(item.discount),
price:toNumber(item.price),
type:String(item.type??'').trim(),
misc:String(item.misc??item['기타']??item.status??'').trim(),
isDiscontinued:/판중/.test(String(item.misc??item['기타']??item.status??'')),
cover:String(item.cover??item.coverUrl??item['표지주소']??item['표지']??'').trim(),
history,
keywords:(Array.isArray(item.keywords)?item.keywords:String(item.keywords??item.keyword??'').split(/[,|]/)).map(v=>String(v).trim()).filter(Boolean),
_historyItems:historyItems,
_historyCache:null,
appearCount:historyItems.length,
latestEntry:latest,
originalIndex:index
}}
function isPurchasedForFilter(item){try{const raw=JSON.parse(localStorage.getItem('dm_purchase_records_v1')||'null');if(!raw||!raw.works||typeof raw.works!=='object')return false;const id=String(item?.workId??item?.id??'').trim(),link=String(item?.link||'').trim(),nt=normalizeText(item?.title),na=normalizeText(item?.author),ta='ta:'+nt+'|'+na,titleAuthor=String(item?.title||'')+'__'+String(item?.author||'');return Object.entries(raw.works).some(([storeKey,w])=>{if(!w||!Array.isArray(w.records)||!w.records.length)return false;const sk=String(storeKey||'').trim(),wid=String(w.workId??w.id??'').trim(),wlink=String(w.link||'').trim();if(id&&(sk===id||wid===id))return true;if(link&&(sk===link||wlink===link))return true;if(sk===ta||sk===titleAuthor)return true;return normalizeText(w.title)===nt&&normalizeText(w.author)===na})}catch{return false}}
function hasSearchCriteria(){return Boolean(els.q.value.trim()||els.titleOnly.value.trim()||els.authorOnly.value.trim()||els.exclude.value.trim()||els.discountRate.value||state.selectedHistoryDates.size||state.keywordInclude.size||state.keywordExclude.size)}
function getRateKey(value){const m=String(value||'').match(/(\d+)\s*%/);return m?m[1]:''}
function historyMatchesSelected(item){const selectedDates=state.selectedHistoryDates,selectedRate=els.discountRate.value;if(!selectedDates.size&&!selectedRate)return true;return item._historyItems.some(entry=>{if(selectedDates.size&&!selectedDates.has(entry.date))return false;if(selectedRate&&getRateKey(entry.rate)!==selectedRate)return false;return true})}
function updatePointbackVisibility(){const btn=document.getElementById('pointbackTopBtn'),backdrop=document.getElementById('pointbackModalBackdrop');const selected=state.selectedHistoryDates.size===1?String([...state.selectedHistoryDates][0]||'').trim():'';const show=(selected==='202607백년'||selected==='202609추석뿌리')&&!state.showFavorites&&!state.showDateList;if(btn)btn.hidden=!show;document.body.classList.toggle('pointback-active',show);if(!show&&backdrop&&backdrop.classList.contains('open')){backdrop.classList.remove('open');backdrop.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open')}}
function applyFilters(){updatePointbackVisibility();const hasCriteria=hasSearchCriteria();if(!hasCriteria){state.filtered=[];state.visibleCount=PAGE_SIZE;updateSummary();render(true);return}const q=normalizeText(els.q.value),titleOnly=normalizeText(els.titleOnly.value),authorOnly=normalizeText(els.authorOnly.value),exclude=normalizeText(els.exclude.value),customMax=els.customMaxPrice?toNumber(els.customMaxPrice.value):0;let result=state.items.filter(item=>{const title=item._titleNorm,author=item._authorNorm,joined=item._joinedNorm;if(!state.includeDiscontinued&&item.isDiscontinued)return false;if(state.excludePurchased&&isPurchasedForFilter(item))return false;if(!historyMatchesSelected(item))return false;if(q&&!(title.includes(q)||author.includes(q)))return false;if(titleOnly&&!title.includes(titleOnly))return false;if(authorOnly&&!author.includes(authorOnly))return false;if(exclude&&joined.includes(exclude))return false;if(customMax>0&&item.price>customMax)return false;const itemKeywords=getItemKeywordNorms(item);for(const keyword of state.keywordInclude){if(!itemKeywords.includes(normalizeText(keyword)))return false}for(const keyword of state.keywordExclude){if(itemKeywords.includes(normalizeText(keyword)))return false}return true});state.filtered=applySort(result);state.visibleCount=PAGE_SIZE;updateSummary();render(false)}
function applySort(list){const sort=els.sortBy.value,arr=[...list];const byText=f=>(a,b)=>String(a[f]||'').localeCompare(String(b[f]||''),'ko-KR',{numeric:true});if(sort==='titleAsc')arr.sort(byText('title'));if(sort==='authorAsc')arr.sort(byText('author'));if(sort==='titleDesc')arr.sort((a,b)=>byText('title')(b,a));if(sort==='authorDesc')arr.sort((a,b)=>byText('author')(b,a));if(sort==='default')arr.sort((a,b)=>a.originalIndex-b.originalIndex);return arr}
function updateSummary(){const p=[];if(state.selectedHistoryDates.size){const dates=[...state.selectedHistoryDates];p.push(dates.length<=3?`출현연월: ${dates.join(', ')}`:`출현연월: ${dates.length}개 선택`)};if(els.q.value.trim())p.push(`통합: ${els.q.value.trim()}`);if(els.sortBy.value!=='default')p.push(`정렬: ${els.sortBy.options[els.sortBy.selectedIndex].textContent}`);if(els.discountRate.value)p.push(`할인율: ${els.discountRate.value}%`);if(els.titleOnly.value.trim())p.push(`제목: ${els.titleOnly.value.trim()}`);if(els.authorOnly.value.trim())p.push(`작가: ${els.authorOnly.value.trim()}`);if(els.exclude.value.trim())p.push(`제외: ${els.exclude.value.trim()}`);if(state.keywordInclude.size)p.push(`키워드 포함: ${[...state.keywordInclude].join(', ')}`);if(state.keywordExclude.size)p.push(`키워드 제외: ${[...state.keywordExclude].join(', ')}`);if(state.excludePurchased)p.push('구매작품 제외');els.activeSummary.textContent=p.length?p.join(' · '):'필터 없음'}
function parseHistory(value){return String(value||'').split(',').map(v=>v.trim()).filter(Boolean).map(v=>{const m=v.match(/^(\d{6}\S*)\s+(.*)$/);return m?{date:m[1],rate:m[2].trim()||'-'}:{date:'기록',rate:v}})}
function latestHistoryEntry(value){const entries=parseHistory(value).filter(entry=>entry.date&&entry.date!=='기록');if(!entries.length)return null;return [...entries].sort((a,b)=>String(b.date).slice(0,6).localeCompare(String(a.date).slice(0,6),'ko-KR',{numeric:true}))[0]}
function getMaxHistoryRate(entries){const list=Array.isArray(entries)?entries:parseHistory(entries);let max=null;list.forEach(entry=>{const key=getRateKey(entry?.rate);if(!key)return;const value=Number(key);if(Number.isFinite(value)&&(max===null||value>max))max=value});return max===null?'기록 없음':`${max}%`}
function getLatestMaxHistoryKey(entries){const list=Array.isArray(entries)?entries:parseHistory(entries);let max=null;list.forEach(entry=>{const key=getRateKey(entry?.rate);if(!key)return;const value=Number(key);if(Number.isFinite(value)&&(max===null||value>max))max=value});if(max===null)return'';const matched=list.filter(entry=>Number(getRateKey(entry?.rate))===max&&/^\d{6}/.test(String(entry?.date||'')));if(!matched.length)return'';matched.sort((a,b)=>String(b.date).slice(0,6).localeCompare(String(a.date).slice(0,6),'ko-KR',{numeric:true}));const latest=matched[0];return `${latest.date}__${latest.rate}`}
function populateDiscountOptions(){const rates=[...new Set(state.items.flatMap(item=>parseHistory(item.history).map(entry=>getRateKey(entry.rate)).filter(Boolean)))].sort((a,b)=>Number(a)-Number(b));const opts='<option value="">전체 할인율</option>'+rates.map(rate=>`<option value="${rate}">${rate}%</option>`).join('');els.discountRate.innerHTML=opts;if(els.favDiscountRate)els.favDiscountRate.innerHTML=opts}
function openHistoryModal(item){const current=(item&&item.workId!=null?state.items.find(v=>String(v.workId)===String(item.workId)):null)||item;item=current;const backdrop=document.getElementById('historyModalBackdrop'),title=document.getElementById('historyModalTitle'),meta=document.getElementById('historyModalMeta'),body=document.getElementById('historyModalBody');title.textContent=item.title||'과거 할인율';body.innerHTML='';const entries=item._historyCache||(item._historyCache=item._historyItems);const authorText=item.author||'작가 정보 없음';const maxRateText=getMaxHistoryRate(entries);const latestMaxKey=getLatestMaxHistoryKey(entries);meta.replaceChildren();const authorSpan=document.createElement('span');authorSpan.textContent=authorText;const sepSpan=document.createElement('span');sepSpan.className='history-meta-sep';sepSpan.textContent='·';const maxSpan=document.createElement('span');maxSpan.className='history-max-badge';maxSpan.textContent=`역대 최대 할인율 ${maxRateText}`;meta.append(authorSpan,sepSpan,maxSpan);if(!entries.length){const empty=document.createElement('div');empty.className='history-empty';empty.textContent='정리된 과거 할인율이 없습니다.';body.appendChild(empty)}else{entries.forEach(entry=>{const row=document.createElement('div');row.className='history-row'+((`${entry.date}__${entry.rate}`===latestMaxKey)?' is-max-highlight':'');const date=document.createElement('span');date.className='history-date';date.textContent=entry.date;const rate=document.createElement('span');rate.className='history-rate';rate.textContent=entry.rate;row.append(date,rate);body.appendChild(row)})}backdrop.classList.add('open');backdrop.setAttribute('aria-hidden','false');document.body.classList.add('modal-open')}
function closeHistoryModal(){const backdrop=document.getElementById('historyModalBackdrop');backdrop.classList.remove('open');backdrop.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open')}
function getHistoryDateCounts(){const counts=new Map();state.items.forEach(item=>{new Set(item._historyItems.map(entry=>entry.date).filter(date=>date&&date!=='기록')).forEach(date=>counts.set(date,(counts.get(date)||0)+1))});return [...counts.entries()].sort((a,b)=>b[0].localeCompare(a[0],'ko-KR',{numeric:true}))}
function getHistoryYears(){
  return [...new Set(getHistoryDateCounts().map(([date])=>String(date).slice(0,4)).filter(Boolean))].sort((a,b)=>b.localeCompare(a,'ko-KR',{numeric:true}));
}
function populateDateYearFilter(){
  const sel=document.getElementById('dateYearFilter');
  if(!sel)return;
  const current=sel.value;
  const years=getHistoryYears();
  sel.innerHTML='<option value="">전체 연도</option>'+years.map(y=>`<option value="${y}">${y}년</option>`).join('');
  if(years.includes(current))sel.value=current;
}
function renderDateListInline(){
  const wrap=document.getElementById('dateListInline');
  const yearSel=document.getElementById('dateYearFilter');
  const clearBtn=document.getElementById('dateListClearBtn');
  const searchBtn=document.getElementById('dateListSearchBtn');
  if(!wrap)return;
  if(clearBtn)clearBtn.disabled=!state.selectedHistoryDates.size;
  if(searchBtn){searchBtn.disabled=!state.selectedHistoryDates.size;searchBtn.textContent='검색🔍';}
  const year=yearSel?yearSel.value:'';
  const dates=getHistoryDateCounts().filter(([date])=>!year||String(date).startsWith(year));
  wrap.innerHTML='';
  if(!dates.length){
    const empty=document.createElement('div');
    empty.className='date-list-empty';
    empty.textContent='정리된 출현연월이 없습니다.';
    wrap.appendChild(empty);
    return;
  }
  dates.forEach(([date,count])=>{
    const isSelected=state.selectedHistoryDates.has(date);
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='date-list-item'+(isSelected?' active':'');
    btn.setAttribute('aria-pressed',String(isSelected));
    btn.innerHTML=`<span>${isSelected?'✓ ':''}${date}</span>`;
    btn.addEventListener('click',()=>{
      if(state.selectedHistoryDates.has(date))state.selectedHistoryDates.delete(date);
      else state.selectedHistoryDates.add(date);
      state.showDateList=true;
      state.showFavorites=false;
      document.body.classList.add('date-list-mode');
      document.body.classList.remove('favorite-mode');
      renderDateListInline();
      updateBottomTabs();
    });
    wrap.appendChild(btn);
  });
}
function setDateListMode(on){
  state.showDateList=on;
  if(on)state.showFavorites=false;
  document.body.classList.toggle('date-list-mode',on);
  document.body.classList.toggle('favorite-mode',state.showFavorites);
  populateDateYearFilter();
  renderDateListInline();
  updateBottomTabs();
  render(false);
}

function openDateIndex(){const backdrop=document.getElementById('dateIndexBackdrop'),body=document.getElementById('dateIndexBody');body.innerHTML='';const clearBtn=document.createElement('button');clearBtn.type='button';clearBtn.className='clear-date-btn';clearBtn.textContent=state.selectedHistoryDates.size?'선택 전체 해제':'전체 목차';clearBtn.addEventListener('click',()=>{state.selectedHistoryDates.clear();applyFilters();openDateIndex()});body.appendChild(clearBtn);getHistoryDateCounts().forEach(([date,count])=>{const isSelected=state.selectedHistoryDates.has(date);const btn=document.createElement('button');btn.type='button';btn.className='date-chip'+(isSelected?' active':'');btn.setAttribute('aria-pressed',String(isSelected));btn.textContent=(isSelected?'✓ ':'')+date;btn.addEventListener('click',()=>{if(state.selectedHistoryDates.has(date))state.selectedHistoryDates.delete(date);else state.selectedHistoryDates.add(date);applyFilters();openDateIndex()});body.appendChild(btn)});backdrop.classList.add('open');backdrop.setAttribute('aria-hidden','false');document.body.classList.add('modal-open')}
function closeDateIndex(){const backdrop=document.getElementById('dateIndexBackdrop');backdrop.classList.remove('open');backdrop.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open')}
function itemKey(item){return item.workId||item.link||`${item.title}__${item.author}`}
function favoriteListIds(){return Object.keys(state.favoriteLists).sort((a,b)=>{const na=Number(String(a).replace(/\D/g,''))||0,nb=Number(String(b).replace(/\D/g,''))||0;return na-nb})}
function favoriteDisplayName(id){const n=String(state.favoriteNames[id]||'').trim();const num=String(id).replace(/\D/g,'')||'';return n?`찜${num} ${n}`:`찜${num}`}
function refreshFavoriteStateForAlerts(){const fresh=loadFavoriteData();state.favoriteLists=fresh.lists;state.favoriteNames=fresh.names;state.activeFavoriteListId=fresh.activeId;state.favorites=new Set(state.favoriteLists[state.activeFavoriteListId]||[])}
function syncActiveEventAlerts(reloadFavorites=false){if(reloadFavorites)refreshFavoriteStateForAlerts();state.eventAlerts=state.activeEvent?collectEventFavoriteAlerts(state.activeEvent):[]}
function saveFavorites(){state.favoriteLists[state.activeFavoriteListId]=[...state.favorites];localStorage.setItem(FAVORITE_LISTS_STORAGE_KEY,JSON.stringify({lists:state.favoriteLists,names:state.favoriteNames}));localStorage.setItem(ACTIVE_FAVORITE_LIST_KEY,state.activeFavoriteListId);localStorage.setItem(FAVORITE_LEGACY_KEY,JSON.stringify([...state.favorites]));syncActiveEventAlerts();updateEventAlertButton()}
function refreshFavoriteListUI(){if(!els.favListSelect)return;const ids=favoriteListIds();els.favListSelect.innerHTML=ids.map(id=>`<option value="${id}">${favoriteDisplayName(id)}</option>`).join('');els.favListSelect.value=state.activeFavoriteListId;if(els.favListNameInput)els.favListNameInput.value=state.favoriteNames[state.activeFavoriteListId]||'';if(els.favListCount)els.favListCount.textContent=`${state.favorites.size.toLocaleString('ko-KR')}개`}
function switchFavoriteList(id){if(!state.favoriteLists[id])return;state.favoriteLists[state.activeFavoriteListId]=[...state.favorites];state.eventCartSelection.clear();state.activeFavoriteListId=id;state.favorites=new Set(state.favoriteLists[id]||[]);saveFavorites();refreshFavoriteListUI();state.visibleCount=PAGE_SIZE;render(false);updateBottomTabs()}
function addFavoriteList(){const nums=favoriteListIds().map(id=>Number(String(id).replace(/\D/g,''))||0);const next=(nums.length?Math.max(...nums):0)+1;const id=`fav${next}`;state.favoriteLists[id]=[];state.favoriteNames[id]='';switchFavoriteList(id);if(els.favListMenu)els.favListMenu.hidden=true}
function deleteFavoriteList(){const ids=favoriteListIds();if(ids.length<=1){showFavoriteToast('찜목록은 1개 이상 필요합니다');return}const current=state.activeFavoriteListId;if(!confirm(`${favoriteDisplayName(current)}을 삭제할까요?`))return;state.eventCartSelection.clear();delete state.favoriteLists[current];delete state.favoriteNames[current];const nextId=favoriteListIds()[0];state.activeFavoriteListId=nextId;state.favorites=new Set(state.favoriteLists[nextId]||[]);saveFavorites();refreshFavoriteListUI();state.visibleCount=PAGE_SIZE;render(false);if(els.favListMenu)els.favListMenu.hidden=true}
function renameFavoriteList(){const name=String(els.favListNameInput?.value||'').trim();state.favoriteNames[state.activeFavoriteListId]=name;saveFavorites();refreshFavoriteListUI();if(els.favListMenu)els.favListMenu.hidden=true}
function isFavorite(item){return state.favorites.has(itemKey(item))}
function showFavoriteToast(msg){if(!els.favoriteToast)return;els.favoriteToast.textContent=msg;els.favoriteToast.classList.add('show');clearTimeout(showFavoriteToast._timer);showFavoriteToast._timer=setTimeout(()=>els.favoriteToast.classList.remove('show'),1200)}
function toggleFavorite(item){const key=itemKey(item);if(state.favorites.has(key)){state.favorites.delete(key);showFavoriteToast('찜에서 뺐습니다')}else{state.favorites.add(key);showFavoriteToast('찜했습니다')}saveFavorites();refreshFavoriteListUI();render(false);updateBottomTabs()}
window.addEventListener('dm-purchase-saved',()=>{try{const fresh=loadFavoriteData();state.favoriteLists=fresh.lists;state.favoriteNames=fresh.names;state.activeFavoriteListId=fresh.activeId;state.favorites=new Set(state.favoriteLists[state.activeFavoriteListId]||[]);state.eventCartSelection=new Set([...state.eventCartSelection].filter(k=>state.favorites.has(String(k))));refreshFavoriteListUI();render(false);updateBottomTabs();syncActiveEventAlerts();updateEventAlertButton()}catch(e){}});
function moveFavoriteItemToList(item,targetId){const key=itemKey(item);if(!state.favoriteLists[targetId]||targetId===state.activeFavoriteListId)return;state.favorites.delete(key);state.favoriteLists[state.activeFavoriteListId]=[...state.favorites];const targetSet=new Set(state.favoriteLists[targetId]||[]);targetSet.add(key);state.favoriteLists[targetId]=[...targetSet];saveFavorites();refreshFavoriteListUI();state.visibleCount=PAGE_SIZE;render(false);updateBottomTabs();showFavoriteToast(`${favoriteDisplayName(targetId)}으로 이동했습니다`)}
function closeFavoriteMoveMenu(){document.querySelectorAll('.favorite-move-popover').forEach(el=>el.remove());document.removeEventListener('click',closeFavoriteMoveMenu._outside,true);closeFavoriteMoveMenu._anchor=null}
function openFavoriteMoveMenu(item,anchor){const opened=document.querySelector('.favorite-move-popover');if(opened&&closeFavoriteMoveMenu._anchor===anchor){closeFavoriteMoveMenu();return}closeFavoriteMoveMenu();const menu=document.createElement('div');menu.className='favorite-move-popover';menu.setAttribute('role','menu');const targets=favoriteListIds().filter(id=>id!==state.activeFavoriteListId);targets.forEach(id=>{const btn=document.createElement('button');btn.type='button';btn.textContent=favoriteDisplayName(id);btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();closeFavoriteMoveMenu();moveFavoriteItemToList(item,id)});menu.appendChild(btn)});const purchaseBtn=document.createElement('button');purchaseBtn.type='button';purchaseBtn.textContent='구매목록 추가';purchaseBtn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();closeFavoriteMoveMenu();if(typeof window.dmOpenPurchaseRecord==='function')window.dmOpenPurchaseRecord(item)});menu.appendChild(purchaseBtn);const host=anchor?.closest?.('.card')||document.body;host.appendChild(menu);if(host!==document.body&&anchor?.getBoundingClientRect){const ar=anchor.getBoundingClientRect(),hr=host.getBoundingClientRect();const menuWidth=Math.max(136,menu.getBoundingClientRect().width||136);let left=ar.left-hr.left;left=Math.max(0,Math.min(left,Math.max(0,hr.width-menuWidth)));menu.style.left=left+'px';menu.style.top=(ar.bottom-hr.top+6)+'px'}else{menu.style.position='fixed';const ar=anchor?.getBoundingClientRect?.()||{left:12,bottom:12};menu.style.left=Math.max(12,Math.min(ar.left,window.innerWidth-160))+'px';menu.style.top=(ar.bottom+6)+'px'}closeFavoriteMoveMenu._anchor=anchor;closeFavoriteMoveMenu._outside=function(e){if(!menu.contains(e.target)&&e.target!==anchor)closeFavoriteMoveMenu()};setTimeout(()=>document.addEventListener('click',closeFavoriteMoveMenu._outside,true),0)}
function favoriteItemMatchesQuery(item,query){if(!query)return true;return item._titleNorm.includes(query)||item._authorNorm.includes(query)}
function favoriteMatchingOtherFolders(query){if(!query)return[];const byId=new Map(state.items.map(item=>[String(itemKey(item)),item]));return favoriteListIds().filter(id=>id!==state.activeFavoriteListId).filter(id=>(state.favoriteLists[id]||[]).some(key=>{const item=byId.get(String(key));return item&&favoriteItemMatchesQuery(item,query)}))}
function renderFavoriteSearchMessage(total){if(!els.favoriteSearchMessage)return;els.favoriteSearchMessage.innerHTML='';els.favoriteSearchMessage.classList.remove('show');const raw=String(state.favoriteQuery||'').trim();if(!state.showFavorites||!raw||total>0)return;const query=normalizeText(raw);const otherIds=favoriteMatchingOtherFolders(query);els.favoriteSearchMessage.classList.add('show');if(!otherIds.length){els.favoriteSearchMessage.textContent='모든 찜 카테고리에서 검색 결과가 없습니다.';return}const lead=document.createElement('span');lead.textContent='현재 찜 카테고리에는 없습니다. 다른 카테고리: ';els.favoriteSearchMessage.appendChild(lead);otherIds.forEach(id=>{const btn=document.createElement('button');btn.type='button';btn.className='favorite-search-category-btn';btn.textContent=favoriteDisplayName(id);btn.addEventListener('click',()=>switchFavoriteList(id));els.favoriteSearchMessage.appendChild(btn)})}
function runFavoriteSearch(){state.favoriteQuery=String(els.favoriteSearchInput?.value||'').trim();state.visibleCount=PAGE_SIZE;render(false)}
function filterFavoriteItems(list){const query=normalizeText(state.favoriteQuery);let arr=[...list].filter(item=>favoriteItemMatchesQuery(item,query));return applySort(arr)}

function setViewMode(mode){state.viewMode=mode;localStorage.setItem('dm_view_mode',mode);document.body.classList.toggle('view-card',mode==='card');document.body.classList.toggle('view-list',mode!=='card');updateViewButtons();render(false)}
function updateViewButtons(){const card=document.getElementById('viewCardBtn'),list=document.getElementById('viewListBtn');if(card)card.classList.toggle('active',state.viewMode==='card');if(list)list.classList.toggle('active',state.viewMode!=='card')}
function setFavoriteMode(on){state.showFavorites=on;if(on)state.showDateList=false;document.body.classList.toggle("favorite-mode",on);document.body.classList.toggle("date-list-mode",state.showDateList);state.visibleCount=PAGE_SIZE;refreshFavoriteListUI();updateBottomTabs();render(false)}
function updateBottomTabs(){const purchaseActive=document.body.classList.contains('dm-purchase-tab-mode')||state.activeMasterTab==='purchase';if(!purchaseActive)state.activeMasterTab=state.showFavorites?'favorites':state.showDateList?'list':'search';saveMasterActiveTab(state.activeMasterTab);updatePointbackVisibility();const s=document.getElementById('tabSearchBtn'),l=document.getElementById('tabListBtn'),f=document.getElementById('tabFavBtn'),p=document.getElementById('tabPurchaseBtn'),top=document.getElementById('tasteTopBtn');if(s)s.classList.toggle('active',state.activeMasterTab==='search');if(f)f.classList.toggle('active',state.activeMasterTab==='favorites');if(l)l.classList.toggle('active',state.activeMasterTab==='list');if(p)p.classList.toggle('active',state.activeMasterTab==='purchase');if(top){top.classList.toggle('is-on',state.activeMasterTab==='favorites');top.setAttribute('aria-pressed',String(state.activeMasterTab==='favorites'));}}
function normalizeEventRate(value){const text=String(value??'').trim();if(!text)return'';return /%$/.test(text)?text:`${text}%`}
function currentEventAlertForItem(item){if(!state.showFavorites||!state.activeEvent||!Array.isArray(state.eventAlerts))return null;return state.eventAlerts.find(alert=>String(alert.item.workId)===String(item.workId))||null}
function render(isPrompt=false){const source=state.showFavorites?filterFavoriteItems(state.items.filter(item=>isFavorite(item)&&!isPurchasedForFilter(item)&&(state.includeDiscontinued||!item.isDiscontinued))):state.filtered;const total=source.length,visible=source.slice(0,state.visibleCount);els.resultCount.textContent=total.toLocaleString('ko-KR');els.list.innerHTML='';if(state.showFavorites){els.empty.textContent=total?'':(state.favoriteQuery?'해당 찜 카테고리에 검색 결과가 없습니다.':'찜한 작품이 없습니다.');renderFavoriteSearchMessage(total)}else{els.empty.textContent=isPrompt?'검색값을 입력하세요':'조건에 맞는 작품이 없습니다.'}els.empty.classList.toggle('prompt',isPrompt&&!state.showFavorites);els.empty.classList.toggle('hidden',state.showFavorites?total!==0:(isPrompt?false:total!==0));els.loadMoreWrap.classList.toggle('hidden',isPrompt||state.visibleCount>=total);if(isPrompt&&!state.showFavorites)return;const frag=document.createDocumentFragment();visible.forEach(item=>{const card=document.createElement('article');const eventSelected=state.eventCartSelection.has(String(item.workId));card.className='card'+(state.viewMode==='card'?' with-cover':'')+(item.isDiscontinued?' is-discontinued':'')+(eventSelected?' event-cart-selected':'');card.dataset.workId=item.workId;if(state.viewMode==='card'){const cover=item.cover?document.createElement(item.link?'a':'div'):document.createElement('div');cover.className='book-cover'+(item.cover?'':' no-cover');if(item.cover&&item.link){cover.href=item.link;cover.target='_blank';cover.rel='noopener noreferrer'}if(item.cover){const img=document.createElement('img');img.src=item.cover;img.alt='';img.loading='lazy';img.decoding='async';cover.appendChild(img)}else{const noCover=document.createElement('span');noCover.textContent='이미지 없음';cover.appendChild(noCover)}card.appendChild(cover)}const fav=document.createElement('button');fav.className='favorite-toggle'+(isFavorite(item)?' is-on':'');fav.type='button';fav.textContent=isFavorite(item)?'♥':'♡';fav.setAttribute('aria-label',isFavorite(item)?'찜 해제':'찜하기');fav.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggleFavorite(item)});const info=document.createElement('div');info.className='card-info';const title=document.createElement(item.link?'a':'span');title.className='book-title'+(item.link?'':' no-link');title.textContent=item.title||'(제목 없음)';if(item.link){title.href=item.link;title.target='_blank';title.rel='noopener noreferrer'}const meta=document.createElement('p');meta.className='book-meta';meta.textContent=item.author||'작가 정보 없음';info.append(title,meta);const middle=document.createElement('div');middle.className='card-middle';const hCount=historyCount(item.history);const favoriteCurrentAlert=state.showFavorites?currentEventAlertForItem(item):null;if(hCount||favoriteCurrentAlert){const historySummary=document.createElement('div');historySummary.className='book-history-inline';if(state.showFavorites){const currentAlert=favoriteCurrentAlert;if(currentAlert){const currentRate=normalizeEventRate(currentAlert.rate)||'';const currentLine=document.createElement('span');currentLine.className='history-pill current-event';const currentText=document.createElement('span');currentText.className='current-event-text';currentText.textContent=`현재 이벤트 ${currentRate||'할인'}`;currentLine.appendChild(currentText);currentLine.title=`${state.activeEvent?.eventName||'현재 이벤트'} ${currentRate}`.trim();historySummary.appendChild(currentLine)}else{const maxKey=getLatestMaxHistoryKey(item._historyItems||item.history);if(maxKey){const [maxDateRaw,maxRate]=maxKey.split('__');const maxDate=String(maxDateRaw||'').slice(0,6);if(maxDate&&maxRate){const maxLine=document.createElement('span');maxLine.className='history-pill favorite-max-discount';maxLine.textContent=`역대 최대 ${maxDate} ${maxRate}`;historySummary.appendChild(maxLine)}}}}else{const recent=latestHistoryEntry(item.history);const currentAlert=currentEventAlertForItem(item);const countLine=document.createElement('span');countLine.className='history-pill'+(currentAlert?' current-event':'');if(currentAlert){const currentText=document.createElement('span');currentText.className='current-event-text';currentText.textContent=`현재 이벤트 ${normalizeEventRate(currentAlert.rate)||'할인'}`;countLine.appendChild(currentText);countLine.title=`${state.activeEvent.eventName} ${normalizeEventRate(currentAlert.rate)||''}`.trim()}else{countLine.textContent=`출현 ${hCount}회`}historySummary.appendChild(countLine);if(recent){const recentLine=document.createElement('span');recentLine.className='history-pill recent';recentLine.textContent=`최근 ${recent.date} ${recent.rate}`;historySummary.appendChild(recentLine)}}middle.appendChild(historySummary)}const actions=document.createElement('div');actions.className='card-actions';const historyBtn=document.createElement('button');historyBtn.className='history-btn'+(item.history?'':' disabled');historyBtn.type='button';historyBtn.textContent='과거';historyBtn.title=item.history?'과거 할인율 보기':'정리된 과거 할인율 없음';if(item.history)historyBtn.addEventListener('click',()=>openHistoryModal(item));const favAction=document.createElement('button');favAction.type='button';if(item.isDiscontinued){favAction.className='favorite-action-btn discontinued-action';favAction.textContent='판중';favAction.title='판중 작품';favAction.disabled=true}else{favAction.className='favorite-action-btn'+(isFavorite(item)?' is-on':'');favAction.textContent=isFavorite(item)?(state.showFavorites?'찜':'찜됨'):'찜';favAction.title=isFavorite(item)?'다른 찜목록으로 이동하거나 찜 해제':'현재 찜목록에 추가';favAction.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();toggleFavorite(item)});favAction.addEventListener('contextmenu',e=>{e.preventDefault();if(isFavorite(item))openFavoriteMoveMenu(item,favAction)})};actions.append(historyBtn,favAction);let eventSelectBtn=null;if(hasActiveEvent()&&state.showFavorites&&isFavorite(item)){eventSelectBtn=document.createElement('button');eventSelectBtn.className='event-cart-select-btn'+(eventSelected?' is-selected':'');eventSelectBtn.type='button';eventSelectBtn.textContent=eventSelected?'☑':'☐';eventSelectBtn.setAttribute('aria-label',eventSelected?'이벤트 장바구니 선택 해제':'이벤트 장바구니로 보낼 작품 선택');eventSelectBtn.title=eventSelected?'선택 해제':'이벤트 장바구니로 보낼 작품 선택';eventSelectBtn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const key=String(item.workId);if(state.eventCartSelection.has(key))state.eventCartSelection.delete(key);else state.eventCartSelection.add(key);render(false)})}let moveCornerBtn=null;if(state.showFavorites&&isFavorite(item)){moveCornerBtn=document.createElement('button');moveCornerBtn.className='favorite-card-move-btn';moveCornerBtn.type='button';moveCornerBtn.textContent='↪';moveCornerBtn.setAttribute('aria-label','찜 카테고리 이동 또는 구매목록 추가');moveCornerBtn.title='찜 카테고리 이동 또는 구매목록 추가';moveCornerBtn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openFavoriteMoveMenu(item,moveCornerBtn)})}if(eventSelectBtn)actions.appendChild(eventSelectBtn);if(item.isDiscontinued){card.append(info,middle,actions)}else{card.append(fav,info,middle,actions)}if(moveCornerBtn)card.appendChild(moveCornerBtn);frag.appendChild(card)});els.list.appendChild(frag)}

function localDateYmd(){const now=new Date();const y=now.getFullYear();const m=String(now.getMonth()+1).padStart(2,'0');const d=String(now.getDate()).padStart(2,'0');return `${y}-${m}-${d}`}
function normalizeEventData(raw){if(Array.isArray(raw)){const works=raw;const startDate=String(works.find(v=>v&&v.startDate)?.startDate||'').slice(0,10);const endDate=String(works.find(v=>v&&v.endDate)?.endDate||'').slice(0,10);const eventName=String(works.find(v=>v&&v.eventName)?.eventName||'현재 이벤트').trim();const sig=works.map(v=>`${v.workId??v.id??''}|${v.title??''}|${v.author??''}|${v.discount??v.rate??v.discountRate??''}|${v.price??''}|${v.startDate??''}|${v.endDate??''}`).join('||');let hash=2166136261;for(let i=0;i<sig.length;i++){hash^=sig.charCodeAt(i);hash=Math.imul(hash,16777619)}return{eventId:`current-${(hash>>>0).toString(36)}`,eventName,startDate,endDate,works}}if(!raw||typeof raw!=='object')return null;const works=Array.isArray(raw.works)?raw.works:[];const startDate=String(raw.startDate||works.find(v=>v&&v.startDate)?.startDate||'').slice(0,10);const endDate=String(raw.endDate||works.find(v=>v&&v.endDate)?.endDate||'').slice(0,10);const sig=works.map(v=>`${v.workId??v.id??''}|${v.title??''}|${v.author??''}|${v.discount??v.rate??v.discountRate??''}|${v.price??''}|${v.startDate??''}|${v.endDate??''}`).join('||');let hash=2166136261;for(let i=0;i<sig.length;i++){hash^=sig.charCodeAt(i);hash=Math.imul(hash,16777619)}return{eventId:String(raw.eventId||'').trim()||`current-${(hash>>>0).toString(36)}`,eventName:String(raw.eventName||'현재 이벤트').trim(),startDate,endDate,works}}
function findFavoriteFolders(item){if(!item)return[];const keys=new Set([String(item.workId||''),String(item.link||''),`${item.title||''}__${item.author||''}`].filter(Boolean));return Object.keys(state.favoriteLists).filter(id=>(state.favoriteLists[id]||[]).some(savedKey=>keys.has(String(savedKey))))}
function favoriteFolderName(id){const ids=Object.keys(state.favoriteLists);return String(state.favoriteNames[id]||'').trim()||`찜목록 ${ids.indexOf(id)+1}`}
function collectEventFavoriteAlerts(eventData){if(!eventData||!Array.isArray(eventData.works))return[];const eventById=new Map(),eventByTitleAuthor=new Map();eventData.works.forEach(raw=>{const workId=String(raw?.workId??raw?.id??'').trim();if(workId&&!eventById.has(workId))eventById.set(workId,raw);const ta=`${normalizeText(raw?.title||'')}__${normalizeText(raw?.author||'')}`;if(ta!=='__'&&!eventByTitleAuthor.has(ta))eventByTitleAuthor.set(ta,raw)});const folderIds=favoriteListIds();const folderSets=new Map(folderIds.map(id=>[id,new Set((state.favoriteLists[id]||[]).map(String))]));const alerts=[];state.items.forEach(item=>{if(isPurchasedForFilter(item))return;if(item.isDiscontinued&&!state.includeDiscontinued)return;const key=String(itemKey(item));const folders=folderIds.filter(id=>folderSets.get(id)?.has(key));if(!folders.length)return;const workId=String(item.workId||'').trim();const raw=(workId&&eventById.get(workId))||eventByTitleAuthor.get(`${item._titleNorm}__${item._authorNorm}`);if(!raw)return;alerts.push({item,folders,rate:normalizeEventRate(raw.discount??raw.rate??raw.discountRate??'')})});return alerts}
function isValidYmd(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;const [y,m,d]=value.split('-').map(Number);const date=new Date(y,m-1,d);return date.getFullYear()===y&&date.getMonth()===m-1&&date.getDate()===d}
function isEventActive(eventData){if(!eventData||!Array.isArray(eventData.works)||!eventData.works.length)return false;if(!eventData.startDate&&!eventData.endDate)return true;if(!isValidYmd(eventData.startDate)||!isValidYmd(eventData.endDate)||eventData.startDate>eventData.endDate)return false;const today=localDateYmd();return today>=eventData.startDate&&today<=eventData.endDate}
function getReadEventAlertIds(){if(!state.activeEvent)return new Set();try{const saved=JSON.parse(localStorage.getItem(EVENT_ALERT_READ_KEY)||'{}');const ids=saved&&Array.isArray(saved[state.activeEvent.eventId])?saved[state.activeEvent.eventId]:[];return new Set(ids.map(String))}catch{return new Set()}}
function markEventAlertRead(workId){if(!state.activeEvent)return;let saved={};try{saved=JSON.parse(localStorage.getItem(EVENT_ALERT_READ_KEY)||'{}')||{}}catch{}const eventId=state.activeEvent.eventId;const ids=new Set(Array.isArray(saved[eventId])?saved[eventId].map(String):[]);ids.add(String(workId));saved[eventId]=[...ids];localStorage.setItem(EVENT_ALERT_READ_KEY,JSON.stringify(saved))}
function markAllEventAlertsRead(){if(!state.activeEvent||!state.eventAlerts.length)return;let saved={};try{saved=JSON.parse(localStorage.getItem(EVENT_ALERT_READ_KEY)||'{}')||{}}catch{}const eventId=state.activeEvent.eventId;saved[eventId]=state.eventAlerts.map(alert=>String(alert.item.workId));localStorage.setItem(EVENT_ALERT_READ_KEY,JSON.stringify(saved))}
function unreadEventAlertCount(){const readIds=getReadEventAlertIds();return state.eventAlerts.filter(alert=>!readIds.has(String(alert.item.workId))).length}
function normalizeMessageData(raw){const list=Array.isArray(raw)?raw:(raw&&Array.isArray(raw.messages)?raw.messages:(raw&&typeof raw==='object'?[raw]:[]));const seen=new Set();return list.map((entry,index)=>{if(!entry||typeof entry!=='object'||entry.enabled===false)return null;const id=String(entry.id||`message_${index+1}`).trim();if(!id||seen.has(id))return null;const title=String(entry.title||'').trim();const text=String(entry.text||'');const image=String(entry.image||'').trim();if(!title&&!text&&!image)return null;seen.add(id);return{id,icon:String(entry.icon||'💌').trim()||'💌',title,image,text,date:String(entry.date||'').slice(0,10),alt:String(entry.alt||entry.imageAlt||title||'메시지 이미지').trim()}}).filter(Boolean)}
function getReadMessageIds(){try{const ids=JSON.parse(localStorage.getItem(MESSAGE_READ_KEY)||'[]');return new Set(Array.isArray(ids)?ids.map(String):[])}catch{return new Set()}}
function markAllMessagesRead(){if(!state.messages.length)return;const ids=getReadMessageIds();state.messages.forEach(message=>ids.add(String(message.id)));localStorage.setItem(MESSAGE_READ_KEY,JSON.stringify([...ids]))}
function unreadMessageCount(){const readIds=getReadMessageIds();return state.messages.filter(message=>!readIds.has(String(message.id))).length}
function totalAlertCount(){return state.eventAlerts.length+state.messages.length}
function totalUnreadAlertCount(){return unreadEventAlertCount()+unreadMessageCount()}
function updateEventAlertButton(){if(!els.eventAlertBtn)return;const hasEvent=Array.isArray(state.eventAlerts)&&state.eventAlerts.length>0;const hasMessages=Array.isArray(state.messages)&&state.messages.length>0;const visible=hasEvent||hasMessages;const total=totalUnreadAlertCount();if(visible){els.eventAlertBtn.hidden=false;els.eventAlertBtn.removeAttribute('hidden');els.eventAlertBtn.style.display='inline-flex'}else{els.eventAlertBtn.hidden=true;els.eventAlertBtn.setAttribute('hidden','');els.eventAlertBtn.style.display='none'}if(els.eventAlertIcon)els.eventAlertIcon.textContent=hasEvent&&hasMessages?'📬':(hasMessages?'💌':'🔔');els.eventAlertBtn.classList.toggle('has-unread',total>0);if(els.eventAlertBadge)els.eventAlertBadge.textContent=total?String(total):'';els.eventAlertBtn.setAttribute('aria-label',total?`알림 ${total}개`:'알림 없음')}
function formatEventPeriod(ymd){const parts=String(ymd||'').split('-');return parts.length===3?`${Number(parts[1])}.${Number(parts[2])}`:''}
function formatMessageDate(ymd){if(!isValidYmd(ymd))return'';const parts=ymd.split('-');return `${Number(parts[0])}.${Number(parts[1])}.${Number(parts[2])}`}
function appendAlertSectionTitle(icon,label){const heading=document.createElement('div');heading.className='event-alert-section-title';const iconEl=document.createElement('span');iconEl.setAttribute('aria-hidden','true');iconEl.textContent=icon;const text=document.createElement('span');text.textContent=label;heading.append(iconEl,text);els.eventAlertList.appendChild(heading)}
function renderMessageAlerts(){if(!state.messages.length)return;const readIds=getReadMessageIds();state.messages.forEach(message=>{const isRead=readIds.has(String(message.id));const article=document.createElement('article');article.className='message-alert-item'+(isRead?' is-read':'');const head=document.createElement('div');head.className='message-alert-head';const icon=document.createElement('span');icon.className='message-alert-icon';icon.setAttribute('aria-hidden','true');icon.textContent=message.icon||'💌';const titleWrap=document.createElement('div');titleWrap.className='message-alert-title-wrap';if(message.title){const title=document.createElement('strong');title.className='message-alert-title';title.textContent=message.title;titleWrap.appendChild(title)}const info=document.createElement('span');info.className='message-alert-info';const dateText=formatMessageDate(message.date);info.textContent=[dateText,isRead?'확인함':'새 메시지'].filter(Boolean).join(' · ');titleWrap.appendChild(info);head.append(icon,titleWrap);article.appendChild(head);if(message.image){const img=document.createElement('img');img.className='message-alert-image';img.src=message.image;img.alt=message.alt||message.title;img.loading='eager';img.decoding='async';img.addEventListener('error',()=>{img.hidden=true});article.appendChild(img)}if(message.text){const body=document.createElement('p');body.className='message-alert-text';body.textContent=message.text;article.appendChild(body)}els.eventAlertList.appendChild(article)})}
function renderEventAlertItems(){if(!state.activeEvent||!state.eventAlerts.length)return;appendAlertSectionTitle('🔔','이벤트 알림');const readIds=getReadEventAlertIds();state.eventAlerts.forEach(alert=>{const isRead=readIds.has(String(alert.item.workId));const btn=document.createElement('button');btn.type='button';btn.className='event-alert-item'+(isRead?' is-read':'');const title=document.createElement('strong');title.textContent=alert.item.title;const meta=document.createElement('span');meta.textContent=`${alert.item.author} · ${alert.folders.map(favoriteFolderName).join(', ')}${isRead?' · 확인함':''}`;const rate=document.createElement('span');rate.className='event-alert-rate';rate.textContent=`현재 이벤트 ${alert.rate||'할인'}`;btn.append(title,meta,rate);btn.addEventListener('click',()=>{markEventAlertRead(alert.item.workId);updateEventAlertButton();openFavoriteAlertTarget(alert)});els.eventAlertList.appendChild(btn)})}
function renderEventAlerts(){els.eventAlertList.innerHTML='';const total=totalAlertCount();const unread=totalUnreadAlertCount();const hasEvent=state.eventAlerts.length>0;const hasMessages=state.messages.length>0;if(els.eventAlertPeriod){const showPeriod=hasEvent&&isValidYmd(state.activeEvent.startDate)&&isValidYmd(state.activeEvent.endDate);els.eventAlertPeriod.hidden=!showPeriod;els.eventAlertPeriod.textContent=showPeriod?`이벤트 기간 ${formatEventPeriod(state.activeEvent.startDate)} ~ ${formatEventPeriod(state.activeEvent.endDate)}`:''}if(els.eventAlertReadAll){els.eventAlertReadAll.hidden=total===0;els.eventAlertReadAll.disabled=unread===0;els.eventAlertReadAll.textContent=unread?`전체 읽음 (${unread})`:'전체 읽음'}if(!total){els.eventAlertMeta.textContent='현재 확인할 알림이 없습니다.';const empty=document.createElement('div');empty.className='event-alert-empty';empty.textContent='새 알림이 없습니다.';els.eventAlertList.appendChild(empty);return}els.eventAlertMeta.textContent=hasEvent?'알림 작품을 누르면 해당 찜목록으로 이동합니다.':'';renderMessageAlerts();renderEventAlertItems()}
function openEventAlerts(){syncActiveEventAlerts(true);updateEventAlertButton();if(totalUnreadAlertCount()>0){markAllEventAlertsRead();markAllMessagesRead();updateEventAlertButton()}renderEventAlerts();els.eventAlertBackdrop.classList.add('open');els.eventAlertBackdrop.setAttribute('aria-hidden','false');document.body.classList.add('modal-open')}
function closeEventAlerts(){els.eventAlertBackdrop.classList.remove('open');els.eventAlertBackdrop.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open')}
function openFavoriteAlertTarget(alert){const folderId=alert.folders[0];closeEventAlerts();state.favoriteLists[state.activeFavoriteListId]=[...state.favorites];state.eventCartSelection.clear();state.activeFavoriteListId=folderId;state.favorites=new Set(state.favoriteLists[folderId]||[]);state.showFavorites=true;state.showDateList=false;document.body.classList.add('favorite-mode');document.body.classList.remove('date-list-mode');state.visibleCount=Math.max(PAGE_SIZE,state.favorites.size);saveFavorites();refreshFavoriteListUI();updateBottomTabs();render(false);requestAnimationFrame(()=>{const cards=[...document.querySelectorAll('.card[data-work-id]')];const target=cards.find(card=>String(card.dataset.workId)===String(alert.item.workId));if(target){target.classList.add('event-alert-focus');target.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>target.classList.remove('event-alert-focus'),2400)}else{window.scrollTo({top:0,behavior:'smooth'})}})}
async function loadEventAlerts(){try{const eventData=normalizeEventData(await loadProtectedJson(EVENT_ALERT_DATA_URL,'107b371ac82059a5d32fb3c55088902f05ea6c6bf0b90d0e'));if(isEventActive(eventData)){state.activeEvent=eventData;syncActiveEventAlerts()}else{state.activeEvent=null;state.eventAlerts=[]}}catch{state.activeEvent=null;state.eventAlerts=[]}refreshEventPageAvailability();if(state.showFavorites)render(false)}
async function loadMessages(){try{state.messages=normalizeMessageData(await loadProtectedJson(MESSAGE_DATA_URL,'f0d75895b4bdbbe14e77ee448bc0b7846125fe37e1ad52e3'))}catch{state.messages=[]}}

function hasActiveEvent(){return Boolean(state.activeEvent&&Array.isArray(state.activeEvent.works)&&state.activeEvent.works.length)}
function refreshEventPageAvailability(){
  const active=hasActiveEvent();
  const menuBtn=document.getElementById('mobileMenuBtn');
  const pcEventBtn=document.getElementById('pcEventTopBtn');
  const eventLink=document.getElementById('mobileEventLink');
  const popup=document.getElementById('eventPagePopupBackdrop');
  const sendEventBtn=document.getElementById('sendFavoritesToEventBtn');
  if(pcEventBtn)pcEventBtn.hidden=!active;document.documentElement.dataset.pcEventInitial=active?'active':'inactive';document.documentElement.dataset.pcEventReady='1';
  if(sendEventBtn)sendEventBtn.hidden=!active;
  if(menuBtn)menuBtn.classList.toggle('has-event',active);
  if(eventLink){eventLink.classList.toggle('has-event',active);eventLink.classList.remove('is-disabled');eventLink.setAttribute('aria-disabled','false');eventLink.href='#';eventLink.removeAttribute('tabindex')}
  if(!active){state.eventCartSelection.clear();if(popup){popup.classList.remove('open');popup.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open')}if(state.showFavorites)render(false);return}
  if(!active||!popup)return;
  const currentEventPopupId=String(state.activeEvent?.eventId||'').trim();
  if(!currentEventPopupId)return;
  let dismissed='';try{dismissed=localStorage.getItem('dm_event_page_popup_dismissed')||''}catch{}
  if(dismissed===currentEventPopupId)return;
  const popupLink=document.getElementById('eventPagePopupLink');if(popupLink)popupLink.href=EVENT_PAGE_URL;
  popup.classList.add('open');popup.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');
}
function closeMobileMenuForEvent(){const b=document.getElementById('mobileMenuBackdrop');if(!b)return;b.classList.remove('open');b.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open')}
function showEventUnavailable(){
  closeMobileMenuForEvent();
  const b=document.getElementById('eventUnavailableBackdrop');const c=document.getElementById('eventUnavailableClose');if(!b)return;
  b.classList.add('open');b.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');if(c)c.focus();
}
function closeEventUnavailable(){const b=document.getElementById('eventUnavailableBackdrop');if(!b)return;b.classList.remove('open');b.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open')}
document.addEventListener('click',function(e){
  const target=e.target.closest&&e.target.closest('#pcEventTopBtn,#mobileEventLink');if(!target)return;
  e.preventDefault();e.stopImmediatePropagation();
  closeMobileMenuForEvent();
  const active=hasActiveEvent();
  if(!active){showEventUnavailable();return}
  window.open(EVENT_PAGE_URL,'_blank','noopener,noreferrer');
},true);
document.addEventListener('DOMContentLoaded',()=>{
  const close=document.getElementById('eventUnavailableClose');const back=document.getElementById('eventUnavailableBackdrop');
  if(close)close.addEventListener('click',closeEventUnavailable);
  if(back)back.addEventListener('click',e=>{if(e.target===back)closeEventUnavailable()});
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const b=document.getElementById('eventUnavailableBackdrop');if(b&&b.classList.contains('open'))closeEventUnavailable()}});

function setDetailCollapsed(collapsed){
if(!els.detailToggleBtn||!els.detailRow)return;
els.detailRow.classList.toggle('mobile-collapsed',collapsed);
els.detailToggleBtn.classList.toggle('is-collapsed',collapsed);
els.detailToggleBtn.title=collapsed?'상세검색 펼치기':'상세검색 접기';
els.detailToggleBtn.setAttribute('aria-expanded',String(!collapsed));
}
function toggleDetailPanel(){
if(!window.matchMedia('(max-width:980px)').matches)return;
setDetailCollapsed(!els.detailRow.classList.contains('mobile-collapsed'));
}
function resetAll(){els.q.value='';els.sortBy.value='default';els.titleOnly.value='';els.authorOnly.value='';els.exclude.value='';els.discountRate.value='';state.selectedHistoryDates.clear();state.excludePurchased=false;if(els.excludePurchased)els.excludePurchased.checked=false;state.keywordInclude.clear();state.keywordExclude.clear();if(els.keywordIncludeMajor)els.keywordIncludeMajor.value='';if(els.keywordExcludeMajor)els.keywordExcludeMajor.value='';renderKeywordCategories();els.keywordQuery.value='';els.keywordResults.innerHTML='';state.keywordSearchDismissed.clear();state.keywordSearchQueryNorm='';if(els.keywordSearchResultsWrap){els.keywordSearchResultsWrap.hidden=true;els.keywordSearchResultsWrap.style.display=''};renderKeywordSelection();renderKeywordCategories();updateKeywordMessage();applyFilters()}
function showEventTransferResult(movedTitles,notCurrentTitles){
  document.getElementById('eventTransferBackdrop')?.remove();
  const backdrop=document.createElement('div');backdrop.id='eventTransferBackdrop';backdrop.className='event-transfer-backdrop open';backdrop.setAttribute('aria-hidden','false');
  const modal=document.createElement('div');modal.className='event-transfer-modal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','eventTransferTitle');
  const close=document.createElement('button');close.type='button';close.className='event-transfer-close';close.setAttribute('aria-label','닫기');close.textContent='×';
  const title=document.createElement('h2');title.id='eventTransferTitle';title.textContent='이벤트 장바구니 이동 결과🛒';
  const makeSection=(heading,items)=>{const section=document.createElement('section');section.className='event-transfer-section';const h=document.createElement('h3');h.textContent=heading;section.appendChild(h);if(items.length){const ul=document.createElement('ul');ul.className='event-transfer-list';items.forEach(text=>{const li=document.createElement('li');li.textContent=text;ul.appendChild(li)});section.appendChild(ul)}else{const p=document.createElement('p');p.className='event-transfer-empty';p.textContent='없음';section.appendChild(p)}return section};
  const goEvent=document.createElement('button');goEvent.type='button';goEvent.className='event-transfer-go-btn';goEvent.textContent='이벤트 페이지로 이동';goEvent.addEventListener('click',()=>{try{sessionStorage.setItem('dm_event_active_tab','search');sessionStorage.setItem('dm_event_force_home_once','1')}catch{}window.location.href=EVENT_PAGE_URL});modal.append(close,title,makeSection('장바구니로 옮긴 목록',movedTitles),makeSection('현재 진행 이벤트가 아닌 목록',notCurrentTitles),goEvent);backdrop.appendChild(modal);document.body.appendChild(backdrop);
  const dismiss=()=>{backdrop.remove();document.removeEventListener('keydown',onKey)};const onKey=e=>{if(e.key==='Escape')dismiss()};close.addEventListener('click',dismiss);backdrop.addEventListener('click',e=>{if(e.target===backdrop)dismiss()});document.addEventListener('keydown',onKey);close.focus();
}
async function sendActiveFavoritesToEventCart(){
  const btn=document.getElementById('sendFavoritesToEventBtn');
  if(!EVENT_PAGE_URL){showFavoriteToast('이벤트 페이지가 연결되지 않았습니다');return}
  const selected=[...state.eventCartSelection].filter(key=>state.favorites.has(String(key)));
  if(!selected.length){showFavoriteToast('이벤트 장바구니로 보낼 작품을 선택해주세요');return}
  if(btn)btn.disabled=true;
  try{
    const activeEvent=state.activeEvent;
    const eventItems=activeEvent&&Array.isArray(activeEvent.works)?activeEvent.works:[];
    const eventById=new Map();const eventByTitleAuthor=new Map();
    eventItems.forEach((v,index)=>{const id=String(v.workId??v.id??'').trim();if(id)eventById.set(id,v);const ta=`${normalizeText(v.title||'')}__${normalizeText(v.author||'')}`;if(ta!=='__'&&!eventByTitleAuthor.has(ta))eventByTitleAuthor.set(ta,v)});
    const masterById=new Map(state.items.map(v=>[String(v.workId),v]));
    const matched=[];const notCurrent=[];
    selected.forEach(key=>{const master=masterById.get(String(key));if(!master)return;const byId=eventById.get(String(master.workId));const byTA=eventByTitleAuthor.get(`${normalizeText(master.title||'')}__${normalizeText(master.author||'')}`);const eventItem=byId||byTA;if(eventItem)matched.push({master,eventItem});else notCurrent.push(master)});
    const saved=readJsonStorage(EVENT_CART_STORAGE_KEY,[]);
    const cart=new Set(Array.isArray(saved)?saved.map(String):[]);
    const movedTitles=[];
    matched.forEach(({master,eventItem})=>{const cartKey=String(eventItem.workId??eventItem.id??eventItem.link??`${eventItem.title||''}__${eventItem.author||''}`);if(!cartKey)return;if(!cart.has(cartKey)){cart.add(cartKey);movedTitles.push(master.title||'(제목 없음)')}});
    localStorage.setItem(EVENT_CART_STORAGE_KEY,JSON.stringify([...cart]));
    selected.forEach(key=>state.eventCartSelection.delete(String(key)));
    render(false);
    showEventTransferResult(movedTitles,notCurrent.map(v=>v.title||'(제목 없음)'));
  }catch(e){
    showFavoriteToast('이벤트 장바구니 연결에 실패했습니다');
  }finally{
    if(btn)btn.disabled=false;
  }
}
function bindEvents(){document.getElementById('sendFavoritesToEventBtn')?.addEventListener('click',sendActiveFavoritesToEventCart);els.searchBtn.addEventListener('click',runMainSearch);els.q.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();runMainSearch();e.currentTarget.blur()}});[els.titleOnly,els.authorOnly,els.exclude].forEach(input=>{
input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();applyFilters();e.currentTarget.blur()}});
});els.q.addEventListener('focus',showRecentSearches);els.q.addEventListener('input',()=>{if(!els.q.value.trim())showRecentSearches();else hideRecentSearches()});if(els.recentSearchClear)els.recentSearchClear.addEventListener('click',()=>{localStorage.removeItem(RECENT_SEARCH_STORAGE_KEY);renderRecentSearches();els.q.focus()});document.addEventListener('click',e=>{if(els.recentSearches&&!els.recentSearches.hidden&&!e.target.closest('.search-row'))hideRecentSearches()});if(els.keywordPickerBtn)els.keywordPickerBtn.addEventListener('click',toggleKeywordPanel);if(els.keywordFindBtn)els.keywordFindBtn.addEventListener('click',()=>findKeywords(true));if(els.keywordSearchResetBtn)els.keywordSearchResetBtn.addEventListener('click',resetKeywordSearchResults);if(els.keywordQuery)els.keywordQuery.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();findKeywords(true)}});if(els.keywordClearBtn)els.keywordClearBtn.addEventListener('click',clearKeywords);els.sortBy.addEventListener('change',applyFilters);els.discountRate.addEventListener('change',applyFilters);els.resetBtn.addEventListener('click',resetAll);if(els.detailToggleBtn)els.detailToggleBtn.addEventListener('click',toggleDetailPanel);els.loadMoreBtn.addEventListener('click',()=>{state.visibleCount+=PAGE_SIZE;render()});els.goTopBtn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));els.goBottomBtn.addEventListener('click',()=>els.bottomAnchor.scrollIntoView({behavior:'smooth'}));document.getElementById('historyModalClose').addEventListener('click',closeHistoryModal);document.getElementById('historyModalBackdrop').addEventListener('click',e=>{if(e.target.id==='historyModalBackdrop')closeHistoryModal()});document.getElementById('dateIndexBtn').addEventListener('click',openDateIndex);document.getElementById('dateIndexClose').addEventListener('click',closeDateIndex);document.getElementById('dateIndexBackdrop').addEventListener('click',e=>{if(e.target.id==='dateIndexBackdrop')closeDateIndex()});document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeHistoryModal();closeDateIndex();closeEventAlerts()}});const vc=document.getElementById('viewCardBtn'),vl=document.getElementById('viewListBtn');if(vc)vc.addEventListener('click',()=>setViewMode('card'));if(vl)vl.addEventListener('click',()=>setViewMode('list'));if(els.includeDiscontinued)els.includeDiscontinued.addEventListener('change',()=>{state.includeDiscontinued=els.includeDiscontinued.checked;applyFilters();if(state.showFavorites)render(false)});if(els.excludePurchased)els.excludePurchased.addEventListener('change',()=>{state.excludePurchased=els.excludePurchased.checked;applyFilters();if(state.showFavorites)render(false)});document.addEventListener('click',e=>{if(!state.excludePurchased)return;if(e.target&&(['dmPurchaseFormSave'].includes(e.target.id)||e.target.closest?.('.dm-record-delete,.dm-work-delete'))){setTimeout(()=>{applyFilters();if(state.showFavorites)render(false)},50)}},true);const ts=document.getElementById('tabSearchBtn'),tl=document.getElementById('tabListBtn'),tf=document.getElementById('tabFavBtn');if(ts)ts.addEventListener('click',()=>{state.showDateList=false;document.body.classList.remove('date-list-mode');setFavoriteMode(false);window.scrollTo({top:0,behavior:'smooth'})});if(tl)tl.addEventListener('click',()=>setDateListMode(!state.showDateList));if(tf)tf.addEventListener('click',()=>setFavoriteMode(!state.showFavorites));
if(els.tasteTopBtn)els.tasteTopBtn.addEventListener('click',e=>{e.preventDefault();setFavoriteMode(!state.showFavorites);window.scrollTo({top:0,behavior:'smooth'})});
if(els.eventAlertBtn)els.eventAlertBtn.addEventListener('click',openEventAlerts);
if(els.eventAlertClose)els.eventAlertClose.addEventListener('click',closeEventAlerts);
if(els.eventAlertReadAll)els.eventAlertReadAll.addEventListener('click',()=>{markAllEventAlertsRead();markAllMessagesRead();updateEventAlertButton();renderEventAlerts()});
if(els.eventAlertBackdrop)els.eventAlertBackdrop.addEventListener('click',e=>{if(e.target===els.eventAlertBackdrop)closeEventAlerts()});
if(els.favListSelect)els.favListSelect.addEventListener('change',e=>switchFavoriteList(e.target.value));
if(els.favListMenuBtn)els.favListMenuBtn.addEventListener('click',e=>{e.preventDefault();els.favListMenu.hidden=!els.favListMenu.hidden});
if(els.favListAddBtn)els.favListAddBtn.addEventListener('click',addFavoriteList);
if(els.favListDeleteBtn)els.favListDeleteBtn.addEventListener('click',deleteFavoriteList);
if(els.favListRenameBtn)els.favListRenameBtn.addEventListener('click',renameFavoriteList);
if(els.favListNameInput)els.favListNameInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();renameFavoriteList()}});
if(els.favoriteSearchBtn)els.favoriteSearchBtn.addEventListener('click',runFavoriteSearch);if(els.favoriteSearchInput){els.favoriteSearchInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();runFavoriteSearch();e.currentTarget.blur()}});els.favoriteSearchInput.addEventListener('input',()=>{if(!els.favoriteSearchInput.value){state.favoriteQuery='';state.visibleCount=PAGE_SIZE;render(false)}})}
const dy=document.getElementById('dateYearFilter');if(dy)dy.addEventListener('change',renderDateListInline);const ds=document.getElementById('dateListSearchBtn');if(ds)ds.addEventListener('click',()=>{if(!state.selectedHistoryDates.size)return;state.showDateList=false;state.showFavorites=false;document.body.classList.remove('date-list-mode','favorite-mode');applyFilters();updateBottomTabs();window.scrollTo({top:0,behavior:'smooth'})});const dc=document.getElementById('dateListClearBtn');if(dc)dc.addEventListener('click',()=>{state.selectedHistoryDates.clear();applyFilters();renderDateListInline();updateBottomTabs();window.scrollTo({top:0,behavior:'smooth'})});const ib=document.getElementById('installBanner'),ih=document.getElementById('installHowBtn'),id=document.getElementById('installDismissBtn');const isStandalone=((window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)||window.navigator.standalone);const dismissed=localStorage.getItem('dm_install_dismissed')==='1';if(ib){ib.classList.remove('hidden','is-visible','is-dismissed');ib.style.display='';if(!isStandalone&&!dismissed){ib.classList.add('is-visible')}else{ib.classList.add('is-dismissed')}}if(ih)ih.addEventListener('click',()=>alert('아이폰 Safari 하단 공유 버튼(□↑) → 홈 화면에 추가를 누르면 앱처럼 열 수 있습니다.'));if(id&&ib)id.addEventListener('click',()=>{localStorage.setItem('dm_install_dismissed','1');ib.classList.remove('is-visible');ib.classList.add('is-dismissed');ib.style.display='none'});}
async function init(){bindEvents();renderRecentSearches();document.body.classList.toggle('view-card',state.viewMode==='card');document.body.classList.toggle('view-list',state.viewMode!=='card');updateViewButtons();document.body.classList.toggle("favorite-mode",state.showFavorites);document.body.classList.toggle("date-list-mode",state.showDateList);updateBottomTabs();setDetailCollapsed(window.matchMedia('(max-width:980px)').matches);try{const data=await loadProtectedJson('./works.json','');if(!Array.isArray(data))throw new Error('works.json 형식이 배열이 아닙니다.');state.items=data.map(normalizeItem);populateDiscountOptions();populateKeywordCatalog();populateDateYearFilter();refreshFavoriteListUI();if(window.dmReconcilePurchasedFavorites)await window.dmReconcilePurchasedFavorites();state.filtered=[...state.items];applyFilters();if(state.showDateList)renderDateListInline();await Promise.all([loadEventAlerts(),loadMessages()])}catch(err){await Promise.allSettled([loadEventAlerts(),loadMessages()]);els.error.textContent='works.json을 불러오지 못했습니다. index.html과 같은 위치에 works.json을 올려주세요.';els.error.classList.remove('hidden');console.error(err)}finally{updateEventAlertButton()}}
function setupMobileMenuEventAndTheme(){
  const THEME_KEY='dm_theme_preference';
  const EVENT_POPUP_DISMISSED_KEY='dm_event_page_popup_dismissed';
  const mobileOnly=()=>window.matchMedia&&window.matchMedia('(max-width:980px)').matches;
  const menuBtn=document.getElementById('mobileMenuBtn');
  const menuBackdrop=document.getElementById('mobileMenuBackdrop');
  const menuClose=document.getElementById('mobileMenuClose');
  const eventLink=document.getElementById('mobileEventLink');
  const popupBackdrop=document.getElementById('eventPagePopupBackdrop');
  const popupClose=document.getElementById('eventPagePopupClose');
  const popupLink=document.getElementById('eventPagePopupLink');
  const systemThemeQuery=window.matchMedia?window.matchMedia('(prefers-color-scheme: dark)'):null;
  let menuLastFocus=null;

  function getThemePreference(){try{const v=localStorage.getItem(THEME_KEY);return(v==='light'||v==='dark'||v==='system')?v:'system'}catch{return 'system'}}
  function applyTheme(pref){
    const effective=pref==='system'?((systemThemeQuery&&systemThemeQuery.matches)?'dark':'light'):pref;
    document.documentElement.dataset.theme=effective;
    document.documentElement.dataset.themePreference=pref;
    document.querySelectorAll('[data-theme-choice]').forEach(btn=>btn.classList.toggle('active',btn.dataset.themeChoice===pref));
    const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute('content',effective==='dark'?'#18181B':'#F7F7F8');
  }
  function setTheme(pref){try{localStorage.setItem(THEME_KEY,pref)}catch{}applyTheme(pref)}
  applyTheme(getThemePreference());
  document.querySelectorAll('[data-theme-choice]').forEach(btn=>btn.addEventListener('click',()=>setTheme(btn.dataset.themeChoice)));
  const pcThemeBtn=document.getElementById('pcThemeBtn');if(pcThemeBtn)pcThemeBtn.addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
  if(systemThemeQuery){const onSystemThemeChange=()=>{if(getThemePreference()==='system')applyTheme('system')};if(systemThemeQuery.addEventListener)systemThemeQuery.addEventListener('change',onSystemThemeChange);else if(systemThemeQuery.addListener)systemThemeQuery.addListener(onSystemThemeChange)}

  function openMenu(){if(!menuBackdrop||!mobileOnly())return;menuLastFocus=document.activeElement;menuBackdrop.classList.add('open');menuBackdrop.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');if(menuClose)menuClose.focus()}
  function closeMenu(){if(!menuBackdrop)return;menuBackdrop.classList.remove('open');menuBackdrop.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open');if(menuLastFocus&&menuLastFocus.focus)menuLastFocus.focus()}
  if(menuBtn)menuBtn.addEventListener('click',openMenu);
  if(menuClose)menuClose.addEventListener('click',closeMenu);
  if(menuBackdrop)menuBackdrop.addEventListener('click',e=>{if(e.target===menuBackdrop)closeMenu()});

  if(eventLink)eventLink.addEventListener('click',closeMenu);
  if(popupLink){popupLink.href=EVENT_PAGE_URL;popupLink.target='_self';popupLink.removeAttribute('rel');}

  function currentEventPopupId(){return String(state.activeEvent?.eventId||'').trim()}
  function markEventPopupDismissed(){const eventId=currentEventPopupId();if(!eventId)return;try{localStorage.setItem(EVENT_POPUP_DISMISSED_KEY,eventId)}catch{}}
  function closeEventPopup(){if(!popupBackdrop)return;markEventPopupDismissed();popupBackdrop.classList.remove('open');popupBackdrop.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open')}
  if(popupClose)popupClose.addEventListener('click',closeEventPopup);
  if(popupBackdrop)popupBackdrop.addEventListener('click',e=>{if(e.target===popupBackdrop)closeEventPopup()});
  if(popupLink)popupLink.addEventListener('click',markEventPopupDismissed);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(popupBackdrop&&popupBackdrop.classList.contains('open'))closeEventPopup();else if(menuBackdrop&&menuBackdrop.classList.contains('open'))closeMenu()}});
}
setupMobileMenuEventAndTheme();

init();

;

document.addEventListener('click',function(e){
  var a=e.target.closest&&e.target.closest('.back-to-main');
  if(!a) return;
  e.preventDefault();
  if(e.stopImmediatePropagation) e.stopImmediatePropagation();
  window.location.href='https://dmnovel.github.io/events/';
},true);

;

(function(){
  const tasteBackdrop=document.getElementById('tasteModalBackdrop');
  const tasteClose=document.getElementById('tasteModalClose');
  function closeTaste(){
    if(!tasteBackdrop) return;
    tasteBackdrop.classList.remove('open');
    tasteBackdrop.setAttribute('aria-hidden','true');
    document.body.classList.remove('modal-open');
  }
  if(tasteClose) tasteClose.addEventListener('click',closeTaste);
  if(tasteBackdrop) tasteBackdrop.addEventListener('click',function(e){if(e.target===tasteBackdrop) closeTaste();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){closeTaste();closeFavoriteMoveMenu&&closeFavoriteMoveMenu();}});
})();

;

(function(){
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
    document.body.classList.add('standalone');
  }
})();

;


(function(){
  const backdrop=document.getElementById('pointbackModalBackdrop');
  const openBtn=document.getElementById('pointbackTopBtn');
  const closeBtn=document.getElementById('pointbackModalClose');
  if(!backdrop||!openBtn||!closeBtn)return;
  let lastFocus=null;
  const pointbackConfigs={
    '202607백년':[
      ['2026-07-14','2026-07-14','14일','카테고리 상관없이 10만원 이상 결제','5,000P'],
      ['2026-07-15','2026-07-15','15일','BL 3만원 이상 결제','1,000P'],
      ['2026-07-16','2026-07-16','16일','판타지 3만원 이상 결제','1,000P'],
      ['2026-07-17','2026-07-17','17일','로판 3만원 이상 결제','1,000P'],
      ['2026-07-18','2026-07-18','18일','로맨스 3만원 이상 결제','1,000P'],
      ['2026-07-19','2026-07-19','19일','BL 또는 판타지 5만원 이상 결제','1,500P'],
      ['2026-07-20','2026-07-20','20일','로맨스 또는 로판 5만원 이상 결제','1,500P'],
      ['2026-07-21','2026-07-21','21일','7/14~7/21 누적 30만원 이상 결제','10,000P']
    ],
    '202609추석뿌리':[
      ['2026-09-23','2026-09-30','9/23~9/30','3만원 이상 구매','3,000P'],
      ['2026-10-01','2026-10-05','10/1~10/5','1만원 이상 구매','500P']
    ]
  };
  function renderPointback(){
    const list=document.getElementById('pointbackList');if(!list)return;
    const selected=state.selectedHistoryDates.size===1?String([...state.selectedHistoryDates][0]||'').trim():'';
    const rows=pointbackConfigs[selected]||[];
    const now=new Date(),today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    list.innerHTML='';
    rows.forEach(([start,end,label,condition,reward])=>{const row=document.createElement('div');row.className='pointback-row'+(today>=start&&today<=end?' is-today':'');row.innerHTML=`<div class="pointback-date">${label}</div><div class="pointback-condition">${condition}</div><div class="pointback-reward">${reward}</div>`;list.appendChild(row)});
    const title=document.getElementById('pointbackModalTitle');if(title)title.textContent=selected==='202609추석뿌리'?'202609추석 포인트백':'날짜별 포인트백';
  }
  function openModal(){
    lastFocus=document.activeElement;renderPointback();backdrop.classList.add('open');backdrop.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');closeBtn.focus();
  }
  function closeModal(){backdrop.classList.remove('open');backdrop.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open');if(lastFocus&&lastFocus.focus)lastFocus.focus();}
  openBtn.addEventListener('click',openModal);closeBtn.addEventListener('click',closeModal);backdrop.addEventListener('click',e=>{if(e.target===backdrop)closeModal();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&backdrop.classList.contains('open'))closeModal();});
})();




