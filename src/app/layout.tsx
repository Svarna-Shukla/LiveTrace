import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LiveTrace — Real-Time Execution Visualizer",
  description: "Real-time, interactive execution tracing canvas for web application request flows.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
