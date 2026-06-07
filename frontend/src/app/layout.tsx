import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "sonner";
import { AUTH_ENABLED } from "@/lib/auth";

const CLARITY_PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim() ?? "";

export const metadata: Metadata = {
  title: "TERRAVÉ",
  description: "Evaluacion sensorial de medallones de lenteja",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = (
    <>
      <a
        href="#main-content"
        className="skip-link"
      >
        Saltar al contenido principal
      </a>
      {AUTH_ENABLED && CLARITY_PROJECT_ID ? (
        <Script
          id="microsoft-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");
            `,
          }}
        />
      ) : null}
      {children}
      <Toaster richColors position="top-right" />
    </>
  );

  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full">
        {AUTH_ENABLED ? <ClerkProvider>{content}</ClerkProvider> : content}
      </body>
    </html>
  );
}
