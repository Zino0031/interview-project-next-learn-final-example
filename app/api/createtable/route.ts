import { db } from '@vercel/postgres'
import { NextResponse } from 'next/server'

export async function POST() {
    const client = await db.connect()

    try {
        const createTable = `
            CREATE TABLE status_changes (
                id SERIAL PRIMARY KEY,  -- Fixed typo from SERAIL to SERIAL
                invoice_id UUID NOT NULL,
                previous_status VARCHAR(20),
                new_status VARCHAR(20),
                changed_by VARCHAR(255),
                changed_at TIMESTAMP DEFAULT NOW(),
                restored BOOLEAN DEFAULT FALSE
            );
        `;
        
        await client.query(createTable);
        return NextResponse.json({ message: `Table created successfully` }, { status: 200 });
    } catch (error) {
        console.error('Error creating table:', error); 
        return NextResponse.json({ error: 'Error creating table.' }, { status: 500 });
    } finally {
        client.release();
    }
}
