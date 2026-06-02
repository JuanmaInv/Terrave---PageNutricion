import { useCallback, useState } from "react";
import { TerraveMark } from "./TerraveMark";

export function PageLoader({ show }: { show: boolean }) {
  return (
    <div
      className={`fixed inset-0 z-[100] grid place-items-center bg-background/85 backdrop-blur-sm transition-opacity duration-300 ${
        show ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!show}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <span
            className="absolute inset-0 -m-3 rounded-full opacity-60"
            style={{
              background:
                "conic-gradient(from 0deg, var(--moss), var(--pumpkin), var(--orange-yellow), var(--moss))",
              animation: "nutri-spin 1.1s linear infinite",
              filter: "blur(2px)",
            }}
          />
          <span className="relative grid h-16 w-16 place-items-center rounded-full bg-[color:var(--vandyke)] text-[color:var(--cream)] shadow-[var(--shadow-soft)]">
            <TerraveMark className="h-9 w-9" strokeWidth={2.4} />
          </span>
        </div>
        <p className="font-serif text-xl font-semibold tracking-[0.32em] text-[color:var(--vandyke)]">
          TERRAVÉ
        </p>
        <div className="flex gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--moss)]" style={{ animationDelay: "0ms" }} />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--pumpkin)]" style={{ animationDelay: "150ms" }} />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--orange-yellow)]" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
      <style>{`@keyframes nutri-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function useNavLoader(duration = 1200) {
  const [show, setShow] = useState(false);
  const run = useCallback(
    (action?: () => void) => {
      setShow(true);
      window.setTimeout(() => {
        action?.();
        setShow(false);
      }, duration);
    },
    [duration],
  );
  return { show, run, setShow };
}
