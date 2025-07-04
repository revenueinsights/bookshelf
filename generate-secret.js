#!/usr/bin/env node

/**
 * Generate a secure random secret for NEXTAUTH_SECRET
 * Run with: node generate-secret.js
 */

const crypto = require('crypto');

function generateSecret() {
  return crypto.randomBytes(32).toString('base64');
}

const secret = generateSecret();

console.log('🔐 Generated NEXTAUTH_SECRET:');
console.log(secret);
console.log('\n📝 Add this to your Railway environment variables:');
console.log(`NEXTAUTH_SECRET=${secret}`);
console.log('\n⚠️  Keep this secret secure and never share it publicly!'); 