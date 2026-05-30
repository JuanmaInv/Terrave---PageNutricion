"use client";

import { useEffect, useState } from "react";

export function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = performance.now();

    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return val;
}
