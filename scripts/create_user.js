import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env.local
try {
    const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} catch (e) {
    console.warn('.env.local not found or readable');
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_KEY = process.env.SERVICE_ROLE_KEY; // You might need to add this to .env.local or hardcode it

// Fallback to env
const FINAL_SERVICE_KEY = SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, FINAL_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createUser(email, password, fullName, role) {
    console.log(`Creating user: ${email} (${role})...`);

    const { data, error } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
            full_name: fullName,
            primaryRole: role
        }
    });

    if (error) {
        console.error('Error creating user:', error.message);
        return;
    }

    console.log('User created successfully!');
    console.log('ID:', data.user.id);
    console.log('Details:', data.user);
}

// EDIT THESE VALUES TO CREATE A USER
const NEW_USER = {
    email: 'guru_baru@sekolah.id',
    password: 'Password123!',
    fullName: 'Guru Baru',
    role: 'guru' // role options: siswa, guru, tu, wali_kelas, wali_murid
};

createUser(NEW_USER.email, NEW_USER.password, NEW_USER.fullName, NEW_USER.role);
