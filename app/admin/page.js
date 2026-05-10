'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    const response = await fetch('/api/orders');
    const data = await response.json();
    setOrders(data);
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <main>
      <h1>Admin Orders</h1>
      <div className="nav-links">
        <Link href="/">Home</Link>
        <Link href="/menu">Customer Menu</Link>
      </div>

      <button onClick={loadOrders} style={{ margin: '12px 0' }}>
        Refresh Orders
      </button>

      {loading && <p>Loading orders...</p>}

      {!loading && orders.length === 0 && <p>No orders yet.</p>}

      {orders.map((order) => (
        <div key={order.id} className="card">
          <div className="row">
            <strong>Order #{order.id}</strong>
            <span>{new Date(order.createdAt).toLocaleString()}</span>
          </div>
          <p>
            <strong>Customer:</strong> {order.customerName}
          </p>
          <ul>
            {order.items.map((item) => (
              <li key={item.id}>
                {item.name} x {item.quantity} (${(item.price * item.quantity).toFixed(2)})
              </li>
            ))}
          </ul>
          <p>
            <strong>Total:</strong> ${order.total.toFixed(2)}
          </p>
        </div>
      ))}
    </main>
  );
}