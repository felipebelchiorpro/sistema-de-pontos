// src/lib/pocketbase.ts
import PocketBase from 'pocketbase';

export const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

// auto cancellation is not recommended for next.js
pb.autoCancellation(false);

if (process.env.POCKETBASE_ADMIN_EMAIL && process.env.POCKETBASE_ADMIN_PASSWORD) {
    pb.admins.authWithPassword(
        process.env.POCKETBASE_ADMIN_EMAIL,
        process.env.POCKETBASE_ADMIN_PASSWORD
    ).catch(err => {
        console.error("Failed to authenticate PocketBase as admin:", err);
    });
}

export const getPocketBase = () => {
    return pb;
};
