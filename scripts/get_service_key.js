import { exec } from 'child_process';
import fs from 'fs';

exec('npx supabase status -o json', (error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }
    try {
        const status = JSON.parse(stdout);
        const serviceKey = status.SERVICE_ROLE_KEY;
        if (serviceKey) {
            fs.writeFileSync('service_key.txt', serviceKey);
            console.log('Service key saved to service_key.txt');
        } else {
            console.error('SERVICE_ROLE_KEY not found in output');
            console.log(stdout); // Log raw output for debugging
        }
    } catch (e) {
        console.error('Failed to parse JSON:', e);
        console.log('Raw output:', stdout);
    }
});
