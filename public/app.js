const fields = [
  "partyAName",
  "partyBName",
  "startDate",
  "endDate",
  "rent",
  "storeCount",
  "partyAId",
  "partyAPhone",
  "partyAAddress",
  "referrerName",
  "referrerId",
  "partyBId",
  "partyBPhone",
  "partyBAddress",
  "rocYear",
  "signMonth",
  "signDay",
];

const storageKey = "shopee-contract-draft-v1";
const contractDoc = document.getElementById("contractDoc");
const saveStatus = document.getElementById("saveStatus");
const agreeCheck = document.getElementById("agreeCheck");

function value(name) {
  return document.querySelector(`[data-field="${name}"]`)?.value.trim() || "";
}

function blank(text, cls = "") {
  return `<span class="blank ${cls}">${escapeHtml(text)}</span>`;
}

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function dateText(raw) {
  if (!raw) return `${blank("", "short")} 年 ${blank("", "short")} 月 ${blank("", "short")} 日`;
  const [year, month, day] = raw.split("-");
  return `${blank(year || "", "short")} 年 ${blank(String(Number(month || 0) || ""), "short")} 月 ${blank(String(Number(day || 0) || ""), "short")} 日`;
}

function renderContract() {
  const partyA = value("partyAName");
  const partyB = value("partyBName");
  const rent = value("rent");
  const storeCount = value("storeCount");
  contractDoc.innerHTML = `
    <h2>Shopee店鋪租賃合約</h2>
    <p>甲方：${blank(partyA)} 以下簡稱甲方</p>
    <p>乙方：${blank(partyB)} 以下簡稱乙方</p>

    <p class="indent">甲乙雙方合意以甲方名下辦理的實名制的Shopee電商平臺賣家帳戶以下簡稱店鋪，該店鋪於合約期間由乙方向甲方承租並全權經營管理，租賃期間甲方需積極配合乙方店鋪設立，配合銀行開戶及登錄作業，經營期間店鋪入帳金額對帳及轉帳，乙方指定時間收驗證碼等操作。</p>

    <p>雙方約定如下：</p>
    <p class="article">第一條 雙方約定租賃為 ${dateText(value("startDate"))} 至 ${dateText(value("endDate"))}，並於上開約定期間內以甲方設立完成店鋪後第一筆入帳當月為始期，如於期間因故未能繼續經營而無入帳為末期，如未滿上開租賃期間日後店鋪重新啟動，再以新入帳月重新給予租金。每屆滿租賃期間，如雙方無異議則自動續約一年。</p>

    <p class="article">第二條 雙方約定每間店鋪每月租金新台幣 ${blank(rent)} 元整。${storeCount ? `店鋪數量：${blank(storeCount, "short")} 間。` : ""}</p>

    <p class="article">第三條 甲方店鋪租賃期未屆滿前，不得中途收回乙方店鋪經營和使用權，否則將視為甲方單方面違約，應按乙方經營期間，每月平均營業總額乘以20%作為經濟補償；另亦不得在乙方經營使用期間私自挪用帳戶資金，如經挪用須按挪用金額加計20%於期限內返還。</p>

    <p class="article">第四條 因為店鋪歸屬甲方名下，所綁定的銀行帳戶也是甲方名下，所以每月營業總額，在平臺錢包提現後將會自動轉入甲方名下銀行帳戶，每月視營業額多寡由乙方通知何時轉匯甲方指定帳戶，以利乙方進貨資金周轉。</p>
    <p>（一）甲方須依乙方指示時間及金額於期間內完成匯款，每月月底最後一筆金額在扣除租金後，將剩餘到帳金額如數匯款到乙方指定帳戶，如需匯款手續費則由甲方自行負擔。</p>
    <p>（二）當月如營業額不足租金時，將併入次月一起計算扣除總共租金，餘額再匯款至乙方。</p>
    <p>（三）在店鋪經營期間如有需求，甲方應積極配合處理問題，由於經營需要，必要時甲方應配合辦理營業執照或相關手續，做到合法合規經營，相關稅務稅款及手續等費用由乙方負責。</p>

    <p class="article">第五條 乙方在租賃期間，不得有違法違規的操作，不得銷售平臺明令禁止的產品，不得銷售販賣仿冒偽劣產品，例如仿冒大品牌的鞋服、飾品、包、化妝品、藥品等，否則甲方有權採納證據如圖片、影像、聊天記錄等先予以警告，如乙方不及時改善或無視甲方警告而發生損害，乙方應負損害賠償責任，如未處理相關損害賠償，甲方可立即終止租賃合約並直接收回店鋪使用經營權。</p>

    <p class="article">第六條 租賃期間除非因應蝦皮或系統作業要求，雙方不得任意變更基本資料，如需變更則須於變更前通知對方，雙方均需知悉變更後資料。</p>

    <p class="article">第七條 乙方在使用經營期間，應按臺灣當地法律法規，如臺灣當地有發文或通知甲方需要繳納相應費用及稅收，乙方必須積極配合甲方繳納相應費用及稅收等，不得有違法漏稅，該稅金由乙方支付。</p>

    <p class="article">第八條 甲乙雙方在簽訂Shopee店鋪租賃期間，甲方由其推薦人協助管理Shopee電商店鋪，甲方須配合推薦人執行乙方要求之相關作業，甲方推薦人則為該合約之連帶保證人。</p>

    <p class="article">第九條 以上條款由甲乙雙方認可後達成一致共識，而擬訂簽署的合同條款，具有絕對的法律效力。如有因本合約涉及訴訟時，甲、乙雙方同意以臺灣高雄地方法院為第一審管轄法院。本合約乙式三份，三方各執乙份為憑。</p>

    <div class="sign-grid">
      <p>甲 方：<span class="sign-line">${escapeHtml(partyA)}</span></p>
      <p>乙 方：<span class="sign-line">${escapeHtml(partyB)}</span></p>
      <p>身分證字號：<span class="sign-line">${escapeHtml(value("partyAId"))}</span></p>
      <p>身分證字號：<span class="sign-line">${escapeHtml(value("partyBId"))}</span></p>
      <p>連絡電話：<span class="sign-line">${escapeHtml(value("partyAPhone"))}</span></p>
      <p>連絡電話：<span class="sign-line">${escapeHtml(value("partyBPhone"))}</span></p>
      <p>地址：<span class="sign-line">${escapeHtml(value("partyAAddress"))}</span></p>
      <p>地址：<span class="sign-line">${escapeHtml(value("partyBAddress"))}</span></p>
      <p>甲方推薦人：<span class="sign-line">${escapeHtml(value("referrerName"))}</span></p>
      <p>推薦人身分證字號：<span class="sign-line">${escapeHtml(value("referrerId"))}</span></p>
    </div>

    <p class="date-line">中 華 民 國 ${blank(value("rocYear"), "short")} 年 ${blank(value("signMonth"), "short")} 月 ${blank(value("signDay"), "short")} 日</p>
  `;
  const signature=activeContract?.data.partyBSignature;
  if(signature) {
    const proof=document.createElement('section');proof.className='signed-proof';
    const heading=document.createElement('strong');heading.textContent='乙方手寫簽名';
    const img=document.createElement('img');img.alt='乙方已提交簽名';img.src=signatureImage(signature.strokes);
    const detail=document.createElement('small');detail.textContent='簽署時間：'+new Date(signature.signedAt).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'})+' (Asia/Taipei) / SHA-256: '+signature.documentHash;
    proof.append(heading,img,detail);contractDoc.append(proof);
  }
}

