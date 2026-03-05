import PocketBase from 'pocketbase';
const pb = new PocketBase('https://pbparceriso.darkstoresuplementos.com/');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function test() {
    try {
        console.log("Testing Create Partner...");
        const partner = await pb.collection('partners').create({
            name: "Integração Teste",
            coupon: "INTEGRA100",
            points: 0
        });
        console.log("Partner Created:", partner.id);

        console.log("Testing Create Transaction...");
        const transaction = await pb.collection('transactions').create({
            partnerId: partner.id,
            type: "Venda",
            amount: 15,
            originalSaleValue: 150,
            date: new Date().toISOString()
        });
        console.log("Transaction Created:", transaction.id);

        console.log("Testing Fetch...");
        const fetchedPartners = await pb.collection('partners').getList(1, 10);
        console.log("Total Partners:", fetchedPartners.totalItems);

        console.log("Testing Cleanup...");
        await pb.collection('transactions').delete(transaction.id);
        await pb.collection('partners').delete(partner.id);
        console.log("Cleanup successful. ALL TESTS PASSED.");
    } catch (err) {
        console.error("Test failed:", err.message, err.response);
    }
}
test();
