# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用指令

```bash
# 開發
npm run dev       # 啟動 ts-node + nodemon（熱重載）
npm run build     # 編譯 TypeScript → dist/
npm start         # 執行編譯後的程式

# Docker
docker-compose up --build   # 啟動所有服務（nginx, app, db, redis）
docker-compose down         # 停止所有服務

# 資料庫（本地對 docker DB 操作）
npx prisma migrate dev      # 建立並套用 migration
npx prisma migrate deploy   # 套用 migrations（Docker CMD 使用）
npx prisma generate         # schema 變更後重新產生 Prisma client
npx prisma studio           # 開啟 Prisma GUI
```

## 架構說明

採用 feature-based（domain-driven）結構，每個 domain 管理自己的 routes、controller、service：

```
src/
├── urls/        # POST /api/urls/shorten — 建立短網址
├── redirects/   # GET /:shortCode — 執行跳轉（最後掛載，catch-all）
├── analytics/   # GET /api/analytics/:shortCode — 點擊統計
└── preview/     # og.service.ts — 給社群爬蟲抓取 OG tag 用
```

**`app.ts` 的 route 掛載順序很重要**：`/api/urls` 和 `/api/analytics` 必須在 `/`（redirect catch-all）之前掛載。

## 關鍵設計決策

- **302（非 301）跳轉** — 刻意的設計，確保每次點擊都經過 server，才能記錄 analytics。
- **Fire-and-forget analytics** — `redirect.service.ts` 中用 `analyticsService.record().catch(console.error)`，絕不阻塞跳轉。
- **Redis 快取** — `urlService.findByCode()` 先查 Redis 再查 Postgres，cache key：short code → long URL。
- **社群爬蟲偵測** — redirect controller 應透過 User-Agent 判斷社群爬蟲，對爬蟲回傳 OG preview HTML（來自 `og.service.ts`）而非直接跳轉。
- **Referral tracking** — 儲存在 DB record 中，不暴露在短網址的 query string 裡。
- **短碼生成** — Snowflake ID → base62 編碼，目標產生 7 個字元的短碼。

## 基礎設施

- **nginx** 將 `${HTTP_PORT:-8080}` 代理到 app:3000
- **app** Express 跑在 port 3000；container 啟動時先執行 `prisma migrate deploy`，再執行 `node dist/index.js`
- **Prisma client** 輸出到 `generated/prisma/`（設定在 `prisma/schema.prisma`）
- **Prisma singleton** 在 `src/lib/prisma.ts` 用 `globalThis` pattern，避免 dev 熱重載產生多個 instance
- **Redis client** 在 `src/lib/redis.ts` 提供 `connectRedis()` 在啟動時初始化連線

## 環境變數

定義在 `.env`（不 commit、不傳入 Docker — Docker 使用 `docker-compose.yml` 中的硬編碼值）：

| 變數           | 用途                            |
|----------------|--------------------------------|
| `DATABASE_URL` | Postgres 連線字串               |
| `REDIS_URL`    | Redis 連線字串                  |
| `BASE_URL`     | 短網址的公開 base URL            |
| `PORT`         | Express port（預設 3000）        |
| `HTTP_PORT`    | nginx 對外 port（預設 8080）     |

## 尚未實作的部分

- `urlService.create()` — 短碼生成 + 寫入 DB
- `urlService.findByCode()` — Redis 快取 + DB fallback
- `analyticsService.record()` — 寫入點擊事件到 DB
- `analyticsService.getStats()` — 依國家/referral/平台聚合統計
- `og.service.ts` — HTTP fetch + meta tag 解析 + preview HTML 生成
- `redirect.controller.ts` 的爬蟲偵測
- `url.controller.ts` 的 Zod 驗證
- Prisma schema models（Url、Click 資料表尚未定義）
