import PocketBase from 'pocketbase';
const pb = new PocketBase('https://pbparceriso.darkstoresuplementos.com/');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function testQuery() {
    try {
        await pb.admins.authWithPassword('contatofelipebelchior@gmail.com', '@Fe3595157');

        console.log("Testing with no options...");
        const rec1 = await pb.collection('transactions').getFullList();
        console.log("Success no options:", rec1.length);

        console.log("Testing with sort...");
        try {
            const rec2 = await pb.collection('transactions').getFullList({ sort: '-created' });
            console.log("Success with sort:", rec2.length);
        } catch (e) { console.error("Sort failed!", e.message); }

        console.log("Testing with expand...");
        try {
            const rec3 = await pb.collection('transactions').getFullList({ expand: 'partner_id' });
            console.log("Success with expand:", rec3.length);
        } catch (e) { console.error("Expand failed!", e.message); }

    } catch (err) {
        console.error("Failed:", err.message);
    }
}
testQuery();
