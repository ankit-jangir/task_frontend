import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata = {
  title: "Meeting Rooms",
  description: "Internal meeting room booking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-full bg-neutral-50 text-neutral-900 antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#fff",
              color: "#171717",
              border: "1px solid #e5e5e5",
            },
          }}
        />
      </body>
    </html>
  );
}
