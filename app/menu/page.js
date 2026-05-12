'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

const categoryOrder = [
  'Appetizers',
  'Soup',
  'Fried Rice / Noodle',
  'Chicken',
  'Beef',
  'Seafood',
  'Diet & Vegetables',
  "Chef's Specialties",
  'Lunch Special',
  'Side',
];

export default function MenuPage() {
  return (
    <Suspense fallback={<main className="menu-page">Loading menu...</main>}>
      <MenuContent />
    </Suspense>
  );
}

function MenuContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableNumber = useMemo(
    () => (searchParams.get('table') || searchParams.get('tableId') || '').trim(),
    [searchParams]
  );
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState({});
  const [customerName, setCustomerName] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [message, setMessage] = useState('');
  const [lastOrder, setLastOrder] = useState(null);
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
          description: item.description,
          price: item.price,
          category: item.category,
          spicy: item.spicy,
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

  function clearItem(itemId) {
    setCart((currentCart) => {
      const newCart = { ...currentCart };
      delete newCart[itemId];
      return newCart;
    });
  }

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const total = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  // Keep the restaurant's preferred category order even as menu data grows.
  const groupedMenu = useMemo(
    () =>
      categoryOrder
        .map((category) => ({
          category,
          items: menu.filter((item) => item.category === category),
        }))
        .filter((group) => group.items.length > 0),
    [menu]
  );

  async function submitOrder() {
    setMessage('');
    setLastOrder(null);
    setIsSubmitting(true);

    try {
      const createdAt = new Date().toISOString();
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          tableId: tableNumber,
          tableNumber,
          items: cartItems,
          totalPrice: Number(total.toFixed(2)),
          note: orderNote,
          status: 'pending',
          createdAt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || 'Could not submit order.');
      } else {
        setMessage('Order submitted successfully!');
        setLastOrder({
          id: data.id,
          total: data.total || total,
          itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        });
        setCart({});
        setCustomerName('');
        setOrderNote('');
        setTimeout(() => {
          router.push(`/order/${data.id}`);
        }, 1200);
      }
    } catch {
      setMessage('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="menu-page">
      <div className="menu-header">
        <div>
          <h1>Rice House</h1>
          <p>Customer ordering</p>
        </div>
        <div className="nav-links">
          <Link href="/">Home</Link>
          <Link href="/admin">Admin Orders</Link>
        </div>
      </div>

      <div className="card table-card">
        <strong>Table:</strong> {tableNumber || 'Not selected'}
      </div>

      {lastOrder && (
        <div className="card">
          <strong>Order #{lastOrder.id} submitted.</strong>
          <p>
            {lastOrder.itemCount} item(s), total ${lastOrder.total.toFixed(2)}. Opening your order status page now.
          </p>
        </div>
      )}

      <div className="order-layout">
        <section className="menu-sections">
          {groupedMenu.map((group) => (
            <section key={group.category} className="menu-category">
              <h2>{group.category}</h2>
              <div className="menu-grid">
                {group.items.map((item) => {
                  const selectedQuantity = cart[item.id]?.quantity || 0;

                  return (
                    <div key={item.id} className="card menu-item-card">
                      <div className="menu-item-top">
                        <div>
                          <h3>{item.name}</h3>
                          <p>{item.description}</p>
                        </div>
                        {item.spicy && <span className="badge spicy-badge">Spicy</span>}
                      </div>
                      <div className="menu-item-actions">
                        <strong>${item.price.toFixed(2)}</strong>
                        <div className="quantity-controls">
                          <button onClick={() => removeFromCart(item.id)} disabled={selectedQuantity === 0}>
                            -
                          </button>
                          <span>{selectedQuantity}</span>
                          <button onClick={() => addToCart(item)}>+</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </section>

        <aside className="cart-panel">
          <div className="card">
            <h2>Cart</h2>

            {cartItems.length === 0 && <p>Your cart is empty.</p>}

            {cartItems.map((item) => (
              <div key={item.id} className="cart-item">
                <div>
                  <strong>{item.name}</strong>
                  <div>
                    x{item.quantity} - ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
                <div className="quantity-controls">
                  <button onClick={() => removeFromCart(item.id)}>-</button>
                  <button onClick={() => clearItem(item.id)}>Remove</button>
                </div>
              </div>
            ))}

            <hr />
            <p>
              <strong>Total: ${total.toFixed(2)}</strong>
            </p>

            <label htmlFor="customerName">Name for the order:</label>
            <input
              id="customerName"
              type="text"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              className="form-control"
              placeholder="e.g., Alex"
            />

            <label htmlFor="orderNote">Order note:</label>
            <textarea
              id="orderNote"
              value={orderNote}
              onChange={(event) => setOrderNote(event.target.value)}
              className="form-control"
              rows="4"
              placeholder="Optional notes for the kitchen"
            />

            <button onClick={submitOrder} disabled={isSubmitting || cartItems.length === 0}>
              {isSubmitting ? 'Submitting...' : 'Submit Order'}
            </button>

            {message && <p style={{ marginTop: '12px' }}>{message}</p>}
          </div>
        </aside>
      </div>
    </main>
  );
}
