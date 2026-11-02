import { randomBytes, randomUUID, createHash, timingSafeEqual, scryptSync } from 'node:crypto';
import pg from 'pg';
import { readFileSync } from 'node:fs';

export const fields = ['partyAName','partyBName','startDate','endDate','rent','storeCount','partyAId','partyAPhone','partyAAddress','referrerName','referrerId','partyBId','partyBPhone','partyBAddress','rocYear','signMonth','signDay'];
export const signerFields = ['partyAName','partyAId','partyAPhone','partyAAddress','referrerName','referrerId'];
const hash = value => createHash('sha256').update(String(value)).digest('hex');
const token = () => randomBytes(32).toString('hex');
export function passwordHash(password, salt = randomBytes(16).toString('hex')) {
  return salt + ':' + scryptSync(password, salt, 32).toString('hex');
}
export function passwordMatches(password, stored) {
  if (typeof password !== 'string' || password.length > 256 || !/^[a-f0-9]{32}:[a-f0-9]{64}$/.test(stored || '')) return false;
  return timingSafeEqual(Buffer.from(passwordHash(password, stored.split(':')[0])), Buffer.from(stored));
}
export function cleanData(data, allowed = fields) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw Object.assign(new Error('資料格式不正確'), { status: 400 });
  const output = {};
  for (const field of allowed) {
    if (typeof data[field] !== 'string' || data[field].length > 1000) throw Object.assign(new Error('欄位格式或長度不正確'), { status: 400 });
    output[field] = data[field].trim();
  }
  output.agree = data.agree === true;
  return output;
}
export async function makeCloud(env = process.env) {
  if (!env.DATABASE_URL || !env.CONTRACT_ADMIN_USER || !env.CONTRACT_ADMIN_PASSWORD_HASH) return null;
  const dbUrl = new URL(env.DATABASE_URL);
  for(const key of ['sslmode','uselibpqcompat','sslrootcert']) dbUrl.searchParams.delete(key);
  const pool = new pg.Pool({ connectionString: dbUrl.toString(), ssl: { rejectUnauthorized: true, ca: readFileSync(new URL('./supabase-ca.crt',import.meta.url),'utf8') }, max: 4, connectionTimeoutMillis: 15000 });
  // Private schema: never exposed through the Supabase public Data API.
  await pool.query(`create schema if not exists contract_private;
    revoke all on schema contract_private from public, anon, authenticated;
    create table if not exists contract_private.contracts (
      id uuid primary key, title text not null, data jsonb not null default '{}',
      status text not null default 'draft', revision integer not null default 1,
      share_hash text, code_hash text, expires_at timestamptz,
      created_at timestamptz not null default now(), updated_at timestamptz not null default now());
    create table if not exists contract_private.sessions (
      hash text primary key, role text not null, contract_id uuid, share_hash text,
      expires_at timestamptz not null);
    create table if not exists contract_private.attempts (
      key text primary key, count integer not null, expires_at timestamptz not null);
    create table if not exists contract_private.history (
      id bigserial primary key, contract_id uuid not null, action text not null,
      role text not null, data jsonb not null, at timestamptz not null default now());
    alter table contract_private.contracts enable row level security;
    alter table contract_private.sessions enable row level security;
    alter table contract_private.attempts enable row level security;
    alter table contract_private.history enable row level security;
    revoke all on all tables in schema contract_private from public, anon, authenticated;`);
  const q = (sql, args) => pool.query(sql, args);
  const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
  async function throttle(key) {
    const { rows } = await q(`insert into contract_private.attempts values($1,1,now()+interval '15 minutes')
      on conflict(key) do update set count=case when attempts.expires_at<now() then 1 else attempts.count+1 end,
      expires_at=case when attempts.expires_at<now() then now()+interval '15 minutes' else attempts.expires_at end returning count`, [hash(key)]);
    if (rows[0].count > 12) fail(429, '嘗試次數過多，請於 15 分鐘後再試');
  }
  async function session(req) {
    const cookie = /(?:^|;\s*)contract_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '');
    if (!cookie) return null;
    const { rows } = await q('select * from contract_private.sessions where hash=$1 and expires_at>now()', [hash(cookie[1])]);
    return rows[0] || null;
  }
  async function issue(res, role, record = null) {
    const secret = token();
    await q(`insert into contract_private.sessions values($1,$2,$3,$4,now()+interval '8 hours')`, [hash(secret),role,record?.id || null,record?.share_hash || null]);
    res.setHeader('Set-Cookie', `contract_session=${secret}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${env.NODE_ENV === 'test' ? '' : '; Secure'}`);
  }
  const view = r => ({ id:r.id,title:r.title,data:r.data,status:r.status,revision:r.revision,updatedAt:r.updated_at,shareActive:Boolean(r.share_hash && new Date(r.expires_at)>new Date()),expiresAt:r.expires_at });
  async function body(req) {
    if (!String(req.headers['content-type'] || '').startsWith('application/json')) fail(415,'需要 JSON 格式');
    let data = ''; for await (const chunk of req) { data += chunk; if(Buffer.byteLength(data)>40000) fail(413,'資料太大'); }
    try { return JSON.parse(data); } catch { fail(400,'JSON 格式錯誤'); }
  }
  async function handle(req,res,url) {
    const path = url.pathname;
    if (!['GET','POST','PATCH'].includes(req.method)) fail(405,'不支援此操作');
    if (req.method !== 'GET' && req.headers.origin && req.headers.origin !== env.APP_ORIGIN) fail(403,'來源不允許');
    if (req.method !== 'GET' && req.headers['sec-fetch-site'] === 'cross-site') fail(403,'來源不允許');
    const b = req.method !== 'GET' ? await body(req) : {};
    if (path === '/api/login' && req.method === 'POST') {
      await throttle('admin');
      if (b.user !== env.CONTRACT_ADMIN_USER || !passwordMatches(b.password,env.CONTRACT_ADMIN_PASSWORD_HASH)) fail(401,'帳號或密碼不正確');
      await issue(res,'admin'); return { role:'admin' };
    }
    if (path === '/api/access' && req.method === 'POST') {
      if (!/^[a-f0-9]{64}$/.test(b.token || '')) fail(401,'連結或驗證碼無效');
      await throttle('share:'+hash(b.token));
      const { rows } = await q('select * from contract_private.contracts where share_hash=$1 and expires_at>now()',[hash(b.token)]);
      const r=rows[0];
      if(!r || !passwordMatches(b.code,r.code_hash)) fail(401,'連結或驗證碼無效、已到期或已停用');
      await issue(res,'signer',r); return { role:'signer',contract:view(r) };
    }
    const s = await session(req);
    if(!s) fail(401,'請先登入');
    if(path === '/api/logout' && req.method === 'POST') {
      await q('delete from contract_private.sessions where hash=$1',[s.hash]);
      res.setHeader('Set-Cookie','contract_session=; HttpOnly; SameSite=Strict; Secure; Path=/; Max-Age=0');
      return { success:true };
    }
    if(path === '/api/me' && req.method === 'GET') return { role:s.role,contractId:s.contract_id };
    if(path === '/api/contracts' && req.method === 'GET') {
      if(s.role !== 'admin') fail(403,'無權查看其他合約');
      const { rows }=await q('select id,title,status,revision,updated_at from contract_private.contracts order by updated_at desc');
      return { contracts:rows };
    }
    if(path === '/api/contracts' && req.method === 'POST') {
      if(s.role !== 'admin') fail(403,'無權新增合約');
      if(typeof b.title !== 'string' || !b.title.trim() || b.title.length>120) fail(400,'請填寫合約名稱（最多 120 字）');
      const { rows }=await q('insert into contract_private.contracts(id,title,data) values($1,$2,$3) returning *',[randomUUID(),b.title.trim(),cleanData(b.data)]);
      return { contract:view(rows[0]) };
    }
    const match=/^\/api\/contracts\/([a-f0-9-]{36})(?:\/(share|revoke|submit|reopen|complete))?$/.exec(path);
    if(!match) fail(404,'找不到頁面');
    const [,id,action]=match;
    // Lock the row so edits, submitting and revoking cannot race each other.
    const client=await pool.connect();
    try {
      await client.query('begin');
      const { rows }=await client.query('select * from contract_private.contracts where id=$1 for update',[id]);
      const r=rows[0];
      if(!r) fail(404,'找不到合約');
      if(s.role !== 'admin' && (s.contract_id !== r.id || !r.share_hash || s.share_hash !== r.share_hash || new Date(r.expires_at)<=new Date())) fail(403,'無權存取或分享已停用');
      if(req.method === 'GET' && !action) { await client.query('commit'); return { contract:view(r) }; }
      if(!action && req.method !== 'PATCH') fail(405,'不支援此操作');
      if(action && req.method !== 'POST') fail(405,'不支援此操作');
      if(b.revision !== r.revision) fail(409,'合約已被更新，請重新開啟後再修改');
      let extra={};
      if(!action) {
        if(r.status !== 'draft') fail(409,'已提交的合約已鎖定，請由管理員重新開放');
        r.data={...r.data,...cleanData(b.data,s.role === 'admin' ? fields : signerFields)};
      } else if(action === 'submit') {
        if(r.status !== 'draft') fail(409,'合約已提交');
        if(!r.data.agree || !r.data.partyAName) fail(400,'請先填寫甲方姓名、勾選確認並儲存');
        r.status='submitted';
      } else {
        if(s.role !== 'admin') fail(403,'僅管理員可操作');
        if(action === 'share') {
          const secret=token(), code=randomBytes(6).toString('hex');
          r.share_hash=hash(secret); r.code_hash=passwordHash(code);
          r.expires_at=new Date(Date.now()+7*86400000);
          extra={ token:secret,code,expiresAt:r.expires_at };
        }
        if(action === 'revoke') { r.share_hash=null; r.code_hash=null; r.expires_at=null; }
        if(action === 'reopen') { r.status='draft'; r.data.agree=false; }
        if(action === 'complete') {
          if(r.status !== 'submitted') fail(409,'請先提交核對');
          r.status='completed';
        }
      }
      await client.query('insert into contract_private.history(contract_id,action,role,data) values($1,$2,$3,$4)',[id,action || 'save',s.role,r.data]);
      const updated=await client.query(`update contract_private.contracts set data=$2,status=$3,share_hash=$4,code_hash=$5,expires_at=$6,revision=revision+1,updated_at=now() where id=$1 returning *`,[id,r.data,r.status,r.share_hash,r.code_hash,r.expires_at]);
      await client.query('commit');return { contract:view(updated.rows[0]),...extra };
    } catch(error) { await client.query('rollback'); throw error; } finally { client.release(); }
  }
  return { handle, close:()=>pool.end() };
}
