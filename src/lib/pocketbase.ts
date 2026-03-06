// src/lib/pocketbase.ts
import PocketBase from 'pocketbase';

export const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

// auto cancellation is not recommended for next.js
pb.autoCancellation(false);

if (!process.env.NEXT_PUBLIC_POCKETBASE_URL) {
    console.error("CRITICAL: NEXT_PUBLIC_POCKETBASE_URL is not defined in environment variables!");
}

if (process.env.POCKETBASE_ADMIN_EMAIL && process.env.POCKETBASE_ADMIN_PASSWORD) {
    pb.admins.authWithPassword(
        process.env.POCKETBASE_ADMIN_EMAIL,
        process.env.POCKETBASE_ADMIN_PASSWORD
    ).catch(err => {
        console.error("Failed to authenticate PocketBase as admin:", err);
    });
} else {
    console.warn("WARNING: POCKETBASE_ADMIN_EMAIL or POCKETBASE_ADMIN_PASSWORD missing. Running without admin auth.");
}

export const getPocketBase = () => {
    return pb;
};
