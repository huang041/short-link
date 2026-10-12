# Short Link

高可用短網址服務，支援連結預覽、推薦碼追蹤與成效分析。

## 功能

- **短網址生成與跳轉** — 隨機 7 碼 base62，302 跳轉確保每次點擊都被記錄
- **短網址到期** — 建立時可指定 `expiresAt`，到期後自動視為失效
- **連結預覽（OG Tags）** — 偵測社群爬蟲（Facebook、Twitter、Slack 等），回傳 OG meta tags
- **推薦碼追蹤** — `?ref=<code>` 在跳轉時擷取，歸因至推薦者
- **成效分析** — 點擊次數、裝置、地區、瀏覽器、來源、日期趨勢
- **歸因分析** — 依長網址跨短碼分析，支援 campaign 維度

## 快速啟動

```bash
docker-compose -f docker-compose.prod.yml up --build
```

啟動後開啟 [http://localhost:8080](http://localhost:8080)

> 第一次啟動會自動執行 DB migration，無需額外設定。

## 架構

```
nginx (port 8080)
├── /api/*          → Express backend (port 3000)
├── /[a-zA-Z0-9]{7} → Express backend (短碼跳轉)
└── /*              → React frontend (靜態檔)
```

| 服務 | 技術 |
|------|------|
| Backend | Express 5 + TypeScript |
| Frontend | React + Vite |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Queue | BullMQ（基於 Redis） |
| ORM | Prisma 6 |

## 關鍵設計

- **Redis 快取** — 短碼查詢先打 Redis，cache miss 才查 DB，TTL 3600s
- **BullMQ click queue** — 跳轉時不直接寫 DB，ClickEvent 丟進 queue 非同步處理，避免 analytics insert 影響跳轉延遲
- **DB-side aggregation** — 統計查詢用 Prisma `groupBy` + raw SQL，不把所有 click rows 撈回 Node.js

## 開發環境

```bash
# 啟動 DB + Redis
docker-compose up -d

# Backend（port 3000）
cd server
npm install
npx prisma migrate dev
npx tsx prisma/seed.ts   # 建立 admin user + referral code
npm run dev

# Frontend（port 5173）
cd web
npm install
npm run dev
```

## 測試

```bash
cd server
npm test              # 單次執行
npm run test:watch    # watch 模式
npm run test:coverage # 含 coverage 報告
```

## 壓測

```bash
cd server
npx tsx scripts/load-test.ts <shortCode>

# 自訂參數
CONNECTIONS=100 DURATION=30 npx tsx scripts/load-test.ts <shortCode>
```

## 環境變數

| 變數 | 說明 | 預設值 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 連線字串 | — |
| `REDIS_URL` | Redis 連線字串 | — |
| `BASE_URL` | 短網址公開 base URL | `http://localhost:3000` |
| `PORT` | Express port | `3000` |
| `HTTP_PORT` | nginx 對外 port | `8080` |
| `JWT_SECRET` | JWT 簽名密鑰 | `change-me-in-production` |
