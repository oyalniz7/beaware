import { Request, Response } from 'express';
import { prisma } from '../index';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const userSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).optional(),
    name: z.string().optional(),
    role: z.string().optional(),
});

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, name: true, role: true, createdAt: true }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const { email, password, name, role } = userSchema.parse(req.body);
        if (!password) return res.status(400).json({ message: 'Password required' });

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, password: hashedPassword, name, role: role || 'user' }
        });

        res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: (error as any).errors });
        }
        res.status(500).json({ message: 'Error creating user' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.user.delete({ where: { id } });
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user' });
    }
};

export const getSettings = async (req: Request, res: Response) => {
    try {
        // Assuming single settings record for now, or per user
        // For this demo, let's fetch the first one
        const settings = await prisma.notificationSettings.findFirst();
        res.json(settings || {});
    } catch (error) {
        res.status(500).json({ message: 'Error fetching settings' });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        // Upsert
        const first = await prisma.notificationSettings.findFirst();

        let settings;
        if (first) {
            settings = await prisma.notificationSettings.update({
                where: { id: first.id },
                data: data
            });
        } else {
            // minimal fields for creation if not exists
            settings = await prisma.notificationSettings.create({
                data: {
                    email: data.email || 'admin@example.com',
                    smtpUsername: data.smtpUsername || '',
                    smtpPassword: data.smtpPassword || '',
                    ...data
                }
            });
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error updating settings' });
    }
};