function collectData() {
  const data = {};
  for (const field of fields) data[field] = value(field);
  data.agree = agreeCheck.checked;
  data.savedAt = new Date().toISOString();
  return data;
}

async function saveDraft() {
  if (!activeContract) throw new Error('請先新增或開啟合約');
  const result = await cloudApi('/api/contracts/' + activeContract.id, 'PATCH', { revision:activeContract.revision, data:collectData() });
  activeContract=result.contract;
  dirty=false;
  saveStatus.textContent='已存雲端 '+new Date(activeContract.updatedAt).toLocaleTimeString('zh-TW');
  cloudStatus.textContent='已儲存到雲端';
  return result;
}

function loadDraft() {
  let data = {};
  try {
    data = JSON.parse(localStorage.getItem(storageKey) || "{}");
  } catch {
    data = {};
  }
  for (const field of fields) {
    const input = document.querySelector(`[data-field="${field}"]`);
    if (input && data[field]) input.value = data[field];
  }
  agreeCheck.checked = Boolean(data.agree);
  if (!value("rocYear")) {
    const now = new Date();
    document.querySelector('[data-field="rocYear"]').value = String(now.getFullYear() - 1911);
    document.querySelector('[data-field="signMonth"]').value = String(now.getMonth() + 1);
    document.querySelector('[data-field="signDay"]').value = String(now.getDate());
  }
}

