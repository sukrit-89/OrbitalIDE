import type { Stream } from "../types/stream";
import { useTickerBalance } from "../hooks/useTicker";

type TickerBalanceProps = {
  stream: Stream;
  label?: string;
  size?: "hero" | "card";
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value);

export function TickerBalance({ stream, label = "claimable now", size = "hero" }: TickerBalanceProps) {
  const streamBalance = useTickerBalance(stream);

  return (
    <div className="ticker-frame" aria-live="polite">
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-secondary">{label}</span>
      <div
        className={[
          "font-mono font-bold tabular-nums text-primary transition-colors duration-200",
          size === "hero" ? "text-[48px] leading-none sm:text-[74px] lg:text-[92px]" : "text-[28px] leading-none",
        ].join(" ")}
    >
        {formatMoney(streamBalance)}
        <span className={size === "hero" ? "ml-3 text-xl text-flow sm:text-2xl" : "ml-2 text-sm text-flow"}>
          {stream.token}
        </span>
      </div>
    </div>
  );
}
