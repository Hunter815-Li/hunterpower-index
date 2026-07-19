import { NextResponse } from "next/server";
import {
  getMarketSnapshot,
  getRealtimeProvider,
  recordRealtimeTrade,
  toRealtimeMarketUpdate,
} from "@/lib/marketData";
import { subscribeSharedRealtime } from "@/lib/market-data/realtimeHub";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  try {
    const { provider, marketStatus, tickers } = await getRealtimeProvider();
    if (marketStatus.session !== "open" || !provider.supportsWebSocket || !provider.subscribe) {
      return NextResponse.json({ message: "美股当前未开盘，实时通道已切换为 REST" }, { status: 409 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let disposed = false;
        let emitting = false;
        let scheduled: ReturnType<typeof setTimeout> | undefined;
        let cleanup = () => {};

        const send = (event: string, payload: unknown) => {
          if (!disposed) controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`));
        };
        const emitServerCalculation = async () => {
          if (disposed || emitting) return;
          emitting = true;
          try {
            const snapshot = await getMarketSnapshot({ bypassCache: true });
            send("market-update", toRealtimeMarketUpdate(snapshot));
          } catch (error) {
            send("upstream-error", { message: error instanceof Error ? error.message : "实时行情计算失败" });
          } finally {
            emitting = false;
          }
        };
        const scheduleCalculation = () => {
          if (scheduled || disposed) return;
          scheduled = setTimeout(() => {
            scheduled = undefined;
            void emitServerCalculation();
          }, 1_000);
        };

        send("connected", { provider: provider.name, checkedAt: marketStatus.checkedAt });
        await emitServerCalculation();
        const unsubscribe = subscribeSharedRealtime(
          provider,
          tickers,
          (trade) => {
            recordRealtimeTrade(provider.name, trade);
            scheduleCalculation();
          },
          () => {
            send("upstream-error", { message: "实时行情通道暂时不可用，页面仍会每30秒通过 REST 更新" });
          },
        );
        const heartbeat = setInterval(() => {
          if (!disposed) controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
        }, 15_000);
        const sessionCheck = setInterval(async () => {
          const status = await provider.getMarketStatus().catch(() => ({ session: "closed" as const, checkedAt: new Date().toISOString() }));
          if (status.session === "closed") {
            send("market-closed", status);
            cleanup();
            controller.close();
          }
        }, 30_000);
        cleanup = () => {
          if (disposed) return;
          disposed = true;
          if (scheduled) clearTimeout(scheduled);
          clearInterval(heartbeat);
          clearInterval(sessionCheck);
          unsubscribe();
        };
        request.signal.addEventListener("abort", cleanup, { once: true });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "实时行情通道不可用" }, { status: 503 });
  }
}
