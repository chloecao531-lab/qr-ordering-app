import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

let db;

/**
 * Opens SQLite database once and reuses it.
 * DB file location: data/orders.db
 */
export async function getDb() {
  if (!db) {
    db = await open({
      filename: path.join(process.cwd(), "data", "orders.db"),
      driver: sqlite3.Database
    });

    // Create table if it does not exist yet
    await db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT,
        table_number TEXT,
        items_json TEXT NOT NULL,
        total REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        note TEXT,
        created_at TEXT NOT NULL
      )
    `);

    const columns = await db.all('PRAGMA table_info(orders)');
    const hasNoteColumn = columns.some((column) => column.name === 'note');

    if (!hasNoteColumn) {
      await db.exec('ALTER TABLE orders ADD COLUMN note TEXT');
    }
  }

  return db;
}
