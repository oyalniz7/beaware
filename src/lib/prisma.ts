import { PrismaClient } from '../generated/client/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const prismaClientSingleton = () => {
    // LibSQL adapter expects url directly in constructor
    const dbUrl = process.env.DATABASE_URL || 'file:dev.db';

    console.log("Initialize Prisma LibSQL with URL:", dbUrl);
    console.log("CWD:", process.cwd());
    console.log("ENV DATABASE_URL:", process.env.DATABASE_URL);

    const adapter = new PrismaLibSql({
        url: dbUrl,
    })
    return new PrismaClient({ adapter })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
