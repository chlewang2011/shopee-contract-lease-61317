import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import pg from 'pg';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { makeCloud, fields, passwordHash, passwordMatches, cleanData, cleanSignature } from './cloud.mjs';
const strokes=[[[0.1,0.2],[0.2,0.4],[0.3,0.1],[0.5,0.3],[0.7,0.4]]];
test('signature bounds and blank rejection',()=>{
  assert.deepEqual(cleanSignature(strokes),strokes);
  for(const s of [[],[[[0,0]]],[[[0,0],[2,1]]],[[[0,0],[0,0],[0,0],[0,0],[0,0]]]])assert.throws(()=>cleanSignature(s),{status:400});
});

test('password hashes and data allowlist',()=>{
  const hash=passwordHash('test-secret');
  assert.equal(passwordMatches('test-secret',hash),true);
  assert.equal(passwordMatches('bad',hash),false);
  assert.equal(passwordMatches('test-secret','bad'),false);
  assert.throws(()=>cleanData({}),{status:400});
  assert.equal(cleanData({x:'no',name:' yes ',agree:true},['name']).x,undefined);
});

test('cloud persistence, access isolation, locks, conflicts and revocation',{skip:!process.env.DATABASE_URL},async()=>{
  const password=randomUUID();
  const env={...process.env,NODE_ENV:'test',CONTRACT_ADMIN_USER:'cloud-test',CONTRACT_ADMIN_PASSWORD_HASH:passwordHash(password),APP_ORIGIN:'http://localhost'};
  let cloud=await makeCloud(env);
  const ids=[];
  const server=http.createServer(async(req,res)=>{
    try{const result=await cloud.handle(req,res,new URL(req.url,'http://localhost'));res.setHeader('Content-Type','application/json');res.end(JSON.stringify(result));}
    catch(e){res.statusCode=e.status||500;res.end(JSON.stringify({message:e.message}));}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  async function request(path,method='GET',body,cookie='',expected=200,origin) {
    const res=await fetch(base+path,{method,headers:{'Content-Type':'application/json',Cookie:cookie,...(origin?{Origin:origin}:{})},body:body?JSON.stringify(body):undefined});
    const data=await res.json();assert.equal(res.status,expected,JSON.stringify(data));
    return {...data,cookie:res.headers.get('set-cookie')?.split(';')[0]};
  }
  try {
    await request('/api/contracts','GET',null,'',401);
    await request('/api/login','POST',{user:'cloud-test',password},'',403,'https://evil.invalid');
    const admin=(await request('/api/login','POST',{user:'cloud-test',password})).cookie;
    const data=Object.fromEntries(fields.map(f=>[f,'']));Object.assign(data,{partyAName:'QA only',rent:'123',agree:true});
    const create=async()=>{const r=(await request('/api/contracts','POST',{title:'AUTOMATED QA '+randomUUID(),data},admin)).contract;ids.push(r.id);return r;};
    let a=await create(),b=await create();
    const share=await request(`/api/contracts/${a.id}/share`,'POST',{revision:a.revision},admin);a=share.contract;
    await request('/api/access','POST',{token:share.token,code:'wrong'},'',401);
    const signer=(await request('/api/access','POST',{token:share.token,code:share.code})).cookie;
    await request('/api/contracts','GET',null,signer,403);
    await request(`/api/contracts/${b.id}`,'GET',null,signer,403);
    await request(`/api/contracts/${b.id}`,'PATCH',{revision:b.revision,data},signer,403);
    await request(`/api/contracts/${a.id}/share`,'POST',{revision:a.revision},signer,403);
    a=(await request(`/api/contracts/${a.id}`,'PATCH',{revision:a.revision,data:{...data,rent:'999',partyAName:'Changed QA',partyBName:'Signer QA',partyBSignature:{signedAt:'fake'}}},signer)).contract;
    assert.equal(a.data.rent,'123');
    assert.equal(a.data.partyAName,'QA only');
    assert.equal(a.data.partyBName,'Signer QA');
    assert.equal(a.data.partyBSignature,undefined);
    await request(`/api/contracts/${a.id}`,'PATCH',{revision:1,data},admin,409);
    await request(`/api/contracts/${a.id}/submit`,'POST',{revision:a.revision,strokes},admin,403);
    await request(`/api/contracts/${a.id}/submit`,'POST',{revision:a.revision,strokes:[]},signer,400);
    a=(await request(`/api/contracts/${a.id}/submit`,'POST',{revision:a.revision,strokes},signer)).contract;
    assert.deepEqual(a.data.partyBSignature.strokes,strokes);
    assert.match(a.data.partyBSignature.documentHash,/^[a-f0-9]{64}$/);
    await request(`/api/contracts/${a.id}`,'PATCH',{revision:a.revision,data},signer,409);
    await cloud.close();cloud=await makeCloud(env);
    const persisted=(await request(`/api/contracts/${a.id}`,'GET',null,admin)).contract;
    assert.equal(persisted.data.partyAName,'QA only');assert.equal(persisted.status,'submitted');
    assert.deepEqual(persisted.data.partyBSignature,a.data.partyBSignature);
    a=(await request(`/api/contracts/${a.id}/reopen`,'POST',{revision:a.revision},admin)).contract;
    assert.equal(a.data.agree,false);
    assert.equal(a.data.partyBSignature,undefined);
    await request(`/api/contracts/${a.id}/revoke`,'POST',{revision:a.revision},admin);
    await request(`/api/contracts/${a.id}`,'GET',null,signer,403);
    await request('/api/access','POST',{token:share.token,code:share.code},'',401);
    await request('/api/logout','POST',{},admin);
    await request('/api/contracts','GET',null,admin,401);
  } finally {
    server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await cloud.close();
    const u=new URL(env.DATABASE_URL);for(const k of ['sslmode','uselibpqcompat','sslrootcert'])u.searchParams.delete(k);
    const p=new pg.Pool({connectionString:u.toString(),ssl:{rejectUnauthorized:true,ca:readFileSync(new URL('./supabase-ca.crt',import.meta.url),'utf8')}});
    for(const id of ids) {
      await p.query('delete from contract_private.sessions where contract_id=$1',[id]);
      await p.query('delete from contract_private.history where contract_id=$1',[id]);
      await p.query('delete from contract_private.contracts where id=$1',[id]);
    }
    await p.end();
  }
});
