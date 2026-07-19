# Hunter 电力指数 / Hunter Power Index

面向非商业研究与信息展示的美国电力基础设施等权指数网站。页面包括指数摘要、一年对比走势图、成分股只读摘要、行业贡献、涨跌贡献榜和指数编制说明。

项目代码采用 [MIT License](./LICENSE) 开源。

## 本地运行

需要 Node.js 22.13 或更高版本。

```bash
npm install
copy .env.example .env.local
npm run dev
```

访问 `http://localhost:3000`。未配置密钥时，开发环境使用明确标注的模拟数据；生产环境不会静默使用模拟行情。

## 每日行情架构

项目使用可切换的 Data Provider Pattern。默认使用 [Market Data](https://www.marketdata.app) 至少延迟一个完整交易日的复权收盘数据，不使用 Yahoo Finance 爬虫。

- 默认数据源：Market Data Daily Candles API
- 备用适配器：Twelve Data、Polygon、Finnhub
- 每个交易日只读取一次约 22 个标的的一年日线
- Market Data 单次日线响应同时产生最新价与历史数据，避免重复消耗 API credits
- 供应商请求使用约 20 小时的 Vercel Data Cache 和实例内存缓存
- Vercel Cron 在北京时间周二至周六 10:00（UTC 02:00）刷新；公开版数据至少延迟一个完整交易日
- 请求超时8秒，失败后自动重试3次并记录结构化日志
- 指数、行业和个股贡献全部在服务器计算，浏览器不计算指数
- 页面不提供 CSV、原始历史下载、个股历史接口或实时 WebSocket
- 对外页面仅展示指数曲线和有限的成分股摘要

## 环境变量

在 [Market Data](https://www.marketdata.app) 注册 Free Forever 账户并复制 API Token。不要把 Token 发给其他人，也不要提交 `.env.local`。

```env
MARKET_DATA_PROVIDER=marketdata
MARKET_DATA_FALLBACKS=twelvedata,polygon
MARKETDATA_TOKEN=your_marketdata_token
CRON_SECRET=generate_a_long_random_secret
ALLOW_MOCK_MARKET_DATA=false
```

部署到 Vercel 时，在 **Project Settings → Environment Variables** 添加以上变量，环境选择 Production，然后 Redeploy。`CRON_SECRET` 建议使用至少 32 位的随机字符串；Vercel 会自动将它作为 Bearer Token 发送给 Cron Route。

如已有其他供应商的历史日线权限，可以设置对应密钥并切换：

```env
MARKET_DATA_PROVIDER=twelvedata
TWELVE_DATA_API_KEY=your_key
```

## 指数计算方法

核心逻辑位于 `lib/calculateHunterIndex.ts`。每日等权指数不是直接平均股票涨跌幅，而是：

1. 使用每只股票的复权收盘价；
2. 将每只股票基准日价格标准化为100；
3. 对同一交易日各股票的标准化价格做等权算术平均；
4. 缺失交易日使用最近有效价格向前填充，上市前不回填；
5. 有效数据不足两条的股票会被排除并产生警告。

公式：`HPI(t) = 1/N × Σ [P(i,t) / P(i,0) × 100]`。

## 主要目录

```text
app/page.tsx                              服务端页面与每日再验证
app/api/cron/refresh-market-data/         受保护的每日刷新任务
components/                               页面组件
data/constituents.ts                      成分股清单
lib/calculateHunterIndex.ts               等权指数计算
lib/marketData.ts                         服务端行情聚合与衍生数据
lib/market-data/providers/marketDataApp.ts Market Data 日线适配器
lib/market-data/providers/                可切换供应商适配器
vercel.json                               每日 Cron 配置
```

## 数据许可与免责声明

历史 EOD 数据由 [Market Data](https://www.marketdata.app) 提供。免费公开版本仅用于非商业研究和教育展示，至少延迟一个完整交易日；请同时遵守供应商的 [Public Use Terms](https://www.marketdata.app/terms/public-use/)。不得将本项目改造成原始行情下载、机器可读数据分发或商业数据服务，除非另行取得相应许可。

本指数仅用于研究和信息展示，不构成任何投资建议。
