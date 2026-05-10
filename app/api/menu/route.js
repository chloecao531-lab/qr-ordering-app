import { NextResponse } from 'next/server';
import { menuItems } from '../../../data/menuItems';

export async function GET() {
  return NextResponse.json(menuItems);
}