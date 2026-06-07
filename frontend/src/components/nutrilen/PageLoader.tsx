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
        <div className="nutri-loader-motion relative">
          <span
            className="nutri-loader-orbit absolute inset-0 -m-4 rounded-full opacity-55"
            style={{
              background:
                "conic-gradient(from 0deg, var(--moss), var(--orange-yellow), var(--pumpkin), var(--vandyke), var(--moss))",
              animation: "nutri-orbit 2.3s linear infinite",
              filter: "blur(7px)",
            }}
          />
          <span
            className="nutri-loader-spin absolute inset-0 -m-3 rounded-full opacity-65"
            style={{
              background:
                "conic-gradient(from 0deg, var(--moss), var(--pumpkin), var(--orange-yellow), var(--moss))",
              animation: "nutri-spin 1.15s linear infinite",
              filter: "blur(1.8px)",
            }}
          />
          <span
            className="nutri-loader-pulse absolute inset-0 -m-1 rounded-full bg-[color:var(--moss)]/20"
            style={{ animation: "nutri-pulse 1.8s ease-in-out infinite" }}
          />
          <span
            className="nutri-loader-float relative grid h-16 w-16 place-items-center rounded-full bg-[color:var(--vandyke)] text-[color:var(--cream)] shadow-[var(--shadow-soft)]"
            style={{ animation: "nutri-float 2.1s ease-in-out infinite" }}
          >
            <TerraveMark className="h-9 w-9" strokeWidth={2.4} />
          </span>
        </div>
        <p className="font-serif text-xl font-semibold tracking-[0.32em] text-[color:var(--vandyke)]">
          TERRAVÉ
        </p>
        <div className="flex gap-1.5">
          <span
            className="nutri-loader-dot h-1.5 w-1.5 rounded-full bg-[color:var(--moss)]"
            style={{ animation: "loader-dot 1s ease-in-out infinite", animationDelay: "0ms" }}
          />
          <span
            className="nutri-loader-dot h-1.5 w-1.5 rounded-full bg-[color:var(--vandyke)]"
            style={{ animation: "loader-dot 1s ease-in-out infinite", animationDelay: "180ms" }}
          />
          <span
            className="nutri-loader-dot h-1.5 w-1.5 rounded-full bg-[color:var(--pumpkin)]"
            style={{ animation: "loader-dot 1s ease-in-out infinite", animationDelay: "360ms" }}
          />
        </div>
      </div>
      <style>{`
        @keyframes nutri-spin { to { transform: rotate(360deg); } }
        @keyframes nutri-orbit {
          0% { transform: rotate(0deg) scale(1); opacity: 0.5; }
          50% { transform: rotate(180deg) scale(1.04); opacity: 0.75; }
          100% { transform: rotate(360deg) scale(1); opacity: 0.5; }
        }
        @keyframes nutri-pulse {
          0%, 100% { transform: scale(0.92); opacity: 0.22; }
          50% { transform: scale(1.08); opacity: 0.42; }
        }
        @keyframes nutri-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-3px) scale(1.02); }
        }
        @keyframes loader-dot {
          0%, 100% { transform: scale(0.72); opacity: 0.35; }
          45% { transform: scale(1.45); opacity: 1; }
          70% { transform: scale(0.95); opacity: 0.72; }
        }
      `}</style>
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
