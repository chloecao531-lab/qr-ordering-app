'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

const defaultProteinOptions = [
  { name: 'Vegetable', extra: 0 },
  { name: 'Chicken', extra: 1 },
  { name: 'Pork', extra: 1 },
  { name: 'Beef', extra: 1 },
  { name: 'Shrimp', extra: 1 },
  { name: 'House Style', extra: 2 },
];
const defaultLunchSides = ['Spring Roll', 'Egg Drop Soup', 'Hot & Sour Soup', 'Wonton Soup', 'Steamed Rice'];

function normalizeOption(option) {
  if (typeof option === 'string') {
    return { name: option, extra: 0 };
  }

  return {
    name: option?.name || '',
    extra: Number(option?.extra || 0),
  };
}

function getItemOptions(item) {
  const proteinOptions =
    item.proteinOptions ||
    (['Fried Rice', 'Lo Mein', 'Mei Fun Rice Noodles'].includes(item.name) ? defaultProteinOptions : null) ||
    (item.category === 'Lunch Special' &&
    !['Lunch Sweet & Sour Chicken', "Lunch General Tso's Chicken", 'Lunch Springfield Style Cashew Chicken'].includes(
      item.name
    )
      ? ['Chicken', 'Beef', 'Shrimp']
      : null);

  const styleOptions =
    item.styleOptions ||
    (item.name === 'Mei Fun Rice Noodles' ? [{ name: 'Singapore Style', extra: 2 }] : null);

  const freeSideOptions = item.freeSideOptions || (item.category === 'Lunch Special' ? defaultLunchSides : null);

  const options =
    item.options ||
    (item.name === 'Fried / Steamed Dumplings (Potstickers) (8)' ? ['Fried', 'Steamed'] : null);

  return {
    proteinOptions: proteinOptions?.map(normalizeOption) || [],
    styleOptions: styleOptions?.map(normalizeOption) || [],
    freeSideOptions: freeSideOptions?.map(normalizeOption) || [],
    options: options?.map(normalizeOption) || [],
  };
}

function optionSummary(item) {
  const itemOptions = getItemOptions(item);
  const summaries = [];

  if (itemOptions.proteinOptions.length > 0) summaries.push('Choose protein available');
  if (itemOptions.freeSideOptions.length > 0) summaries.push('Includes one free side');
  if (itemOptions.options.length > 0) summaries.push(`Choose ${itemOptions.options.map((option) => option.name).join(' or ')}`);
  if (itemOptions.styleOptions.length > 0) summaries.push('Optional style available');

  return summaries;
}

function getSelectedOption(optionList, selectedIndex) {
  if (optionList.length === 0) return null;
  if (selectedIndex === undefined || selectedIndex === '') return null;
  return optionList[Number(selectedIndex)];
}

function getSelectedOptions(item, itemSelections) {
  const itemOptions = getItemOptions(item);

  return [
    { label: 'Protein', option: getSelectedOption(itemOptions.proteinOptions, itemSelections.protein) },
    { label: 'Style', option: getSelectedOption(itemOptions.styleOptions, itemSelections.style) },
    { label: 'Side', option: getSelectedOption(itemOptions.freeSideOptions, itemSelections.freeSide) },
    { label: 'Option', option: getSelectedOption(itemOptions.options, itemSelections.option) },
  ].filter((selection) => selection.option?.name);
}

function hasRequiredOptionMissing(item, itemSelections) {
  const itemOptions = getItemOptions(item);

  return (
    (itemOptions.proteinOptions.length > 0 && !itemSelections.protein) ||
    (itemOptions.freeSideOptions.length > 0 && !itemSelections.freeSide) ||
    (itemOptions.options.length > 0 && !itemSelections.option)
  );
}

function optionText(selectedOptions) {
  return selectedOptions
    .map((selection) => {
      const extraText = selection.option.extra > 0 ? ` (+$${selection.option.extra.toFixed(2)})` : '';
      return `${selection.label}: ${selection.option.name}${extraText}`;
    })
    .join(', ');
}

