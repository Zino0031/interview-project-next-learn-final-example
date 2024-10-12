import { db } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export async function POST() {
    const client = await db.connect()

    try {
        const deleteTable = `
            DELETE FROM users
        `;
        
        const result = await client.query(deleteTable);
        return NextResponse.json({ message: `${result.rowCount} users deleted.` }, { status: 200 });
    } catch (error) {
        console.error('Error deleting users:', error);
        return NextResponse.json({ error: 'Error deleting users.' }, { status: 500 });
    } finally {
        client.release();
    }
}
