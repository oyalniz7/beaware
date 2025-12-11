import prisma from '../src/lib/prisma'

async function testConnection() {
    try {
        console.log('Testing Prisma connection...');
        const count = await prisma.asset.count();
        console.log('✓ Connection successful!');
        console.log(`Found ${count} assets in database`);
        process.exit(0);
    } catch (error) {
        console.error('✗ Connection failed:', error);
        process.exit(1);
    }
}

testConnection();
