import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'feelings — 生育環境×感情特性 分析',
  description:
    '年齢区分ごとの生育環境から、現在の感情特性 (強度・感度・持続) を推定するセルフ分析ツール。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="dark">
      <body className="bg-ink-900 text-ink-100 font-sans antialiased min-h-screen">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
          <header className="mb-8 sm:mb-12 flex items-center justify-between gap-3">
            <a href="/" className="inline-flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emotion-fear" />
              <span className="text-sm tracking-widest text-ink-300 uppercase">
                feelings
              </span>
            </a>
            <a
              href="/actions"
              className="text-xs tracking-widest text-ink-400 uppercase hover:text-ink-100 transition"
            >
              保存した提案
            </a>
          </header>
          <main>{children}</main>
          <footer className="mt-16 pt-8 border-t border-ink-700 text-xs text-ink-400">
            これは医療・心理診断ではありません。セルフリフレクションのための簡易モデルです。
          </footer>
        </div>
      </body>
    </html>
  );
}
