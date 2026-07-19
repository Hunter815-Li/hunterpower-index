import type { MarketDataProvider, ProviderTrade } from "@/lib/market-data/types";

interface RealtimeListener {
  onTrade: (trade: ProviderTrade) => void;
  onError: (error: Error) => void;
}

interface HubState {
  listeners: Set<RealtimeListener>;
  symbols: string[];
  stopUpstream?: () => void;
  reconnectTimer?: ReturnType<typeof setTimeout>;
  shutdownTimer?: ReturnType<typeof setTimeout>;
}

declare global {
  // One upstream socket per provider and server instance. This survives Next.js
  // hot reloads and lets many browser SSE clients share the same connection.
  var __hunterRealtimeHubs: Map<string, HubState> | undefined;
}

const hubs = globalThis.__hunterRealtimeHubs ?? new Map<string, HubState>();
globalThis.__hunterRealtimeHubs = hubs;

function reportConnectionError(provider: MarketDataProvider, state: HubState, error: Error) {
  console.error(JSON.stringify({
    level: "error",
    event: "market_websocket_error",
    provider: provider.name,
    message: error.message,
    timestamp: new Date().toISOString(),
  }));
  state.listeners.forEach((listener) => listener.onError(error));

  state.stopUpstream?.();
  state.stopUpstream = undefined;
  if (!state.reconnectTimer && state.listeners.size > 0) {
    state.reconnectTimer = setTimeout(() => {
      state.reconnectTimer = undefined;
      connectUpstream(provider, state);
    }, 5_000);
  }
}

function connectUpstream(provider: MarketDataProvider, state: HubState) {
  if (state.stopUpstream || state.listeners.size === 0 || !provider.subscribe) return;
  try {
    state.stopUpstream = provider.subscribe(
      state.symbols,
      (trade) => state.listeners.forEach((listener) => listener.onTrade(trade)),
      (error) => reportConnectionError(provider, state, error),
    );
  } catch (error) {
    reportConnectionError(provider, state, error instanceof Error ? error : new Error("WebSocket 连接失败"));
  }
}

export function subscribeSharedRealtime(
  provider: MarketDataProvider,
  tickers: string[],
  onTrade: (trade: ProviderTrade) => void,
  onError: (error: Error) => void,
) {
  if (!provider.subscribe) throw new Error(`${provider.label} 不支持 WebSocket`);
  const symbols = [...new Set(tickers)].sort();
  const key = provider.name;
  let state = hubs.get(key);
  if (!state) {
    state = { listeners: new Set(), symbols };
    hubs.set(key, state);
  }

  if (state.symbols.join(",") !== symbols.join(",")) {
    state.stopUpstream?.();
    state.stopUpstream = undefined;
    state.symbols = symbols;
  }
  if (state.shutdownTimer) {
    clearTimeout(state.shutdownTimer);
    state.shutdownTimer = undefined;
  }

  const listener = { onTrade, onError };
  state.listeners.add(listener);
  connectUpstream(provider, state);

  return () => {
    state?.listeners.delete(listener);
    if (!state || state.listeners.size > 0 || state.shutdownTimer) return;
    state.shutdownTimer = setTimeout(() => {
      state?.stopUpstream?.();
      if (state?.reconnectTimer) clearTimeout(state.reconnectTimer);
      hubs.delete(key);
    }, 15_000);
  };
}
