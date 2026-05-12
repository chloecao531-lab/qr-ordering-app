import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';

const allowedStatuses = ['pending', 'preparing', 'ready'];

export async function GET() {
  const db = await getDb();
  const rows = await db.all('SELECT * FROM orders ORDER BY id DESC');

  const orders = rows.map((row) => ({
    id: row.id,
    customerName: row.customer_name,
    tableNumber: row.table_number,
    tableId: row.table_number,
    items: JSON.parse(row.items_json),
    total: row.total,
    totalPrice: row.total,
    note: row.note || '',
    status: row.status,
    createdAt: row.created_at,
  }));

  return NextResponse.json(orders);
}

export async function PATCH(request) {
  const body = await request.json();
  const orderId = Number(body.orderId);
  const status = (body.status || '').trim();

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return NextResponse.json({ error: 'Valid orderId is required.' }, { status: 400 });
  }

  if (!allowedStatuses.includes(status)) {
    return NextResponse.json(
      { error: 'Invalid status. Use pending, preparing, or ready.' },
      { status: 400 }
    );
  }

  const db = await getDb();
  const result = await db.run('UPDATE orders SET status = ? WHERE id = ?', status, orderId);

  if (result.changes === 0) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

  const row = await db.get('SELECT * FROM orders WHERE id = ?', orderId);

  return NextResponse.json({
    id: row.id,
    customerName: row.customer_name,
    tableNumber: row.table_number,
    tableId: row.table_number,
    items: JSON.parse(row.items_json),
    total: row.total,
    totalPrice: row.total,
    note: row.note || '',
    status: row.status,
    createdAt: row.created_at,
    message: 'Order status updated.',
  });
}

export async function POST(request) {
  const body = await request.json();
  const customerName = (body.customerName || '').trim();
  const tableNumber = (body.tableNumber || body.tableId || '').trim();
  const note = (body.note || '').trim();
  const items = Array.isArray(body.items) ? body.items : [];

  if (!customerName) {
    return NextResponse.json({ error: 'Customer name is required.' }, { status: 400 });
  }

  if (items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 });
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const db = await getDb();
  const createdAt = body.createdAt || new Date().toISOString();

  const result = await db.run(
    'INSERT INTO orders (customer_name, table_number, items_json, total, status, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    customerName,
    tableNumber,
    JSON.stringify(items),
    Number(total.toFixed(2)),
    'pending',
    note,
    createdAt
  );

  return NextResponse.json(
    {
      id: result.lastID,
      customerName,
      tableNumber,
      tableId: tableNumber,
      items,
      total: Number(total.toFixed(2)),
      totalPrice: Number(total.toFixed(2)),
      note,
      status: 'pending',
      createdAt,
      message: 'Order submitted!',
    },
    { status: 201 }
  );
}
