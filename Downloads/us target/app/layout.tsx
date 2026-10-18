import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { generateSiteMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateSiteMetadata();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body className='bg-obsidian-900 min-h-screen'>
        <Header />
        <main className='pt-16 md:pt-20'>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
