import { PrismaClient } from '../src/generated/client/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const prismaClientSingleton = () => {
    const dbUrl = process.env.DATABASE_URL || 'file:prisma/dev.db';
    console.log('Using Database URL:', dbUrl);

    const adapter = new PrismaLibSql({
        url: dbUrl,
    });
    return new PrismaClient({ adapter });
};

const prisma = prismaClientSingleton();

async function main() {
    console.log('Seeding demo data...');

    // Create Assets
    const assets = [
        {
            name: 'Primary Web Server',
            type: 'Server',
            vendor: 'Dell',
            model: 'PowerEdge R750',
            ipAddress: '192.168.1.10',
            location: 'Data Center A',
        },
        {
            name: 'Developer Workstation',
            type: 'Laptop',
            vendor: 'Apple',
            model: 'MacBook Pro M3',
            ipAddress: '192.168.1.50',
            location: 'Office',
        },
        {
            name: 'Core Database',
            type: 'Database',
            vendor: 'Oracle',
            model: 'Exadata',
            ipAddress: '192.168.1.20',
            location: 'Data Center B',
        },
        {
            name: 'Gateway Router',
            type: 'Router',
            vendor: 'Cisco',
            model: 'ISR 4000',
            ipAddress: '192.168.1.1',
            location: 'Network Closet',
        },
        {
            name: 'Cloud CDN',
            type: 'Web Service',
            vendor: 'AWS',
            model: 'CloudFront',
            ipAddress: '0.0.0.0',
            location: 'Global',
        },
    ];

    for (const asset of assets) {
        // Check if exists
        const exists = await prisma.asset.findFirst({ where: { name: asset.name } });
        if (exists) {
            console.log(`Asset ${asset.name} already exists, skipping...`);
            continue;
        }

        const createdAsset = await prisma.asset.create({
            data: asset,
        });
        console.log(`Created asset: ${createdAsset.name}`);

        // Add a vulnerability to make it show up in "Vulnerable Assets"
        const vuln = await prisma.vulnerability.create({
            data: {
                cveId: `CVE-2024-${Math.floor(Math.random() * 100000)}`,
                description: 'Demo vulnerability for visualization',
                severity: Math.random() > 0.5 ? 'CRITICAL' : 'HIGH',
                publishedAt: new Date(),
            }
        });

        await prisma.riskAssessment.create({
            data: {
                assetId: createdAsset.id,
                vulnerabilityId: vuln.id,
                status: 'OPEN',
            }
        });

        // Add a scan
        await prisma.scan.create({
            data: {
                assetId: createdAsset.id,
                status: 'COMPLETED',
                vulnerabilitiesFound: 1,
                startedAt: new Date(),
                completedAt: new Date(),
            }
        });
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
