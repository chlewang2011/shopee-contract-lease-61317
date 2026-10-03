# Shopee 店鋪租賃合約線上版

這是一個不儲存個資到伺服器的線上合約填寫頁。使用者填寫的甲方、乙方、身分證、電話、地址等資料只保存在該瀏覽器的 localStorage；按「列印 / 存PDF」後可用瀏覽器列印或另存 PDF。

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
