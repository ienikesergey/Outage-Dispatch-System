
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

export const authRouter = Router();

// JWT Secret - ОБЯЗАТЕЛЬНО задайте через переменную окружения в продакшене!
const SECRET = process.env.JWT_SECRET || 'CHANGE_ME_IN_PRODUCTION_' + Math.random().toString(36);
if (!process.env.JWT_SECRET) {
    console.warn('⚠️  WARNING: JWT_SECRET not set! Using random secret (sessions will reset on restart)');
}

// Авторизация
authRouter.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }
        const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, SECRET, { expiresIn: '12h' });
        res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});


// Получение списка пользователей
authRouter.get('/users', async (req: any, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    try {
        const token = authHeader.split(' ')[1];
        const user: any = jwt.verify(token, SECRET);
        if (user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

        const users = await prisma.user.findMany({
            select: { id: true, username: true, name: true, role: true, createdAt: true }
        });
        res.json(users);
    } catch (e) {
        res.status(500).json({ error: 'Error fetching users' });
    }
});

// Создание пользователя
authRouter.post('/users', async (req: any, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    try {
        const token = authHeader.split(' ')[1];
        const admin: any = jwt.verify(token, SECRET);
        if (admin.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

        const { username, password, name, role } = req.body;
        if (!username || !password || !name || !role) return res.status(400).json({ error: 'All fields required' });

        const hashedPassword = bcrypt.hashSync(password, 10);
        const newUser = await prisma.user.create({
            data: { username, password: hashedPassword, name, role }
        });
        res.json({ id: newUser.id, username: newUser.username, role: newUser.role });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Обновление пользователя
authRouter.put('/users/:id', async (req: any, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    try {
        const token = authHeader.split(' ')[1];
        const admin: any = jwt.verify(token, SECRET);
        if (admin.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

        const { id } = req.params;
        const { username, password, name, role } = req.body;

        const dataToUpdate: any = {};
        if (username) dataToUpdate.username = username;
        if (name) dataToUpdate.name = name;
        if (role) dataToUpdate.role = role;
        if (password && password.trim() !== '') {
            dataToUpdate.password = bcrypt.hashSync(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: Number(id) },
            data: dataToUpdate
        });
        res.json({ id: updatedUser.id, username: updatedUser.username, role: updatedUser.role });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Удаление пользователя
authRouter.delete('/users/:id', async (req: any, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    try {
        const token = authHeader.split(' ')[1];
        const admin: any = jwt.verify(token, SECRET);
        if (admin.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });

        const { id } = req.params;
        await prisma.user.delete({ where: { id: Number(id) } });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Middleware аутентификации
export const authenticate = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded;
        next();
    } catch (e: any) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

export const requireRole = (roles: string[]) => (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
};
