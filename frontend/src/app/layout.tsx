import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Toaster } from "sonner";

const TEST_AUTH_MODE = process.env.NEXT_PUBLIC_E2E_AUTH_MODE === "true";

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
      {children}
      <Toaster richColors position="top-right" />
    </>
  );

  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full">
        {TEST_AUTH_MODE ? content : <ClerkProvider>{content}</ClerkProvider>}
      </body>
    </html>
  );
}
