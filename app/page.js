import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <div className="card">
        <h1>QR Ordering MVP</h1>
        <p>This is a beginner-friendly demo app.</p>
        <p>Use the links below to try the customer and admin pages.</p>
        <div className="nav-links">
          <Link href="/menu">Customer Menu</Link>
          <Link href="/admin">Admin Orders</Link>
        </div>
      </div>
    </main>
  );
}