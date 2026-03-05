import PocketBase from 'pocketbase';
import fs from 'fs';

const pb = new PocketBase('https://pbparceriso.darkstoresuplementos.com/');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function main() {
    try {
        console.log('Authenticating as admin...');
        await pb.admins.authWithPassword('contatofelipebelchior@gmail.com', '@Fe3595157');
        console.log('Authenticated successfully!');

        console.log('Reading pb_schema.json...');
        const schemaContent = fs.readFileSync('./pb_schema.json', 'utf8');
        const collections = JSON.parse(schemaContent);

        console.log('Importing schema to remote PocketBase...');
        // The import endpoint is PUT /api/collections/import
        // Body: { collections: [...], deleteMissing: false }
        const result = await pb.send('/api/collections/import', {
            method: 'PUT',
            body: {
                collections: collections,
                deleteMissing: false
            }
        });

        console.log('Schema setup complete!', result);
    } catch (err) {
        console.error('Failure:', err.message, err.response);
    }
}

main();
