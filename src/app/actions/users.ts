'use server'

import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getServerSession } from 'next-auth'

// Helper to check admin role
async function checkAdmin() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== 'admin') {
        throw new Error('Unauthorized');
    }
}

export async function getUsers() {
    await checkAdmin();
    return prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
    });
}

export async function deleteUser(id: string) {
    await checkAdmin();
    // Prevent deleting self?
    const session = await getServerSession(authOptions);
    if ((session?.user as any).id === id) {
        return { success: false, error: "Cannot delete your own account" };
    }

    try {
        await prisma.user.delete({ where: { id } });
        return { success: true };
    } catch (e) {
        console.error('Delete user error:', e);
        return { success: false, error: 'Failed to delete user' };
    }
}

export async function createUser(data: any) {
    await checkAdmin();
    try {
        const { email, password, name, role } = data;

        if (!email || !password) {
            return { success: false, error: 'Email and password required' };
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return { success: false, error: 'User with this email already exists' };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role: role || 'user', // Default to 'user' if not specified
            }
        });

        return { success: true };
    } catch (e: any) {
        console.error('Create user error:', e);
        return { success: false, error: e.message || 'Failed to create user' };
    }
}
