# TaoTalk Finance / 滔说 Finance

个人版全球市场研究终端，覆盖全球宏观、权益、FICC、大类资产、原创主题指数、MDX 研究文章和微信公众号内容。原 Hunter Power Index 的成分股、服务端指数计算与行情适配器已迁移到主题指数模块。

> 本网站只展示真实来源的次日日线数据，不在生产环境生成随机行情、虚假历史数据或占位研究文章。数据源不可用时，界面和 API 都返回 `Data unavailable`。

## 技术栈

- Next.js App Router、React、TypeScript、Tailwind CSS
- ECharts（服务端准备数据，浏览器只负责展示）
- PostgreSQL + Prisma schema（首期内容仍以 MDX/本地配置为权威来源）
- 可替换缓存层：当前进程内缓存；`REDIS_URL` 为后续共享缓存预留
- Vercel 部署与受保护 Cron；保留项目原有 Sites/vinext 本地构建兼容

## 本地运行

要求 Node.js 22.13 或更高版本。

```bash
npm install
copy .env.example .env.local
npm run dev
```

打开 `http://localhost:3000`。验证：

```bash
npm run lint
npm run build
npm test
```

## 真实数据源与次日更新

首期使用三类服务端来源，统一只读取已完成交易日：

| 数据 | 来源 | 更新 | 所需配置 |
| --- | --- | --- | --- |
| HPI 20只成分股、SPY/QQQ/XLU基准、GLD黄金ETF | Market Data Stocks | 至少24小时延迟 EOD | `MARKETDATA_TOKEN` |
| S&P 500、Nasdaq 100、US 10Y、美元广义指数、WTI、VIX | FRED | 官方日线发布后 | `FRED_API_KEY` |
| BTC/USD | Coinbase Bitcoin via FRED (`CBBTCUSD`) | FRED 最新日线 | `FRED_API_KEY` |
| MOVE | 暂无已配置的合规免费日线源 | Data unavailable | 不生成替代或模拟数据 |

Market Data Free Forever 每日 100 credits，且股票行情至少延迟24小时；本站每个计划刷新周期约使用 24 credits（HPI/基准 23、GLD 1），留有余量。FRED 只在服务端调用官方 observations API，BTC 明确标注为 Coinbase Bitcoin via FRED。页面逐项显示来源和数据日期。

### KZG 美股期权每日截图

`/markets` 的“美股期权分钟数据”区块展示 KZG Option House 的来源保留型截图。页面明确显示数据日期、抓取时间、来源和原站链接，不通过 OCR 重建数字。初始图片和元数据位于：

```text
public/data/kzg-option-daily.png
public/data/kzg-option-daily.json
```

GitHub Actions 工作流 `.github/workflows/refresh-kzg-option-snapshot.yml` 每天北京时间 00:10 运行 `scripts/capture-kzg-option-house.mjs`。脚本只在找到并验证完整报告区域后覆盖快照；失败时保留上一张有效图片，不生成替代数据。也可以在 Actions 页面手动运行 `Refresh KZG option snapshot`，本地已安装 Playwright 时可执行：

```bash
npm run capture:kzg
```

自动发布第三方截图前，应确认已获得页面所有者授权，并保留 KZG 来源标识和原站链接。若未来获得稳定 JSON 接口，优先改为经过字段校验的响应式表格。

## 环境变量与数据源切换

所有第三方密钥必须保存在 `.env.local` 或部署平台的 Secret 中，绝不能使用 `NEXT_PUBLIC_` 前缀。

```env
MARKET_DATA_PROVIDER=marketdata
MARKET_DATA_FALLBACKS=twelvedata,polygon,fmp,finnhub
MARKETDATA_TOKEN=your_server_side_token
FRED_API_KEY=your_fred_key
FMP_API_KEY=your_fmp_key
COINGECKO_DEMO_API_KEY=optional_demo_key
```

HPI 使用 `marketdata` 作为主数据源。免费账户有每日 credits、一年历史、延迟和单一 IP 限制，单次完整刷新会覆盖 20 只成分股及 SPY/QQQ/XLU 三个基准标的。MarketData Token 只保存在固定出口 IP 的更新电脑中，Vercel 只读取 `data/hunter-power-snapshot.json`，不会直接请求 MarketData。备用股票供应商仍支持 `twelvedata`、`polygon`、`fmp`、`finnhub`。跨资产数据按品类路由；GLD 始终明确标注为“Gold ETF”，不会冒充黄金现货；FRED 美元广义指数也不会冒充 ICE DXY。适配器位于 `lib/market-data/providers/`：

