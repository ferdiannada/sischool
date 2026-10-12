
import { exec } from 'child_process';
import fs from 'fs';

exec('npx supabase status', (error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }

    // Look for "service_role key: <key>" pattern or similar in standard output
    // Based on previous output:
    // service_role: eyJ...

    // The previous output in step 149 didn't show the key explicitly because it was truncated?
    // Wait, step 157 with -o json showed keys.
    // Let's try to find "service_role" in the text output.

    console.log("STDOUT:", stdout);

    const match = stdout.match(/service_role\s*:\s*(eyJ[a-zA-Z0-9._-]+)/i);
    if (match && match[1]) {
        fs.writeFileSync('service_key_regex.txt', match[1]);
        console.log('Service key saved to service_key_regex.txt');
    } else {
        console.log('Could not find service_role key in output via regex.');
    }
});
