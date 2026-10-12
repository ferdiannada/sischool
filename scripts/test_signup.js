
const SUPABASE_URL = 'http://127.0.0.1:54321';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

async function testSignup() {
    console.log('Testing signup...');
    try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
            method: 'POST',
            headers: {
                'apikey': ANON_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: `test_api_${Date.now()}@example.com`,
                password: 'Password123!',
                data: {
                    full_name: 'Test API User',
                    primaryRole: 'siswa'
                }
            })
        });

        const data = await response.json();

        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error('Signup Failed!');
        } else {
            console.log('Signup Successful!');
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

testSignup();
