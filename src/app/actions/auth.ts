'use server'

import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * Check if the system is already set up (has at least one user)
 */
export async function isSystemSetup() {
    try {
        const count = await prisma.user.count();
        return count > 0;
    } catch (error) {
        console.error('Failed to check system setup:', error);
        return false; // Default to setup required if DB fails? Or fail safe?
    }
}

/**
 * Create the initial admin user
 */
export async function createInitialUser(data: any) {
    try {
        const count = await prisma.user.count();
        if (count > 0) {
            return { success: false, error: 'System already set up' };
        }

        const { email, password, name } = data;

        if (!email || !password) {
            return { success: false, error: 'Email and password required' };
        }

        if (password.length < 8) {
            return { success: false, error: 'Password must be at least 8 characters' };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || 'Admin',
                role: 'admin'
            }
        });

        return { success: true };
    } catch (e: any) {
        console.error('Create user error:', e);
        return { success: false, error: e.message || 'Failed to create user' };
    }
}
