import { registerSale } from './src/lib/mock-data.js';

// We'll write a simple test script to run registerSale and log the output
import PocketBase from 'pocketbase';
const pb = new PocketBase('https://pbparceriso.darkstoresuplementos.com/');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function testSale() {
    try {
        await pb.admins.authWithPassword('contatofelipebelchior@gmail.com', '@Fe3595157');
        // Need to import registerSale or just run the logic directly to see what happens

        console.log("Fetching partner...");
        // Let's get 'Larissa Mazzilli' whose coupon is 'LARISSA' (if exists, or any other)
        const partner = await pb.collection('partners').getFirstListItem('');
        console.log("Testing with partner:", partner.name, "ID:", partner.id, "Current Points:", partner.points);

        const amountToSave = Math.floor(150 / 10); // 15 points

        const dataToSave = {
            partner_id: partner.id,
            type: 'SALE',
            amount: amountToSave
        };
        console.log("Creating transaction...", dataToSave);
        const record = await pb.collection('transactions').create(dataToSave);
        console.log("Transaction created:", record.id);

        let newPoints = (partner.points || 0) + amountToSave;
        console.log("Updating partner points on ID", partner.id, "to", newPoints);

        const updated = await pb.collection('partners').update(partner.id, { points: newPoints });
        console.log("Partner updated! New points:", updated.points);

    } catch (err) {
        console.error("Test failed:", err);
    }
}
testSale();
