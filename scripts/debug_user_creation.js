import { createClient } from '@supabase/supabase-js';

// Config from status output
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SERVICE_KEY = process.env.SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    console.log('Attempting to create user...');

    const email = `test_user_${Date.now()}@example.com`;

    const { data, error } = await supabase.auth.admin.createUser({
        email: email,
        password: 'password123',
        email_confirm: true,
        user_metadata: {
            full_name: 'Test Debug User',
            primaryRole: 'siswa'
        }
    });

    if (error) {
        console.error('FAILED to create user:');
        console.error(JSON.stringify(error, null, 2));

        // Check if user was actually created despite error
    } else {
        console.log('SUCCESS! User created:', data.user.id);

        // Clean up
        console.log('Cleaning up...');
        const { error: delError } = await supabase.auth.admin.deleteUser(data.user.id);
        if (delError) console.error('Failed to cleanup:', delError);
        else console.log('Cleanup successful');
    }
}

main().catch(err => console.error('Script error:', err));
