import PocketBase from 'pocketbase';
const pb = new PocketBase('https://pbparceriso.darkstoresuplementos.com/');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function checkSchema() {
    try {
        await pb.admins.authWithPassword('contatofelipebelchior@gmail.com', '@Fe3595157');

        const transactionsCol = await pb.collections.getOne('transactions');
        console.log("Transactions fields detailed:", JSON.stringify(transactionsCol.fields, null, 2));
    } catch (err) {
        console.error("Failed:", err.message);
    }
}
checkSchema();
