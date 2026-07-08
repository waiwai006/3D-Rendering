import type { Metadata } from "next";
import packageInfo from "../package.json";
import "./globals.css";

export const metadata: Metadata = {
  title: "HK Property Design",
  description: "Find, edit and explore Hong Kong property floor plans in 3D.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [major = "0", minor = "1"] = packageInfo.version.split(".");
  const version = `${major}.${minor}`;

  return (
    <html lang="en">
      <body>
        {children}
        <div className="version-badge" title={`HK Property Design version ${version}`}>
          v{version}
        </div>
      </body>
    </html>
  );
}
