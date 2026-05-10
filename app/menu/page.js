'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

export default function MenuPage() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState({});
  const [customerName, setCustomerName] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadMenu() {
      const response = await fetch('/api/menu');
      const data = await response.json();
      setMenu(data);
    }

    loadMenu();
  }, []);

  function addToCart(item) {
    setCart((currentCart) => {
      const quantity = currentCart[item.id]?.quantity || 0;
      return {
        ...currentCart,
        [item.id]: {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: quantity + 1,
        },
      };
    });
  }

  function removeFromCart(itemId) {
    setCart((currentCart) => {
      const item = currentCart[itemId];
      if (!item) return currentCart;

      if (item.quantity === 1) {
        const newCart = { ...currentCart };
        delete newCart[itemId];
        return newCart;
      }

      return {
        ...currentCart,
        [itemId]: {
          ...item,
          quantity: item.quantity - 1,
        },
      };
    });
  }

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const total = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  async function submitOrder() {
    setMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName, items: cartItems }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || 'Could not submit order.');
      } else {
        setMessage('Order submitted successfully!');
        setCart({});
        setCustomerName('');
      }
    } catch {
      setMessage('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main>
      <h1>Customer Menu</h1>
      <div className="nav-links">
        <Link href="/">Home</Link>
        <Link href="/admin">Admin Orders</Link>
      </div>

      <h2>Menu Items</h2>
      {menu.map((item) => (
        <div key={item.id} className="card row">
          <div>
            <strong>{item.name}</strong>
            <div>${item.price.toFixed(2)}</div>
          </div>
          <button onClick={() => addToCart(item)}>Add</button>
        </div>
      ))}

      <h2>Cart</h2>
      <div className="card">
        {cartItems.length === 0 && <p>Your cart is empty.</p>}

        {cartItems.map((item) => (
          <div key={item.id} className="row" style={{ marginBottom: '8px' }}>
            <div>
              {item.name} <span className="badge">x{item.quantity}</span>
            </div>
            <div className="row">
              <span>${(item.price * item.quantity).toFixed(2)}</span>
              <button onClick={() => removeFromCart(item.id)}>-</button>
            </div>
          </div>
        ))}

        <hr />
        <p>
          <strong>Total: ${total.toFixed(2)}</strong>
        </p>

        <label htmlFor="customerName">Your name:</label>
        <input
          id="customerName"
          type="text"
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          style={{ display: 'block', width: '100%', padding: '8px', margin: '8px 0 12px' }}
          placeholder="e.g., Table 5 - Alex"
        />

        <button onClick={submitOrder} disabled={isSubmitting || cartItems.length === 0}>
          {isSubmitting ? 'Submitting...' : 'Submit Order'}
        </button>

        {message && <p style={{ marginTop: '12px' }}>{message}</p>}
      </div>
    </main>
  );
}