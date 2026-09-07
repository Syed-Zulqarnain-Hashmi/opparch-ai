import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { ModuleProvider } from "@/lib/module-context";

export const metadata: Metadata = {
  title: "OPPARCH AI — AI Opportunity Intelligence Platform",
  description:
    "AI-Powered Opportunity Intelligence Platform for Global Business Discovery, Digital Auditing, Lead Intelligence, and Real-Time Crypto Market Analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className="min-h-screen antialiased flex flex-col font-sans transition-colors duration-200"
        style={{
          backgroundColor: "var(--background)",
          color: "var(--text-primary)",
        }}
      >
        <AuthProvider>
          <ThemeProvider>
            <ModuleProvider>
              <Header />
              <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main
                  className="flex-1 overflow-y-auto p-4 sm:p-6"
                  style={{
                    backgroundColor: "var(--background)",
                  }}
                >
                  <div className="max-w-7xl mx-auto space-y-6 pb-12">
                    {children}
                  </div>
                </main>
              </div>
            </ModuleProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
