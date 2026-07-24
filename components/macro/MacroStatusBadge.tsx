import type { MacroDataStatus } from "@/lib/macro/types";
import { BilingualText } from "@/components/ui/BilingualText";

const labels: Record<MacroDataStatus, { zh: string; en: string }> = {
  fresh: { zh: "最新", en: "FRESH" },
  stale: { zh: "已延迟", en: "STALE" },
  pending: { zh: "等待更新", en: "PENDING" },
  unavailable: { zh: "数据不可用", en: "UNAVAILABLE" },
  error: { zh: "数据错误", en: "ERROR" },
};

export function MacroStatusBadge({ status }: { status: MacroDataStatus }) {
  return <span className={`macro-status macro-status-${status}`}><BilingualText {...labels[status]} /></span>;
}
