import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Harbour Home Planner",
  description: "Recreate and explore your Hong Kong home in 3D.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
