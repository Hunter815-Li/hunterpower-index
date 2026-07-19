# Hunter 电力指数 / Hunter Power Index

面向研究与信息展示的专业电力基础设施指数网站。页面包括指数摘要、交互式对比走势图、成分股筛选与 CSV 导出、行业贡献、涨跌贡献榜、个股详情和指数编制说明。

项目采用 [MIT License](./LICENSE) 开源。

## 本地运行

需要 Node.js 22.13 或更高版本。

```bash
npm install
copy .env.example .env.local
npm run dev
```

访问 `http://localhost:3000`。没有 API Key 时，仅在开发环境使用明确标注的模拟数据；生产环境不会静默使用模拟行情。

## 行情数据架构

项目使用 Data Provider Pattern，浏览器只请求本站的 Next.js API Route，不会直接连接或暴露任何第三方行情 API Key。

- 默认供应商：Finnhub
- 备用供应商：Polygon、Twelve Data
- REST 行情：`/api/market-data`
- 服务端实时通道：供应商 WebSocket → `/api/market-data/stream` → 浏览器 SSE
- 同一服务器实例共享一条供应商 WebSocket，多个访客不会重复建立上游连接
- 浏览器每30秒刷新一次完整快照
- 美股开盘时启用服务端 WebSocket；收盘后使用 REST
- 报价缓存10秒，历史数据缓存15分钟
- 请求超时8秒，失败后自动重试3次并输出结构化日志
- 指数、行业和个股贡献全部在服务器计算；浏览器仅展示服务器结果
- 单只股票无效或历史不足时会记录警告并跳过，不会让整页行情崩溃

### 环境变量

复制 `.env.example` 为 `.env.local`，至少配置 Finnhub：

```env
MARKET_DATA_PROVIDER=finnhub
MARKET_DATA_FALLBACKS=polygon,twelvedata
FINNHUB_API_KEY=your_finnhub_key
POLYGON_API_KEY=
TWELVE_DATA_API_KEY=
ALLOW_MOCK_MARKET_DATA=false
```

不要提交 `.env.local`。部署到 Vercel 时，在 Project Settings → Environment Variables 中配置相同变量，然后重新部署。

### 切换供应商

只需修改一个环境变量并重新部署：

```env
MARKET_DATA_PROVIDER=polygon
```

或：

```env
MARKET_DATA_PROVIDER=twelvedata
```

即使主供应商不可用，系统也会在完成3次重试后，按照 `MARKET_DATA_FALLBACKS` 自动尝试已配置密钥的备用供应商。

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
app/api/market-data/            REST 与实时流 API
components/                     页面组件
data/constituents.ts            成分股清单
lib/calculateHunterIndex.ts     等权指数计算
lib/marketData.ts               服务端行情聚合与指数快照
lib/market-data/providers/      Finnhub、Polygon、Twelve Data Provider
lib/market-data/cache.ts        10秒内存缓存与请求合并
lib/market-data/http.ts         超时、重试与日志
```

## 说明

本项目仅用于研究和信息展示，不构成任何投资建议。生产使用前请确认所选行情套餐支持所需的实时、历史和 WebSocket 权限，并遵守供应商的数据展示许可。
