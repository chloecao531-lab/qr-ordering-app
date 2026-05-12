import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';

export async function GET(request, { params }) {
  const orderId = Number(params.id);

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return NextResponse.json({ error: 'Invalid order id.' }, { status: 400 });
  }

  const db = await getDb();
  const row = await db.get('SELECT * FROM orders WHERE id = ?', orderId);

  if (!row) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  }

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
  });
}
