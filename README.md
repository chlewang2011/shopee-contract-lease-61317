# Shopee 店鋪租賃合約線上版

新版資料存於 Supabase Postgres 的 `contract_private` 私有 schema，不再將新合約個資寫入 localStorage。舊草稿可登入管理端後手動匯入。

## 雲端管理設定

Render 必須設定 `DATABASE_URL`、`CONTRACT_ADMIN_USER`、`CONTRACT_ADMIN_PASSWORD_HASH`（由 cloud.mjs 的 passwordHash 產生）、`APP_ORIGIN`（正式網址）。缺少設定時雲端 API 回傳 503，不會假裝存檔成功。

`supabase-ca.crt` 是從 https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt 下載的官方公開 CA。資料庫連線驗證 CA 與主機名稱。

管理員新增合約並儲存後可產生 7 天有效的分享連結。乙方需同時持有連結和驗證碼，只能修改乙方資料並手寫簽名。提交後鎖定，管理員可重新開放或核對完成。重新產生連結及停用分享會立即撤銷舊連結和既有簽約人 session。

登入 cookie 為 HttpOnly、Secure、SameSite=Strict，8 小時到期。密碼只保存 scrypt hash。管理員更改密碼後應清除既有 admin sessions。私有 schema 不對 Supabase 公開 API 開放。並行修改使用 revision 防止覆蓋，history 保留修改紀錄。

支援手寫簽名紀錄，但不提供實名驗證或憑證式數位簽章。「核對完成」不代表身分已驗證。雲端存檔不等於完整備份，請另行規劃保留與備份政策。

驗證：`npm run check`。使用測試環境變數後執行 `node --env-file=.env.local --test cloud.test.mjs`，會建立並清理本輪假資料，測試持久化、隔離、欄位權限、版本衝突、鎖定及撤銷。沒有 DATABASE_URL 時會跳過整合測試。

## 本機預覽

```powershell
npm start
```

預設網址：

```text
http://localhost:4188/
```

如果 4188 被占用：

```powershell
$env:PORT="4190"; npm start
```

## Render Free 部署

1. 把此資料夾推到 GitHub repo。
2. Render 選 New Web Service 或 Blueprint。
3. 使用設定：
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Health Check Path: `/healthz`
   - Plan: Free

## 子域名設定

假設要使用：

```text
contract.example.com
```

部署到 Render 後，在 Render 服務內新增 Custom Domain：

```text
contract.example.com
```

再到網域 DNS 新增：

```text
Type: CNAME
Name: contract
Value: Render 提供的目標域名
```

DNS 生效後即可用子域名開啟合約頁。

## 注意

這份頁面是線上填寫與列印工具，不是法律審查意見。正式簽署前建議由台灣律師確認條款有效性、個資、稅務與平台帳戶使用風險。
# Party B handwriting workflow

The administrator prepares Party A and contract terms. A share recipient can edit
only Party B name, ID, telephone and address. Signature Pad captures mouse/touch
strokes; submit requires explicit consent, both names and a nonblank signature.
Only the share recipient can submit. The server stores normalized strokes, UTC
timestamp, content SHA-256 and revision in the private database. The print view
includes the signature and timestamp. Reopening archives the old signed snapshot
and clears the current signature and consent, requiring a new signature.

Signature strokes are not saved by the draft-save button; they are committed with
signing submission. This is handwriting capture, not verified identity or a
certificate-based digital signature. No claim of automatic legal validity is made.

