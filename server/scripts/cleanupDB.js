import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ludo';

// All old management collections to drop
const OLD_COLLECTIONS = [
    'workorders',
    'purchaseorders',
    'indents',
    'workcompletions',
    'entries',
    'contractors',
    'tasks',
    'bills',
    'paymentvouchers',
    'qaqcs',
    'settings',
    'sitelookups',
    'logs',
    'activitylogs',
    'materialtransactions',
    'dailydeployments',
    'certifications',
];

async function cleanup() {
    await mongoose.connect(MONGODB_URI);
    console.log(`Connected to: ${MONGODB_URI}\n`);

    const db = mongoose.connection.db;
    const existing = (await db.listCollections().toArray()).map(c => c.name);

    console.log('Collections in DB:', existing.join(', ') || '(none)');
    console.log('');

    let dropped = 0;
    for (const name of OLD_COLLECTIONS) {
        if (existing.includes(name)) {
            await db.dropCollection(name);
            console.log(`✓ Dropped: ${name}`);
            dropped++;
        }
    }

    if (dropped === 0) {
        console.log('No old collections found — DB is already clean.');
    } else {
        console.log(`\nDropped ${dropped} collection(s).`);
    }

    // Show what's left
    const remaining = (await db.listCollections().toArray()).map(c => c.name);
    console.log('\nRemaining collections:', remaining.join(', ') || '(none)');

    await mongoose.disconnect();
    console.log('\nDone.');
}

cleanup().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
