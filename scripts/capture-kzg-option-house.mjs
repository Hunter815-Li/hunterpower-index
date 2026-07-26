import { mkdir, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { chromium } from "playwright";

const sourceUrl = process.env.KZG_SOURCE_URL ?? "https://kzg-option-house.netlify.app/";
const root = resolve(import.meta.dirname, "..");
const outputPath = resolve(root, "public/data/kzg-option-daily.png");
const temporaryPath = `${outputPath}.tmp`;
const metadataPath = resolve(root, "public/data/kzg-option-daily.json");

await mkdir(dirname(outputPath), { recursive: true });

const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1900 },
    deviceScaleFactor: 1,
    colorScheme: "light",
    locale: "zh-CN",
    timezoneId: "Asia/Shanghai",
  });

  await page.goto(sourceUrl, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => undefined);
  await page.waitForTimeout(5_000);

  const title = page.getByText(/美股期权分钟数据/).first();
  await title.waitFor({ state: "visible", timeout: 30_000 });

  const targetHandle = await title.evaluateHandle((node) => {
    const requiredText = ["三大指数期权数据", "全市场日内成交分布", "日内成交分布"];
    let current = node.parentElement;
    let fallback = node.parentElement;

    while (current && current !== document.body) {
      const text = current.innerText ?? "";
      const rect = current.getBoundingClientRect();

      if (requiredText.every((item) => text.includes(item))) {
        fallback = current;
        if (rect.width >= 650 && rect.width <= 1300 && rect.height >= 650) {
          return current;
        }
      }

      current = current.parentElement;
    }

    return fallback;
  });

  const target = targetHandle.asElement();
  if (!target) {
    throw new Error("KZG report container could not be located.");
  }

  const text = await target.innerText();
  if (!text.includes("三大指数期权数据") || !text.includes("日内成交分布")) {
    throw new Error("KZG report validation failed; the page structure may have changed.");
  }

  await target.screenshot({
    path: temporaryPath,
    type: "png",
    animations: "disabled",
  });

  const heading = (await title.textContent()) ?? "";
  const match = heading.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  const dataDate = match
    ? `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`
    : new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai" }).format(new Date());
  const capturedAt = new Date().toISOString();

  await rename(temporaryPath, outputPath);
  await writeFile(
    metadataPath,
    `${JSON.stringify({
      status: "success",
      sourceName: "KZG Option House",
      sourceUrl,
      dataDate,
      capturedAt,
      imagePath: "/data/kzg-option-daily.png",
      note: "Automatically captured from the public source page.",
    }, null, 2)}\n`,
    "utf8",
  );

  console.log(`KZG snapshot updated for ${dataDate} at ${capturedAt}.`);
} finally {
  await browser.close();
}
