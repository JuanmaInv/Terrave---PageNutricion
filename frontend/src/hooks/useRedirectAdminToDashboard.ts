"use client";

import { useAuth } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { obtenerPerfilAcceso } from "@/lib/api";
import { AUTH_ENABLED } from "@/lib/auth";

export function useRedirectAdminToDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [isCheckingRedirect, setIsCheckingRedirect] = useState(() => AUTH_ENABLED);

  useEffect(() => {
    if (!AUTH_ENABLED) {
      return;
    }

    let isMounted = true;

    async function maybeRedirectAdmin() {
      if (!isLoaded) {
        if (isMounted) setIsCheckingRedirect(true);
        return;
      }

      if (!isSignedIn) {
        if (isMounted) setIsCheckingRedirect(false);
        return;
      }

      try {
        const token = await getToken();
        const result = await obtenerPerfilAcceso(token ?? undefined);

        if (!isMounted) return;

        if (result?.isAdmin && pathname !== "/administrador") {
          router.replace("/administrador");
          return;
        }

        setIsCheckingRedirect(false);
      } catch {
        if (isMounted) setIsCheckingRedirect(false);
      }
    }

    maybeRedirectAdmin();

    return () => {
      isMounted = false;
    };
  }, [getToken, isLoaded, isSignedIn, pathname, router]);

  return { isCheckingRedirect };
}
