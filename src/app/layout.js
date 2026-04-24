import "./globals.css";

export const metadata = {
  title: "Vokabeltrainer — Karteikarten",
  description: "Lerne Vokabeln mit dem Leitner-Karteikasten-System. Importiere deine eigenen Vokabellisten und trainiere effizient.",
};

import { ToastProvider } from '@/components/ToastProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ToastProvider>
          <div id="app">
            {children}
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
