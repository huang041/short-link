# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案結構

Monorepo，分為 `server/`（Express backend）和 `web/`（React + Vite frontend）：

```
short-link/
├── server/           # Express + TypeScript backend
│   ├── src/
│   │   ├── urls/        # POST /api/urls/shorten — 建立短網址
│   │   ├── redirects/   # GET /:shortCode — 執行跳轉（catch-all，最後掛載）
│   │   ├── analytics/   # GET /api/analytics/:shortCode、/api/analytics/url
│   │   ├── preview/     # og.service.ts + bot.ts — OG tag 抓取與社群爬蟲偵測
│   │   ├── auth/        # JWT 認證（register/login）
│   │   ├── referrals/   # 推薦碼 CRUD（需認證）
│   │   ├── middlewares/ # errorHandler、rateLimit
│   │   ├── lib/         # prisma.ts、redis.ts、queue.ts（BullMQ）
│   │   ├── config/      # 環境變數
│   │   └── types/       # ClickEvent 等共用型別
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts      # 建立 admin user + referral code
│   └── scripts/
│       ├── create-url.ts   # CLI 呼叫建立短網址 API
│       └── load-test.ts    # autocannon 壓測腳本
└── web/              # React + Vite frontend
    └── src/
        ├── api/client.ts   # fetch wrapper，自動帶 Bearer token
        ├── components/     # Layout
        └── pages/          # CreateUrl、Analytics、Login、Register、Referrals、UrlList
```

## 常用指令

```bash
# 開發（本地，需先啟動 docker-compose）
cd server && npm run dev    # ts-node + nodemon 熱重載，port 3000
cd web && npm run dev       # Vite dev server，port 5173（proxy /api → localhost:3000）

# Build
cd server && npm run build

# Docker（開發環境，只起 db + redis）
docker-compose up -d        # 啟動 db（port 54310）+ redis（port 63790）
docker-compose down

# Docker（Production）
docker-compose -f docker-compose.prod.yml up --build
docker-compose -f docker-compose.prod.yml down

# 資料庫
cd server
npx prisma migrate dev      # 建立並套用 migration（本地開發）
npx prisma migrate deploy   # 套用 migrations（Docker CMD 使用）
npx prisma generate         # schema 變更後重新產生 Prisma client
npx prisma studio           # 開啟 Prisma GUI
npx tsx prisma/seed.ts      # 建立 admin user + referral code

# 測試
cd server && npm test              # vitest run（單次）
cd server && npm run test:watch    # vitest watch 模式
cd server && npm run test:coverage # 含 coverage 報告

# 腳本
npx tsx scripts/create-url.ts                    # 建立短網址
npx tsx scripts/load-test.ts <shortCode>         # 壓測跳轉 API
CONNECTIONS=100 DURATION=30 npx tsx scripts/load-test.ts <shortCode>
```

## 關鍵設計決策

- **302（非 301）跳轉** — 確保每次點擊都經過 server，才能記錄 analytics。
- **BullMQ click queue** — 跳轉時不直接寫 DB，而是把 ClickEvent 放進 Redis queue，worker 非同步寫入。避免 analytics insert 佔用 DB connection pool 影響跳轉效能。
- **Redis 快取** — `urlService.findByCode()` 先查 Redis 再查 Postgres，cache key：`url:{shortCode}`，TTL 3600s。
- **OG tag 爬蟲偵測** — `redirect.controller.ts` 透過 User-Agent 判斷社群爬蟲（Facebook、Twitter、Slack 等），對爬蟲回傳 OG preview HTML + meta refresh，對一般使用者做 302 跳轉。
- **Referral tracking** — `?ref=<code>` 在跳轉時擷取，儲存在 Click record，不暴露在短網址本身。
- **短碼生成** — 隨機 7 位 base62，unique constraint 衝突時最多 retry 3 次（P2002 錯誤碼）。
- **Campaign** — 建立短網址時指定，綁定在 Url 資料列，用於同一長網址不同行銷活動的歸因。
- **DB-side aggregation** — analytics 統計用 Prisma `groupBy` + raw SQL，不把所有 click rows 撈回 Node.js。
- **Rate limiting** — 用 Redis 計數（sliding window），防止 API 濫用。
- **Unit tests** — Vitest，colocated（`*.test.ts` 與 service 同層），mock Prisma/Redis，`tsconfig.test.json` 獨立給測試用。

## 基礎設施

- **nginx**（production）將 `${HTTP_PORT:-8080}` 代理到 app:3000；`^/[a-zA-Z0-9]{7}` 路徑轉發到 backend，其餘走前端靜態檔
- **app** Express 跑在 port 3000；container 啟動時先 `prisma migrate deploy`，再 `node dist/index.js`
- **Prisma 6**（`prisma-client-js` generator），client 輸出到預設路徑，從 `@prisma/client` import
- **Prisma singleton** 在 `src/lib/prisma.ts` 用 `globalThis` pattern，避免 dev 熱重載產生多個 instance
- **Redis client** 在 `src/lib/redis.ts`，`connectRedis()` 在 `index.ts` 啟動時呼叫
- **BullMQ worker** 在 `src/lib/queue.ts`，`startClickWorker()` 在 `index.ts` 啟動時呼叫

## 環境變數

`.env` 在根目錄（不 commit），docker-compose 直接寫硬編碼值：

| 變數           | 用途                                      |
|----------------|------------------------------------------|
| `DATABASE_URL` | Postgres 連線字串（本地用 port 54310）    |
| `REDIS_URL`    | Redis 連線字串（本地用 port 63790）       |
| `BASE_URL`     | 短網址的公開 base URL                     |
| `PORT`         | Express port（預設 3000）                 |
| `HTTP_PORT`    | nginx 對外 port（預設 8080）              |
| `JWT_SECRET`   | JWT 簽名密鑰                              |

> `DB_PORT=54310`、`REDIS_PORT=63790` 是本地 docker 對外 port，`DATABASE_URL` 要用這個 port。docker-compose 內部網路仍用 5432/6379。

## DB Schema

4 個 model（`@@map` 全部小寫）：

- **Url** — `shortCode`（unique）、`longUrl`、`campaign`、`ogTitle/ogDescription/ogImage`、`expiresAt`
- **Click** — `urlId`、`referralCode`、`ip`、`device`、`browser`、`os`、`country`、`referer`、`clickedAt`
- **User** — `email`（unique）、`passwordHash`
- **Referral** — `code`（unique）、`userId`

## route 掛載順序（app.ts）

`/api/auth` → `/api/urls` → `/api/analytics` → `/api/referrals` → `/`（redirect catch-all）→ `errorHandler`

`/api/analytics` 中 `/url` route 需在 `/:shortCode` 之前掛載，否則 `url` 會被當 shortCode。
