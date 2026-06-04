"use client";

import { Info } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface AdminInfoTooltipProps {
  content: string;
  label: string;
}

export function AdminInfoTooltip({ content, label }: AdminInfoTooltipProps) {
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [placement, setPlacement] = useState({
    vertical: "bottom" as "top" | "bottom",
    horizontal: "right" as "left" | "right" | "center",
  });

  useEffect(() => {
    const syncViewport = () => setIsMobile(window.innerWidth < 640);

    syncViewport();
    window.addEventListener("resize", syncViewport);

    return () => {
      window.removeEventListener("resize", syncViewport);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const updatePlacement = () => {
      const button = buttonRef.current;
      if (!button) return;

      const buttonRect = button.getBoundingClientRect();
      const margin = 12;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const estimatedTooltipHeight = 96;

      const vertical =
        buttonRect.bottom + estimatedTooltipHeight <= viewportHeight - margin ? "bottom" : "top";

      const horizontal =
        viewportWidth < 640
          ? "center"
          : buttonRect.left < viewportWidth / 2
            ? "left"
            : "right";

      setPlacement({ vertical, horizontal });
    };

    updatePlacement();
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);

    return () => {
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const baseTooltipClasses =
    "z-50 rounded-2xl border border-[color:var(--surface-border)]/55 bg-card px-3 py-2 text-left text-xs leading-relaxed text-[color:var(--surface-title)] shadow-[var(--shadow-card)] transition duration-200";

  const desktopTooltipClasses = `${
    open
      ? "translate-y-0 opacity-100"
      : placement.vertical === "bottom"
        ? "-translate-y-1 opacity-0"
        : "translate-y-1 opacity-0"
  } ${
    placement.vertical === "bottom"
      ? "top-[calc(100%+0.55rem)]"
      : "bottom-[calc(100%+0.55rem)]"
  } ${
    placement.horizontal === "center"
      ? "left-1/2 -translate-x-1/2"
      : placement.horizontal === "left"
        ? "left-0"
        : "right-0"
  } pointer-events-none absolute w-64 max-w-64`;

  const mobileTooltipClasses = `${
    open ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
  } pointer-events-none absolute right-0 top-[calc(100%+0.55rem)] w-[min(14rem,calc(100vw-3rem))] max-w-[14rem]`;

  return (
    <span ref={rootRef} className="relative inline-flex shrink-0">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((current) => !current)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="grid h-6 w-6 place-items-center rounded-full border border-border/70 bg-background/80 text-[color:var(--surface-title)] transition hover:border-[color:var(--pumpkin)]/40 hover:text-[color:var(--pumpkin)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--pumpkin)]/35"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      <span
        role="tooltip"
        className={`${baseTooltipClasses} ${
          isMobile ? mobileTooltipClasses : desktopTooltipClasses
        }`}
        style={{ overflowWrap: "anywhere", whiteSpace: "normal" }}
      >
        {content}
      </span>
    </span>
  );
}
