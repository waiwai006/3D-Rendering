import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HK Property Design",
  description: "Find, edit and explore Hong Kong property floor plans in 3D.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