function clearDraft() {
  if (!confirm("確定清空目前填寫資料？")) return;
  for (const field of fields) {
    const input = document.querySelector(`[data-field="${field}"]`);
    if (input) input.value = "";
  }
  agreeCheck.checked = false;
  saveStatus.textContent = "已清空";
  dirty=true;
  renderContract();
}

async function printContract() {
  if(activeContract?.status === 'draft') await saveDraft();
  window.print();
}

document.querySelectorAll("[data-field]").forEach((input) => {
  input.addEventListener("input", () => { signatureEditor.clear(); dirty=true; saveStatus.textContent='尚有變更未儲存'; renderContract(); });
});
agreeCheck.addEventListener("change", () => { dirty=true; renderContract(); });
document.getElementById("saveBtn").addEventListener("click", () => run(saveDraft));
document.getElementById("printBtn").addEventListener("click", () => run(printContract));
document.getElementById("clearBtn").addEventListener("click", clearDraft);

let role='', activeContract=null, dirty=false, busy=false;
const signatureEditor=createSignatureEditor(document.getElementById('signatureCanvas'),()=>{dirty=true;saveStatus.textContent='簽名尚未提交';});
document.getElementById('clearSignatureBtn').addEventListener('click',()=>{signatureEditor.clear();dirty=true;});
const cloudStatus=document.getElementById('cloudStatus');
const $=id=>document.getElementById(id);
const shareToken=new URLSearchParams(location.hash.slice(1)).get('share') || '';
// Fragments are not sent to the server or included in referrer headers.
if(shareToken) { $('userLabel').hidden=true; $('loginUser').required=false; $('loginTitle').textContent='合約存取驗證'; $('passwordLabel').firstChild.textContent='驗證碼'; }
async function cloudApi(path,method='GET',body) {
  const response=await fetch(path,{method,headers:body ? {'Content-Type':'application/json'} : {},body:body ? JSON.stringify(body) : undefined});
  const result=await response.json();
  if(!response.ok) throw new Error(result.message || '操作失敗');
  return result;
}
async function run(fn) {
  if(busy) return;
  busy=true; cloudStatus.textContent='處理中…';
  signatureEditor.setEnabled(false);
  agreeCheck.disabled=true;
  $('clearSignatureBtn').disabled=true;
  document.querySelectorAll('[data-field]').forEach(el=>el.disabled=true);
  try { await fn(); } catch(error) { cloudStatus.textContent=error.message; }
  finally { busy=false; applyPermissions(); }
}
function applyPermissions() {
  const draft=activeContract?.status==='draft';
  const allowed=['partyBName','partyBId','partyBPhone','partyBAddress'];
  document.querySelectorAll('[data-field]').forEach(el=>el.disabled=!draft || (role!=='admin'&&!allowed.includes(el.dataset.field)));
  agreeCheck.disabled=!draft || role!=='signer';
  $('consentRow').hidden=role!=='signer';
  $('signatureSection').hidden=!draft || role!=='signer';
  signatureEditor.setEnabled(draft && role==='signer' && !busy);
  $('clearSignatureBtn').disabled=busy || !draft;
  $('saveBtn').disabled=!draft;
  $('printBtn').disabled=!activeContract;
  $('clearBtn').hidden=role!=='admin'; $('clearBtn').disabled=!draft;
  $('submitContractBtn').hidden=!draft || role!=='signer';
  for(const id of ['shareBtn','revokeBtn']) $(id).disabled=!activeContract;
  $('reopenBtn').disabled=!activeContract || draft;
  $('completeBtn').disabled=activeContract?.status!=='submitted';
}
function openContract(record) {
  signatureEditor.clear();
  activeContract=record; dirty=false;
  for(const field of fields) document.querySelector(`[data-field="${field}"]`).value=record.data[field] || '';
  agreeCheck.checked=record.data.agree===true;
  $('editor').hidden=false; $('shareResult').hidden=true;
  saveStatus.textContent=record.status==='draft'?'雲端草稿':record.status==='submitted'?'已提交，待核對':'已核對完成';
  cloudStatus.textContent=record.title+' · '+saveStatus.textContent;
  renderContract(); applyPermissions();
}
async function refreshList() {
  const result=await cloudApi('/api/contracts');
  const select=$('contractSelect'); select.replaceChildren(new Option('選擇合約',''));
  const labels={draft:'草稿',submitted:'待核對',completed:'已核對'};
  for(const c of result.contracts) select.add(new Option(`${c.title} · ${labels[c.status] || c.status}`,c.id));
  select.value=activeContract?.id || '';
}
async function entered(me) {
  role=me.role; $('loginForm').hidden=true; $('logoutBtn').hidden=false; $('adminTools').hidden=role!=='admin';
  $('loginPassword').value='';
  if(role==='admin') { await refreshList(); cloudStatus.textContent='已登入，請新增或選擇合約'; }
  else { const r=me.contract ? me : await cloudApi('/api/contracts/'+me.contractId); openContract(r.contract); }
}
$('loginForm').addEventListener('submit',event=>{event.preventDefault();run(async()=>{
  const me=await cloudApi(shareToken?'/api/access':'/api/login','POST',shareToken?{token:shareToken,code:$('loginPassword').value}:{user:$('loginUser').value,password:$('loginPassword').value});
  await entered(me);
});});
async function createContract(importOld=false) {
  if(dirty&&!confirm('目前變更尚未儲存，仍要新增合約？'))return;
  const title=$('contractTitle').value.trim();if(!title)throw new Error('請先填寫合約名稱／對象');
  let data=Object.fromEntries(fields.map(f=>[f,''])); data.agree=false;
  if(importOld) {
    const old=JSON.parse(localStorage.getItem(storageKey) || 'null');
    if(!old)throw new Error('這個瀏覽器沒有舊草稿');
    for(const f of fields)data[f]=String(old[f] || '');data.agree=old.agree===true;
  }
  const result=await cloudApi('/api/contracts','POST',{title,data});openContract(result.contract);await refreshList();
}
$('newContractBtn').addEventListener('click',()=>run(()=>createContract()));
$('importDraftBtn').addEventListener('click',()=>run(()=>createContract(true)));
$('contractSelect').addEventListener('change',()=>run(async()=>{
  const id=$('contractSelect').value;if(!id)return;
  if(dirty&&!confirm('有尚未儲存的內容，確定切換？')) { $('contractSelect').value=activeContract?.id || '';return; }
  openContract((await cloudApi('/api/contracts/'+id)).contract);
}));
$('refreshCloudBtn').addEventListener('click',()=>run(async()=>{
  if(dirty&&!confirm('重新載入會捨棄未儲存變更，確定繼續？'))return;
  await refreshList(); if(activeContract)openContract((await cloudApi('/api/contracts/'+activeContract.id)).contract);
}));
async function action(name,extra={}) {
  if(!activeContract)return;
  if(dirty)throw new Error('請先儲存變更');
  const result=await cloudApi(`/api/contracts/${activeContract.id}/${name}`,'POST',{revision:activeContract.revision,...extra});
  openContract(result.contract);if(role==='admin')await refreshList();return result;
}
$('shareBtn').addEventListener('click',()=>run(async()=>{
  if(!confirm('產生乙方填寫及簽署連結（有效 7 天）？舊連結將立即失效。'))return;
  if(dirty)await saveDraft();
  const result=await action('share');if(!result)return;
  $('shareUrl').value=location.origin+'/#share='+result.token;$('shareCode').value=result.code;$('shareResult').hidden=false;
}));
$('revokeBtn').addEventListener('click',()=>run(async()=>{if(confirm('立即停用這份合約的分享存取？'))await action('revoke');}));
$('reopenBtn').addEventListener('click',()=>run(async()=>{if(confirm('重新開放修改後，本版簽名將失效，乙方需要重新簽署。舊簽署紀錄仍保留。確定繼續？'))await action('reopen');}));
$('completeBtn').addEventListener('click',()=>run(async()=>{if(confirm('標記資料核對完成？'))await action('complete');}));
$('submitContractBtn').addEventListener('click',()=>run(async()=>{
  if(!agreeCheck.checked)throw new Error('請先勾選簽署同意');
  const strokes=signatureEditor.strokes();
  if(!strokes.length)throw new Error('請先完成乙方手寫簽名');
  if(!confirm('確認以此手寫簽名簽署目前合約？提交後內容將鎖定。'))return;
  if(dirty)await saveDraft();await action('submit',{strokes});
}));
$('logoutBtn').addEventListener('click',()=>run(async()=>{if(dirty&&!confirm('尚有變更未儲存，確定登出？'))return;await cloudApi('/api/logout','POST',{});dirty=false;location.reload();}));
window.addEventListener('beforeunload',event=>{if(dirty||signatureEditor.strokes().length){event.preventDefault();event.returnValue='';}});
applyPermissions();
if(!shareToken) cloudApi('/api/me').then(entered).catch(()=>{});