- `getQuote(symbol)` / `getQuotes(symbols)`
- `getHistoricalPrices(symbol, range)`
- `getMarketStatus()`
- `getFundamentals(symbol)`（供应商不支持时返回明确错误）

服务端已有请求超时、重试、缓存、HPI 股票供应商 fallback 和数据时间戳。MarketData 免费日线至少延迟 24 小时，因此固定 IP 电脑应在每周二至周六北京时间 23:30 检查最新可用美股交易日。`ALLOW_MOCK_MARKET_DATA=true` 只用于本地开发，生产环境永不启用。

### 固定 IP 电脑更新 Hunter Power Index

确认 `.env.local` 中存在真实 `MARKETDATA_TOKEN`，然后先手动测试：

```powershell
cd "C:\Users\ROG\Documents\Codex\2026-07-20\hunter-taotalk-finance-finance-ficc-finance"
npm.cmd run refresh:hunter
```

成功后，`data/hunter-power-snapshot.json` 会保存真实快照。需要同时提交并触发 Vercel 部署时运行：

```powershell
npm.cmd run refresh:hunter:auto
```

Windows 任务计划程序可在每周二至周六 23:30 执行：

```text
程序：powershell.exe
参数：-NoProfile -ExecutionPolicy Bypass -File "C:\Users\ROG\Documents\Codex\2026-07-20\hunter-taotalk-finance-finance-ficc-finance\scripts\refresh-hunter.ps1"
```

勾选“错过计划后尽快运行”。更新失败时脚本不会覆盖上次有效快照。MarketData Token 不得配置在 Vercel，也不得提交 `.env.local`。

## 发布研究文章

在 `content/research/` 新建 `slug.mdx`：

```mdx
---
title: "真实文章标题"
subtitle: "副标题"
date: "2026-07-20"
updatedAt: "2026-07-20"
category: "Macro"
tags: ["Rates", "Liquidity"]
summary: "真实文章摘要"
coverImage: "/research/example.jpg"
wechatUrl: "https://mp.weixin.qq.com/..."
featured: true
readingTime: "8 min read"
dataSources: ["Federal Reserve", "Author calculations"]
---

正文支持 MDX、图表组件、引用、标题和链接。
```

分类只允许：`Macro`、`Equities`、`FICC`、`Power & Energy`、`Semiconductors`、`AI Infrastructure`、`Cross Asset`。外链由文章渲染器自动增加安全属性。

## 维护微信公众号目录

编辑 `config/wechat.ts`，只录入真实的封面、标题、发布日期、分类、摘要和微信公开原文链接。公开链接通常以 `https://mp.weixin.qq.com/s/` 开头；不要填写带 `token` 的公众号后台管理地址。可选 `localSlug` 关联站内 MDX 全文。本站不抓取微信文章。

公众号二维码：将图片放入 `public/`，并设置：

```env
NEXT_PUBLIC_WECHAT_QR=/wechat-qr.jpg
```

未配置时显示“待配置”，不会生成不可扫描的假二维码。

## Hunter Power Index

- 通用定义：`data/indices/hunter-power.ts`
- 20 只现有成分股：`data/constituents.ts`
- 等权计算：`lib/calculateHunterIndex.ts`
- 风险统计：`lib/index-engine/statistics.ts`
- 页面：`app/indices/hunter-power/page.tsx`
- 方法论：`app/methodology/hunter-power/page.tsx`

HPI、行业归因、贡献度与风险指标均在服务端计算。浏览器不依据不完整数据重建指数。新增指数时，先增加 `IndexDefinition` 配置，再接入经核验的行情和方法论；禁止复制 HPI 历史作为占位数据。

## 数据库与缓存

Prisma schema 位于 `prisma/schema.prisma`：

```bash
npm run db:generate
npx prisma migrate dev
```

首期研究文章使用 Git 可审计的 MDX，本地市场观点使用 `config/market-regime.ts`。PostgreSQL 预留给版本记录。当前缓存为可替换的进程内实现；生产多实例共享缓存可基于 `REDIS_URL` 接入 Redis 适配器。

