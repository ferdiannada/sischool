
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local manually
const envPath = path.resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.error(".env.local not found");
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE URL or KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCounts() {
    console.log("Checking counts...");

    // Roles
    const { data: roles, error: rolesError } = await supabase.from('roles').select('*');
    if (rolesError) console.error("Roles error:", rolesError);
    else console.log("Roles found:", roles.length, roles.map(r => r.name).join(', '));

    // User Roles Count
    if (roles) {
        for (const role of roles) {
            const { count, error } = await supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role_id', role.id);
            if (error) console.error(`Role ${role.name} error:`, error);
            else console.log(`User Roles for ${role.name} (${role.id}):`, count);
        }
    } else {
        console.log("No roles found to iterate.");
    }
}

checkCounts();
