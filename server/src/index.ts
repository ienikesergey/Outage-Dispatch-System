import express from 'express';
import cors from 'cors';
import path from 'path';
import { router } from './routes';
import { authRouter } from './auth';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS для локальной сети
app.use(cors({
    origin: true, // Разрешаем все источники в локальной сети
    credentials: true
}));

app.use(express.json());

// API маршруты
app.use('/api/auth', authRouter);
app.use('/api', router);

// Раздача статических файлов клиента
// При разработке: server/dist/index.js -> client/dist
const clientPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientPath));

// Все остальные маршруты отдают index.html (для SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
});

// Запуск сервера на всех интерфейсах (0.0.0.0) для доступа из сети
app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`=================================`);
    console.log(`  Сервер запущен!`);
    console.log(`  Локально: http://localhost:${PORT}`);
    console.log(`  Сеть: http://0.0.0.0:${PORT}`);
    console.log(`=================================`);
});