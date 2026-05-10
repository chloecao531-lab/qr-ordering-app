import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';

export async function GET() {
  const db = await getDb();
  const rows = await db.all('SELECT * FROM orders ORDER BY id DESC');

  const orders = rows.map((row) => ({
    id: row.id,
    customerName: row.customer_name,
    items: JSON.parse(row.items_json),
    total: row.total,
    createdAt: row.created_at,
  }));

  return NextResponse.json(orders);
}

export async function POST(request) {
  const body = await request.json();
  const customerName = (body.customerName || '').trim();
  const items = Array.isArray(body.items) ? body.items : [];

  if (!customerName) {
    return NextResponse.json({ error: 'Customer name is required.' }, { status: 400 });
  }

  if (items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 });
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const db = await getDb();
  const createdAt = new Date().toISOString();

  const result = await db.run(
    'INSERT INTO orders (customer_name, items_json, total, created_at) VALUES (?, ?, ?, ?)',
    customerName,
    JSON.stringify(items),
    Number(total.toFixed(2)),
    createdAt
  );

  return NextResponse.json({ id: result.lastID, message: 'Order submitted!' }, { status: 201 });
}