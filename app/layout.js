import './globals.css';

export const metadata = {
  title: 'QR Ordering MVP',
  description: 'Beginner-friendly QR ordering app built with Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}