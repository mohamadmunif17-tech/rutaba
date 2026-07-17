import "./globals.css";

export const metadata = {
  title: "Rihlah Hafalan — RUTABA SHOHIBUL QUR'AN",
  description: "Sistem penjadwalan & pemantauan target hafalan Rumah Tahfidz Balita",
  icons: { icon: "/logo.png" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
