import type { Metadata, Viewport } from "next";
import { Manrope, Unbounded } from "next/font/google";
import "./globals.css";

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Settle",
  description: "Розкажи все, що в голові. Ми складемо план на день.",
};

// iOS Safari can leave `position: fixed` elements (like the Capture drawer's
// overlay) visually detached from the viewport after the on-screen keyboard
// opens/closes, because by default the keyboard only shrinks the *visual*
// viewport while the layout viewport (which fixed elements are positioned
// against) stays unchanged. `resizes-content` makes the keyboard resize the
// layout viewport too, so fixed positioning stays correct.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uk"
      className={`${unbounded.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-bg-base text-text-primary">
        {children}
      </body>
    </html>
  );
}
