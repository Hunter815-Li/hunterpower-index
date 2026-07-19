export interface Constituent {
  ticker: string;
  companyName: string;
  chineseName: string;
  sector: string;
  weight: number;
}

export const constituents: Constituent[] = [
  { ticker: "GEV", companyName: "GE Vernova Inc.", chineseName: "通用电气维诺瓦", sector: "电力设备", weight: 0.05 },
  { ticker: "ETN", companyName: "Eaton Corporation plc", chineseName: "伊顿", sector: "电力设备", weight: 0.05 },
  { ticker: "HUBB", companyName: "Hubbell Incorporated", chineseName: "哈贝尔", sector: "电网设备", weight: 0.05 },
  { ticker: "PWR", companyName: "Quanta Services, Inc.", chineseName: "广达服务", sector: "电网建设", weight: 0.05 },
  { ticker: "POWL", companyName: "Powell Industries, Inc.", chineseName: "鲍威尔工业", sector: "电网设备", weight: 0.05 },
  { ticker: "VRT", companyName: "Vertiv Holdings Co", chineseName: "维谛技术", sector: "数据中心电力", weight: 0.05 },
  { ticker: "CEG", companyName: "Constellation Energy", chineseName: "星座能源", sector: "核能与发电", weight: 0.05 },
  { ticker: "VST", companyName: "Vistra Corp.", chineseName: "维斯特拉能源", sector: "核能与发电", weight: 0.05 },
  { ticker: "NEE", companyName: "NextEra Energy, Inc.", chineseName: "新纪元能源", sector: "公用事业", weight: 0.05 },
  { ticker: "DUK", companyName: "Duke Energy Corporation", chineseName: "杜克能源", sector: "公用事业", weight: 0.05 },
  { ticker: "SO", companyName: "The Southern Company", chineseName: "南方电力", sector: "公用事业", weight: 0.05 },
  { ticker: "EXC", companyName: "Exelon Corporation", chineseName: "爱克斯龙电力", sector: "公用事业", weight: 0.05 },
  { ticker: "AEP", companyName: "American Electric Power", chineseName: "美国电力", sector: "公用事业", weight: 0.05 },
  { ticker: "XEL", companyName: "Xcel Energy Inc.", chineseName: "埃克西尔能源", sector: "公用事业", weight: 0.05 },
  { ticker: "NRG", companyName: "NRG Energy, Inc.", chineseName: "NRG能源", sector: "独立发电商", weight: 0.05 },
  { ticker: "BWXT", companyName: "BWX Technologies, Inc.", chineseName: "BWX技术", sector: "核能设备", weight: 0.05 },
  { ticker: "SMR", companyName: "NuScale Power Corporation", chineseName: "纽斯凯尔电力", sector: "先进核能", weight: 0.05 },
  { ticker: "OKLO", companyName: "Oklo Inc.", chineseName: "奥克洛", sector: "先进核能", weight: 0.05 },
  { ticker: "FLNC", companyName: "Fluence Energy, Inc.", chineseName: "弗鲁恩斯能源", sector: "储能", weight: 0.05 },
  { ticker: "STEM", companyName: "Stem, Inc.", chineseName: "Stem智能储能", sector: "储能", weight: 0.05 },
];

export const sectors = Array.from(new Set(constituents.map((item) => item.sector)));
