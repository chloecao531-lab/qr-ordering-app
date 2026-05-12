'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const statusLabels = {
  pending: 'Order received',
  preparing: 'Preparing your food',
  ready: 'Ready',
};

export default function OrderPage({ params }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [autoRefreshError, setAutoRefreshError] = useState('');

  async function loadOrder(showLoading = true) {
    setMessage('');
    if (showLoading) {
      setLoading(true);
    }

    try {
      const response = await fetch(`/api/orders/${params.id}`);
      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || 'Could not load order.';
        if (showLoading) {
          setMessage(errorMessage);
          setOrder(null);
        } else {
          setAutoRefreshError(errorMessage);
        }
      } else {
        setOrder(data);
        setAutoRefreshError('');
      }
    } catch {
      if (showLoading) {
        setMessage('Network error. Please try again.');
        setOrder(null);
      } else {
        setAutoRefreshError('Automatic status refresh failed.');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    loadOrder();
  }, []);

  useEffect(() => {
    if (!order || order.status === 'ready') {
      return;
    }

    const intervalId = setInterval(() => {
      loadOrder(false);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [order?.status]);

  const tableQuery = order?.tableNumber ? `?table=${encodeURIComponent(order.tableNumber)}` : '';
  const statusText = order ? statusLabels[order.status] || order.status : '';

  return (
    <main>
      <h1>Order Status</h1>
      <div className="nav-links">
        <Link href="/">Home</Link>
        <Link href={`/menu${tableQuery}`}>Add more items</Link>
      </div>

      {loading && <p>Loading order...</p>}

      {!loading && message && <p>{message}</p>}

      {!loading && order && (
        <div className="card">
          <div className="row">
            <strong>Order #{order.id}</strong>
            <span className="badge">{statusText}</span>
          </div>

          <p>
            <strong>Table:</strong> {order.tableId || order.tableNumber || 'Not selected'}
          </p>
          <p>
            <strong>Name:</strong> {order.customerName}
          </p>
          <p>
            <strong>Status:</strong> {statusText}
          </p>

          {order.status === 'ready' ? (
            <p>Your order is ready.</p>
          ) : (
            <p>Status updates automatically every 5 seconds.</p>
          )}

          {autoRefreshError && <p>{autoRefreshError}</p>}

          {order.note && (
            <div>
              <strong>Order note:</strong>
              <p>{order.note}</p>
            </div>
          )}

          <h2>Items</h2>
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

          <div className="row">
            <button onClick={loadOrder}>Refresh Status</button>
            <button disabled>Online payment coming soon</button>
          </div>
        </div>
      )}
    </main>
  );
}