## Vercel 部署

1. 将仓库导入 Vercel；Framework 选择 Next.js。
2. 在 Project Settings → Environment Variables 中添加 `.env.example` 所需真实值。
3. 设置 `NEXT_PUBLIC_SITE_URL` 为正式域名。
4. 不要在 Vercel 配置 `MARKETDATA_TOKEN`；HPI 由固定 IP 电脑生成并提交快照。
5. 生成至少 32 字符的 `CRON_SECRET`，供其他受保护任务使用。
6. Build Command 使用 `npm run build:vercel`；完成后检查 `/markets`、`/indices/hunter-power` 和 API 缺省状态。

不要提交 `.env.local`、API Key、数据库密码、微信私有素材或未获授权的市场数据。

## 主要目录

```text
app/                    页面、Route Handlers、SEO、错误与加载状态
components/             layout / market / indices / research / ui
config/                 品牌、市场观点、微信文章本地配置
content/research/       MDX 研究文章
data/indices/           通用指数定义
lib/market-data/        行情接口、供应商、缓存、重试、限速
lib/index-engine/       指数定义与统计
lib/content/            MDX 内容索引与校验
prisma/                 PostgreSQL schema
public/                 品牌、二维码、研究配图
```

## 中美宏观数据终端

`/macro` 是独立的中美宏观数据终端，不是文章列表。页面包含人工维护的 Macro Regime、中国与美国指标卡、利率与流动性及未来 14 天重要经济事件。没有有效观测值时统一显示 `Data unavailable`，不会生成占位数字或随机曲线。

服务端数据源：

- FRED：美国利率、国债、流动性和增长序列；必填 `FRED_API_KEY`。BLS/BEA 直连接口失败时，自动读取 FRED 中对应的 BLS/BEA 官方镜像序列。
- BLS：CPI、PPI、就业；`BLS_API_KEY` 可选，未配置时先尝试官方公共额度，再回退至 FRED 镜像。
- BEA：GDP 与 PCE；`BEA_API_KEY` 可选，未配置或请求失败时回退至 FRED 镜像。
- FMP：未来 14 天中美经济日历、前值、预期值和公布值；配置 `FMP_API_KEY` 后启用，每 10 分钟缓存一次。FMP 不可用时继续使用 FRED 发布日历和已核验的中国官方发布日期。
- ChinaBond：10 年、30 年国债收益率及 10Y-1Y 利差从中债官方公开页面读取，每个工作日收盘后更新。
- 国家统计局与人民银行：官方页面优先；无法稳定服务端解析时读取数据库中经人工核验的覆盖值。

宏观相关环境变量：

```env
FRED_API_KEY=your_fred_key
BLS_API_KEY=optional_registered_bls_key
BEA_API_KEY=your_bea_key
FMP_API_KEY=your_fmp_key
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/taotalk_finance
MACRO_ADMIN_TOKEN=generate_a_long_random_secret
CRON_SECRET=generate_a_different_long_random_secret
```

初始化数据库：

```bash
npm run db:generate
npx prisma migrate dev --name macro-terminal
```

人工覆盖接口为 `POST /api/admin/macro/manual-override`，必须使用 `Authorization: Bearer <MACRO_ADMIN_TOKEN>`。请求体字段包括 `code`、`period`、`value`、`publishedAt`、`source` 和可选的 `revisionReason`；`value` 必须来自官方发布核验，不能使用示例或估算数字。每次变更都会写入 `MacroRevision`，抓取结果记录在 `MacroFetchLog`；上游失败时读取最后有效值并标记 `stale`。

Vercel Cron 已配置在 `vercel.json`：市场利率每 30 分钟、全部序列每日、未来 30 天事件日历每日、重要发布窗口每 15 分钟检查。页面只展示未来 14 天。若部署套餐限制 Cron 频率，可在 GitHub Actions 或其他调度器中以相同路径和 `CRON_SECRET` 调用。

## 免责声明

本网站内容仅用于个人研究、信息分享与学术交流，不构成任何投资建议、证券推荐、收益承诺或交易依据。Hunter 系列指数为个人研究编制的非官方指数，不属于可投资金融产品，也不代表任何实际投资组合。
