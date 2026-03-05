import fetch from 'node-fetch';

const url = 'https://gydbxxdgrqcuevbdwbbj.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5ZGJ4eGRncnFjdWV2YmR3YmJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MzM4MDIsImV4cCI6MjA2NjEwOTgwMn0.FwMJ715Gv-S2kar75qKWaO3tF5-e6Cd6VDyLZi0z4CE';

async function getTables() {
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("Tables in Supabase:", Object.keys(data.paths).filter(p => !p.includes('{') && p !== '/'));
    } catch (e) {
        console.error(e);
    }
}

getTables();
