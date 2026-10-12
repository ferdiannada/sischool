import jwt from 'jsonwebtoken';
import fs from 'fs';

// Using JWT secret from environment or default local secret
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'super-secret-jwt-token-with-at-least-32-characters-long';

const token = jwt.sign(
    {
        role: 'service_role',
        iss: 'supabase-demo',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    },
    JWT_SECRET
);

fs.writeFileSync('token.txt', token);
console.log('Token written to token.txt', token);
