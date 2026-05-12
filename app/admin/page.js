'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const statuses = ['pending', 'preparing', 'ready'];

const statusLabels = {
  pending: 'Pending',
  preparing: 'Preparing',
  ready: 'Ready',
};

export default function AdminPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [message, setMessage] = useState('');

  async function loadOrders() {
    const response = await fetch('/api/orders');
    const data = await response.json();
    setOrders(data);
    setLoading(false);
  }

  async function updateStatus(orderId, status) {
    setMessage('');
    setUpdatingOrderId(orderId);

    try {
      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || 'Could not update order status.');
      } else {
        setOrders((currentOrders) =>
          currentOrders.map((order) => (order.id === orderId ? data : order))
        );
      }
    } catch {
      setMessage('Network error. Please try again.');
    } finally {
      setUpdatingOrderId(null);
    }
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

      {message && <p>{message}</p>}

      {loading && <p>Loading orders...</p>}

      {!loading && orders.length === 0 && <p>No orders yet.</p>}

      {orders.map((order) => {
        const currentStatus = order.status || 'pending';

        return (
          <div key={order.id} className="card">
            <div className="row">
              <strong>Order #{order.id}</strong>
              {order.createdAt && <span>{new Date(order.createdAt).toLocaleString()}</span>}
            </div>
            <p>
              <strong>Status:</strong> <span className="badge">{statusLabels[currentStatus]}</span>
            </p>
            <p>
              <strong>Table ID:</strong> {order.tableId || order.tableNumber || 'Not selected'}
            </p>
            <p>
              <strong>Customer:</strong> {order.customerName}
            </p>
            <ul>
              {order.items.map((item) => (
                <li key={item.cartKey || item.id}>
                  {item.name} x {item.quantity} (${(item.price * item.quantity).toFixed(2)})
                  {item.optionSummary && <div>{item.optionSummary}</div>}
                </li>
              ))}
            </ul>
            <p>
              <strong>Total:</strong> ${order.total.toFixed(2)}
            </p>
            {order.note && (
              <div>
                <strong>Order note:</strong>
                <p>{order.note}</p>
              </div>
            )}

            <label htmlFor={`status-${order.id}`}>Update status:</label>
            <select
              id={`status-${order.id}`}
              value={currentStatus}
              onChange={(event) => updateStatus(order.id, event.target.value)}
              disabled={updatingOrderId === order.id}
              style={{ display: 'block', padding: '8px', marginTop: '8px' }}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </main>
  );
}
