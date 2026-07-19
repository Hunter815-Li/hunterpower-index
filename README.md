# Hunter 电力指数 / Hunter Power Index

面向研究与信息展示的专业电力基础设施指数页面。整体采用深色金融终端风格，包含指数摘要、交互式对比走势图、成分股筛选与排序、CSV 导出、行业贡献、涨跌贡献榜、个股详情以及指数编制说明。

本项目采用 [MIT License](./LICENSE) 开源，任何人都可以使用、修改和分发，但需保留许可证与版权声明。

## 本地运行

需要 Node.js 22.13 或更高版本。

```bash
npm install
npm run dev
```

浏览器访问 `http://localhost:3000`。

生产构建：

```bash
npm run build
npm run start
```

## 行情数据与 API 密钥

项目默认使用可复现的模拟行情，无需任何 API 密钥即可完整预览。模拟数据会明确标注，不代表真实市场表现。

若需接入 Twelve Data：

1. 复制 `.env.example` 为 `.env.local`。
2. 填写 `TWELVE_DATA_API_KEY`。
3. 重启开发服务。

```env
TWELVE_DATA_API_KEY=your_api_key_here
```

服务端会以最多 4 个并发请求获取成分股、SPY 和 QQQ 的日线行情，单次请求超时为 8 秒。单只股票请求失败、代码无效、数据不足或遇到限流时，会记录友好提示并仅对该股票回退到模拟数据。免费套餐可能无法一次覆盖全部成分股，生产环境建议使用支持批量行情的付费套餐或在 `lib/marketData.ts` 中替换数据提供商。

## 指数计算方法

核心逻辑位于 `lib/calculateHunterIndex.ts`。每日等权指数不是直接平均股票涨跌幅，而是：

1. 使用每只股票的复权收盘价；
2. 将每只股票基准日价格标准化为 100；
3. 对同一交易日各股票的标准化价格做等权算术平均；
4. 缺失交易日使用最近有效价格向前填充，上市前不回填；
5. 有效数据不足两条的股票会被排除并产生警告。

公式：`HPI(t) = 1/N × Σ [P(i,t) / P(i,0) × 100]`。

## 主要目录

```text
app/
  api/market-data/route.ts    行情 API
  page.tsx                    页面入口
components/
  IndexSummary.tsx            指数摘要
  IndexChart.tsx              ECharts 对比走势图
  ConstituentTable.tsx        成分股表格与个股详情
  SectorAnalysis.tsx          行业分析
  ContributionRankings.tsx   涨跌贡献榜
lib/
  calculateHunterIndex.ts     等权指数计算
  marketData.ts               行情获取、模拟数据与指标聚合
data/
  constituents.ts             成分股清单
```

## 异常处理

- 客户端加载时展示骨架屏；
- 请求失败或超时时展示错误页和“重新加载”按钮；
- 服务端处理接口超时、限流、无效代码、历史不足、缺失值和非交易日；
- 新上市或不足一年的股票会标记“历史不足”，年度收益显示为空；
- 不配置 API 密钥时自动使用模拟行情。

## 说明

本项目仅用于研究和信息展示，不构成任何投资建议。上线前请复核成分股清单、公司行为调整、数据许可和指数维护规则。