function cartKeyFor(item, selectedOptions) {
  const selectedOptionKey = selectedOptions
    .map((selection) => `${selection.label}:${selection.option.name}:${selection.option.extra}`)
    .join('|');

  return `${item.id}|${selectedOptionKey}`;
}

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
  const [selections, setSelections] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
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

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(menu.map((item) => item.category).filter(Boolean))];
    return ['All', ...uniqueCategories];
  }, [menu]);

  const filteredMenu = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return menu.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const searchableText = [item.name, item.description, item.category, item.subtitle]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [menu, searchTerm, selectedCategory]);

  const groupedMenu = useMemo(() => {
    const visibleCategories = [...new Set(filteredMenu.map((item) => item.category).filter(Boolean))];

    return visibleCategories.map((category) => ({
      category,
      items: filteredMenu.filter((item) => item.category === category),
    }));
  }, [filteredMenu]);

  function updateSelection(itemId, type, value) {
    setSelections((currentSelections) => ({
      ...currentSelections,
      [itemId]: {
        ...currentSelections[itemId],
        [type]: value,
      },
    }));
  }

  function addToCart(item) {
    const itemSelections = selections[item.id] || {};
    if (hasRequiredOptionMissing(item, itemSelections)) return;

    const selectedOptions = getSelectedOptions(item, itemSelections);
    const optionExtra = selectedOptions.reduce((sum, selection) => sum + selection.option.extra, 0);
    const linePrice = Number((item.price + optionExtra).toFixed(2));
    const cartKey = cartKeyFor(item, selectedOptions);

    setCart((currentCart) => {
      const quantity = currentCart[cartKey]?.quantity || 0;
      return {
        ...currentCart,
        [cartKey]: {
          cartKey,
          id: item.id,
          name: item.name,
          description: item.description,
          price: linePrice,
          basePrice: item.price,
          category: item.category,
          spicy: item.spicy,
          selectedOptions,
          optionSummary: optionText(selectedOptions),
          quantity: quantity + 1,
        },
      };
    });
  }

  function removeFromCart(cartKey) {
    setCart((currentCart) => {
      const item = currentCart[cartKey];
      if (!item) return currentCart;

      if (item.quantity === 1) {
        const newCart = { ...currentCart };
        delete newCart[cartKey];
        return newCart;
      }

      return {
        ...currentCart,
        [cartKey]: {
          ...item,
          quantity: item.quantity - 1,
        },
      };
    });
  }

  function clearItem(cartKey) {
    setCart((currentCart) => {
      const newCart = { ...currentCart };
      delete newCart[cartKey];
      return newCart;
    });
  }

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const total = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
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
          <p>Fresh Chinese favorites for dine-in ordering</p>
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

      <div className="menu-tools">
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="form-control search-input"
          placeholder="Search by dish, category, subtitle, or description"
        />

        <div className="category-nav" aria-label="Menu categories">
          {categories.map((category) => (
            <button
              key={category}
              className={selectedCategory === category ? 'category-button active' : 'category-button'}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="order-layout">
        <section className="menu-sections">
          {groupedMenu.length === 0 && <div className="card">No menu items match your search.</div>}

          {groupedMenu.map((group) => (
            <section key={group.category} className="menu-category">
              <h2>{group.category}</h2>
              <div className="menu-grid">
                {group.items.map((item) => {
                  const itemOptions = getItemOptions(item);
                  const itemSelections = selections[item.id] || {};
                  const selectedOptions = getSelectedOptions(item, itemSelections);
                  const optionExtra = selectedOptions.reduce((sum, selection) => sum + selection.option.extra, 0);
                  const displayPrice = item.price + optionExtra;
                  const summaries = optionSummary(item);
                  const missingRequiredOptions = hasRequiredOptionMissing(item, itemSelections);

                  return (
                    <div key={item.id} className="card menu-item-card">
                      <div>
                        <div className="menu-item-top">
                          <div>
                            <h3>
                              {item.name} {item.quantity && <span className="item-quantity">{item.quantity}</span>}
                            </h3>
                            {item.subtitle && <p className="item-subtitle">{item.subtitle}</p>}
                          </div>
                          {item.spicy && <span className="badge spicy-badge">🌶 Spicy</span>}
                        </div>

                        {item.description && <p className="item-description">{item.description}</p>}

                        {summaries.length > 0 && (
                          <div className="option-summary">
                            {summaries.map((summary) => (
                              <span key={summary}>{summary}</span>
                            ))}
                          </div>
                        )}

                        {(itemOptions.proteinOptions.length > 0 ||
                          itemOptions.styleOptions.length > 0 ||
                          itemOptions.freeSideOptions.length > 0 ||
                          itemOptions.options.length > 0) && (
                          <div className="customize-box">
                            <div className="customize-title">Customize</div>
                            <div className="option-controls">
                              {itemOptions.proteinOptions.length > 0 && (
                                <label>
                                  Protein <span>Required</span>
                                  <select
                                    value={itemSelections.protein || ''}
                                    onChange={(event) => updateSelection(item.id, 'protein', event.target.value)}
                                  >
                                    <option value="">Select protein</option>
                                    {itemOptions.proteinOptions.map((option, index) => (
                                      <option key={`${option.name}-${index}`} value={String(index)}>
                                        {option.name}
                                        {option.extra > 0 ? ` (+$${option.extra.toFixed(2)})` : ''}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              )}

                              {itemOptions.styleOptions.length > 0 && (
                                <label>
                                  Style
                                  <select
                                    value={itemSelections.style || ''}
                                    onChange={(event) => updateSelection(item.id, 'style', event.target.value)}
                                  >
                                    <option value="">No special style</option>
                                    {itemOptions.styleOptions.map((option, index) => (
                                      <option key={`${option.name}-${index}`} value={String(index)}>
                                        {option.name}
                                        {option.extra > 0 ? ` (+$${option.extra.toFixed(2)})` : ''}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              )}

                              {itemOptions.freeSideOptions.length > 0 && (
                                <label>
                                  Free side <span>Required</span>
                                  <select
                                    value={itemSelections.freeSide || ''}
                                    onChange={(event) => updateSelection(item.id, 'freeSide', event.target.value)}
                                  >
                                    <option value="">Select free side</option>
                                    {itemOptions.freeSideOptions.map((option, index) => (
                                      <option key={`${option.name}-${index}`} value={String(index)}>
                                        {option.name}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              )}

                              {itemOptions.options.length > 0 && (
                                <label>
                                  Option <span>Required</span>
                                  <select
                                    value={itemSelections.option || ''}
                                    onChange={(event) => updateSelection(item.id, 'option', event.target.value)}
                                  >
                                    <option value="">Select option</option>
                                    {itemOptions.options.map((option, index) => (
                                      <option key={`${option.name}-${index}`} value={String(index)}>
                                        {option.name}
                                        {option.extra > 0 ? ` (+$${option.extra.toFixed(2)})` : ''}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              )}
                            </div>
                            {missingRequiredOptions && (
                              <p className="option-helper">Please complete required choices.</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="menu-item-actions">
                        <strong>${displayPrice.toFixed(2)}</strong>
                        <button onClick={() => addToCart(item)} disabled={missingRequiredOptions}>
                          Add
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </section>

        <aside className="cart-panel">
          <div className="card cart-card">
            <h2>Your Order</h2>
            <p>
              <strong>Table:</strong> {tableNumber || 'Not selected'}
            </p>

            {cartItems.length === 0 && <p>Your cart is empty.</p>}

            {cartItems.map((item) => (
              <div key={item.cartKey} className="cart-item">
                <div>
                  <strong>{item.name}</strong>
                  {item.optionSummary && <p className="cart-options">{item.optionSummary}</p>}
                  <div>
                    x{item.quantity} - ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
                <div className="quantity-controls">
                  <button onClick={() => removeFromCart(item.cartKey)}>-</button>
                  <button onClick={() => clearItem(item.cartKey)}>Remove</button>
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
