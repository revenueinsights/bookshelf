// app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import NextAuthSessionProvider from '@/components/providers/SessionProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'BookShelf - Book Inventory Management',
  description: 'Track book market values and organize your inventory',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthSessionProvider>
          {children}
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}