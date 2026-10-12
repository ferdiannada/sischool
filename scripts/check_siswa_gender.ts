
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGender() {
    const { data, error } = await supabase
        .from('siswa')
        .select('id, nis, jenis_kelamin, user:users(full_name)')
        .limit(10);

    if (error) {
        console.error('Error fetching siswa:', error);
        return;
    }

    console.log('Siswa Data Sample:');
    data.forEach(s => {
        console.log(`${s.user?.full_name || 'N/A'} (NIS: ${s.nis}): Gender = '${s.jenis_kelamin}' (Type: ${typeof s.jenis_kelamin})`);
    });
}

checkGender();
