import { createClient } from '@supabase/supabase-js';
import PocketBase from 'pocketbase';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Ignore self signed certs for PB connection
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Initialize Supabase
const supabaseUrl = 'https://gydbxxdgrqcuevbdwbbj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5ZGJ4eGRncnFjdWV2YmR3YmJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MzM4MDIsImV4cCI6MjA2NjEwOTgwMn0.FwMJ715Gv-S2kar75qKWaO3tF5-e6Cd6VDyLZi0z4CE';
if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize PocketBase
const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pbparceriso.darkstoresuplementos.com/';
const pb = new PocketBase(pbUrl);

const PB_ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || 'contatofelipebelchior@gmail.com';
const PB_ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || '@Fe3595157';

async function migrateData() {
    try {
        console.log("Authenticating with PocketBase Admin...");
        await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
        console.log("PocketBase authentication successful.");

        console.log("--- Fetching Partners from Supabase ---");
        const { data: supaPartners, error: partnersError } = await supabase.from('partners_v2').select('*');
        if (partnersError) throw new Error(`Supabase partners error: ${partnersError.message}`);
        console.log(`Found ${supaPartners?.length || 0} partners in Supabase.`);

        // Keep a map of Supabase ID -> PocketBase ID to link transactions
        const partnerIdMap = new Map();

        for (const p of supaPartners || []) {
            try {
                // Create the partner in PocketBase
                // We generate a new PB ID automatically or we can let PB do it. PB does it automatically.
                const dataToInsert = {
                    name: p.name,
                    coupon: p.coupon,
                    points: p.points || 0
                };

                // PocketBase handles unique constraints, so let's try to update if it exists or create
                let pbPartner;
                try {
                    // First check if a partner with this coupon already exists
                    pbPartner = await pb.collection('partners').getFirstListItem(`coupon="${p.coupon}"`);
                    console.log(`Partner with coupon ${p.coupon} already exists, updating points...`);
                    pbPartner = await pb.collection('partners').update(pbPartner.id, {
                        name: p.name, // optionally update name too
                        points: p.points || 0
                    });
                } catch (e) {
                    // Not found (404), so create it
                    console.log(`Migrating Partner: ${p.name}`);
                    pbPartner = await pb.collection('partners').create(dataToInsert);
                }

                // Store mapping for transactions
                partnerIdMap.set(p.id, pbPartner.id);

            } catch (err) {
                console.error(`Failed to migrate partner ${p.name}:`, err.message);
            }
        }

        console.log("--- Fetching Transactions from Supabase ---");
        const { data: supaTransactions, error: txError } = await supabase.from('transactions_v2').select('*');
        if (txError) throw new Error(`Supabase transactions error: ${txError.message}`);
        console.log(`Found ${supaTransactions?.length || 0} transactions in Supabase.`);

        for (const t of supaTransactions || []) {
            try {
                // Find the corresponding PocketBase partner ID
                const newPartnerId = partnerIdMap.get(t.partner_id);
                if (!newPartnerId) {
                    console.warn(`Warning: Could not map Supabase partner_id ${t.partner_id} for transaction ${t.id}. Skipping.`);
                    continue;
                }

                const pbTransactionData = {
                    partner_id: newPartnerId,
                    type: t.type,
                    amount: t.amount,
                    // Supabase might have 'date' or 'created_at', map it correctly (PB uses created by default but we can set custom dates only if it's a date field)
                    // Assuming we don't have a custom date field in PB schema based on our tests, we can just insert them and PB uses current time, 
                    // OR we can add a 'date' timestamp field to PB if accurate historical dates are required. Let's just insert for now.
                };

                await pb.collection('transactions').create(pbTransactionData);
                console.log(`Migrated transaction for Partner ${newPartnerId}`);

            } catch (err) {
                console.error(`Failed to migrate transaction ${t.id}:`, err.message);
            }
        }

        console.log("Migration complete!");

    } catch (error) {
        console.error("Migration fatal error:", error);
    }
}

migrateData();
