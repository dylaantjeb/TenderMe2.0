import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'TenderMe — AI Tender Platform',
    template: '%s | TenderMe',
  },
  description:
    'Enterprise AI platform voor het genereren van score-geoptimaliseerde EMVI/BPKV inschrijvingen. De AI-equivalent van een professionele tenderafdeling.',
  keywords: [
    'tender',
    'aanbesteding',
    'EMVI',
    'BPKV',
    'AI',
    'procurement',
    'gunningscriteria',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
