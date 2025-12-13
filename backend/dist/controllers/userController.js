"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettings = exports.getSettings = exports.deleteUser = exports.createUser = exports.getUsers = void 0;
const index_1 = require("../index");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const userSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6).optional(),
    name: zod_1.z.string().optional(),
    role: zod_1.z.string().optional(),
});
const getUsers = async (req, res) => {
    try {
        const users = await index_1.prisma.user.findMany({
            select: { id: true, email: true, name: true, role: true, createdAt: true }
        });
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
};
exports.getUsers = getUsers;
const createUser = async (req, res) => {
    try {
        const { email, password, name, role } = userSchema.parse(req.body);
        if (!password)
            return res.status(400).json({ message: 'Password required' });
        const existing = await index_1.prisma.user.findUnique({ where: { email } });
        if (existing)
            return res.status(400).json({ message: 'User already exists' });
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await index_1.prisma.user.create({
            data: { email, password: hashedPassword, name, role: role || 'user' }
        });
        res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ message: 'Error creating user' });
    }
};
exports.createUser = createUser;
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await index_1.prisma.user.delete({ where: { id } });
        res.json({ message: 'User deleted' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting user' });
    }
};
exports.deleteUser = deleteUser;
const getSettings = async (req, res) => {
    try {
        // Assuming single settings record for now, or per user
        // For this demo, let's fetch the first one
        const settings = await index_1.prisma.notificationSettings.findFirst();
        res.json(settings || {});
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching settings' });
    }
};
exports.getSettings = getSettings;
const updateSettings = async (req, res) => {
    try {
        const data = req.body;
        // Upsert
        const first = await index_1.prisma.notificationSettings.findFirst();
        let settings;
        if (first) {
            settings = await index_1.prisma.notificationSettings.update({
                where: { id: first.id },
                data: data
            });
        }
        else {
            // minimal fields for creation if not exists
            settings = await index_1.prisma.notificationSettings.create({
                data: {
                    email: data.email || 'admin@example.com',
                    smtpUsername: data.smtpUsername || '',
                    smtpPassword: data.smtpPassword || '',
                    ...data
                }
            });
        }
        res.json(settings);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating settings' });
    }
};
exports.updateSettings = updateSettings;
