# ⚡ ODS — Оперативно-диспетчерская система учёта отключений

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-lightgrey.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)

**Современная система учёта аварийных и плановых отключений электроэнергии  
для диспетчерских служб энергосетевых компаний**

[Возможности](#-возможности) • [Установка](#-установка) • [Использование](#-использование) • [API](#-api-документация) • [Архитектура](#-архитектура)

</div>

---

## 📋 О проекте

**ODS (Outage Dispatch System)** — fullstack веб-приложение для ведения оперативного учёта отключений электроэнергии. Система позволяет регистрировать события, отслеживать состояние сетевых объектов, анализировать статистику аварийности и формировать отчёты.

### 🎯 Для кого

- Диспетчерские службы РЭС/ЦУС
- Оперативный персонал подстанций
- Руководители энергосетевых предприятий
- Специалисты по надёжности

---

## ✨ Возможности

### 📊 Dashboard — Главная панель
- Текущая оперативная обстановка
- Счётчики активных/завершённых событий по типам
- Статистика по категориям причин (круговая диаграмма)
- Распределение по подстанциям (столбчатая диаграмма)
- Динамика событий по месяцам (линейный график)
- Топ аварийных объектов

### 📝 Журнал событий
- Регистрация аварийных и плановых отключений
- Оперативные переключения с фиксацией изменений топологии
- Расширенная фильтрация:
  - По статусу (активные/завершённые)
  - По типу события
  - По объектам (ПС, ячейка, линия, ТП)
  - По дате начала/окончания
  - По продолжительности
  - По классу напряжения и району
- Контроль просроченных сроков устранения
- Автоматический расчёт продолжительности работ
- Поддержка нескольких ТП на одно событие

### 📁 Справочники
- **Подстанции** — с привязкой района и класса напряжения
- **Ячейки** — распределительные устройства ПС
- **Линии** — ВЛ/КЛ с указанием типа и класса напряжения
- **Трансформаторные подстанции** — ТП/КТПН с мощностью
- **Причины отключений** — иерархический классификатор

### 📈 Отчёты
- **Оперативный отчёт** — текущие активные события с группировкой
- **Аналитический отчёт** — статистика за период с графиками
- **Эффективность** — анализ времени устранения по категориям

### 🔐 Безопасность
- JWT-аутентификация с временем жизни токена 12 часов
- Ролевая модель доступа (4 роли)
- Хеширование паролей bcrypt
- Защита API эндпоинтов middleware

---

## 👥 Роли пользователей

| Роль | Права доступа |
|------|---------------|
| **ADMIN** | Полный доступ + управление пользователями |
| **SENIOR** | Редактирование событий + управление справочниками |
| **EDITOR** | Создание и редактирование событий |
| **READER** | Только просмотр |

---

## 🛠️ Технологии

### Frontend
| Технология | Версия | Назначение |
|------------|--------|------------|
| React | 19.2 | UI библиотека |
| TypeScript | 5.9 | Типизация |
| Vite | 7.2 | Сборка и HMR |
| Tailwind CSS | 3.4 | Стилизация |
| Recharts | 3.6 | Графики и диаграммы |
| React Router | 7.11 | Маршрутизация |
| Axios | 1.13 | HTTP клиент |
| Lucide React | 0.562 | Иконки |
| date-fns | 4.1 | Работа с датами |

### Backend
| Технология | Версия | Назначение |
|------------|--------|------------|
| Node.js | 18+ | Среда выполнения |
| Express | 4.21 | Веб-фреймворк |
| Prisma | 5.10 | ORM |
| SQLite | — | База данных |
| JWT | 9.0 | Аутентификация |
| bcryptjs | 3.0 | Хеширование паролей |

---

## 📦 Установка

### Требования
- **Node.js** 18+ (рекомендуется 20 LTS)
- **npm** 9+ или yarn

### 🪟 Windows

```batch
# Автоматическая установка
install.bat
```

### 🐧 Linux (Alt Linux, Ubuntu, CentOS, Debian)

```bash
# Сделать скрипт исполняемым
chmod +x install_linux.sh

# Запустить установку
./install_linux.sh
```

### 🔧 Ручная установка

```bash
# 1. Клонирование
git clone https://github.com/your-org/ods.git
cd ods

# 2. Установка серверных зависимостей
cd server
npm install --legacy-peer-deps

# 3. Генерация Prisma Client
npx prisma generate

# 4. Инициализация базы данных
npx prisma db push
npm run seed

# 5. Установка клиентских зависимостей
cd ../client
npm install --legacy-peer-deps

# 6. Сборка клиента (для продакшена)
npm run build
```

---

## 🚀 Использование

### Режим разработки

```bash
# Терминал 1 — API сервер
cd server
npm run dev
# Сервер: http://localhost:3001

# Терминал 2 — Клиент с HMR
cd client
npm run dev
# Клиент: http://localhost:5173
```

### Продакшен

```bash
# Windows
start_server.bat

# Linux
./start_linux.sh

# Linux (автозапуск как сервис)
sudo ./setup_service.sh
```

Приложение: **http://localhost:3001**

### 🔑 Учётные записи по умолчанию

| Логин | Пароль | Роль | Описание |
|-------|--------|------|----------|
| admin | admin | ADMIN | Администратор системы |
| senior | 123 | SENIOR | Старший диспетчер |
| editor | 123 | EDITOR | Диспетчер |
| reader | 123 | READER | Только просмотр |

> ⚠️ **Важно:** Смените пароли после первого входа!

---

## 📡 API Документация

Все эндпоинты требуют JWT-токен в заголовке:
```
Authorization: Bearer <token>
```

### 🔐 Аутентификация (`/api/auth`)

| Метод | Endpoint | Описание | Доступ |
|-------|----------|----------|--------|
| POST | `/login` | Авторизация | Все |
| GET | `/users` | Список пользователей | ADMIN |
| POST | `/users` | Создание пользователя | ADMIN |
| PUT | `/users/:id` | Обновление пользователя | ADMIN |
| DELETE | `/users/:id` | Удаление пользователя | ADMIN |

### 📋 События (`/api/events`)

| Метод | Endpoint | Описание | Доступ |
|-------|----------|----------|--------|
| GET | `/events` | Список всех событий | Все авторизованные |
| POST | `/events` | Создание события | EDITOR+ |
| PUT | `/events/:id` | Полное обновление | EDITOR+ |
| PATCH | `/events/:id` | Частичное обновление | EDITOR+ |

**Тело запроса POST/PUT:**
```json
{
  "substationId": 1,
  "cellId": 5,
  "tpIds": [10, 11, 12],
  "lineIds": [3],
  "type": "Аварийное",
  "reasonCategory": "Причины выхода из строя ВЛ-0,4/6/10кВ",
  "reasonSubcategory": "Падение деревьев, веток",
  "timeStart": "2025-01-15T08:30:00.000Z",
  "timeEnd": null,
  "measuresPlanned": "Выезд ОВБ",
  "deadlineDate": "2025-01-15",
  "measuresTaken": "",
  "comment": "Повреждение провода",
  "isCompleted": false
}
```

### 📊 Справочные данные (`/api`)

| Метод | Endpoint | Описание | Доступ |
|-------|----------|----------|--------|
| GET | `/reference-data` | Все справочники одним запросом | Все |
| GET | `/analytics` | Статистика и аналитика | Все |

### 🏗️ Справочники — Подстанции

| Метод | Endpoint | Описание | Доступ |
|-------|----------|----------|--------|
| POST | `/substations` | Создание ПС | SENIOR+ |
| PUT | `/substations/:id` | Обновление ПС | SENIOR+ |
| DELETE | `/substations/:id` | Удаление ПС (каскадное) | SENIOR+ |

### 🔌 Справочники — Ячейки

| Метод | Endpoint | Описание | Доступ |
|-------|----------|----------|--------|
| POST | `/cells` | Создание ячейки | SENIOR+ |
| PUT | `/cells/:id` | Обновление ячейки | SENIOR+ |
| DELETE | `/cells/:id` | Удаление ячейки | SENIOR+ |

### ⚡ Справочники — Линии

| Метод | Endpoint | Описание | Доступ |
|-------|----------|----------|--------|
| POST | `/lines` | Создание линии | SENIOR+ |
| PUT | `/lines/:id` | Обновление линии | SENIOR+ |
| DELETE | `/lines/:id` | Удаление линии | SENIOR+ |

### 🏠 Справочники — ТП

| Метод | Endpoint | Описание | Доступ |
|-------|----------|----------|--------|
| POST | `/tps` | Создание ТП | SENIOR+ |
| PUT | `/tps/:id` | Обновление ТП | SENIOR+ |
| DELETE | `/tps/:id` | Удаление ТП | SENIOR+ |

### 🔄 Оперативные переключения

| Метод | Endpoint | Описание | Доступ |
|-------|----------|----------|--------|
| POST | `/topology/switch` | Переключение питания объекта | SENIOR+ |

---

## �️ Архитектура

### Структура базы данных

```
┌─────────────┐    ┌──────────┐    ┌──────────┐
│ Substation  │───▶│   Cell   │───▶│   Line   │
│ (Подстанция)│    │ (Ячейка) │    │ (Линия)  │
└─────────────┘    └──────────┘    └────┬─────┘
                                        │
                                        ▼
┌─────────────┐    ┌──────────┐    ┌──────────┐
│ OutageEvent │◀───│ EventLine│───▶│    Tp    │
│  (Событие)  │    │ (M2M)    │    │   (ТП)   │
└──────┬──────┘    └──────────┘    └──────────┘
       │
       │           ┌──────────┐
       └──────────▶│  EventTp │ (M2M - несколько ТП)
                   └──────────┘
```

### Модели данных

| Модель | Описание |
|--------|----------|
| `User` | Пользователи системы |
| `Substation` | Подстанции |
| `Cell` | Ячейки (РУ подстанций) |
| `Line` | Линии электропередач |
| `Tp` | Трансформаторные подстанции |
| `OutageEvent` | События отключений |
| `EventLine` | Связь событий с линиями (M2M) |
| `EventTp` | Связь событий с ТП (M2M) |
| `OutageReason` | Справочник причин |
| `TopologySwitch` | История переключений |

### Структура проекта

```
ods/
├── 📁 client/                    # Frontend (React + Vite)
│   ├── 📁 src/
│   │   ├── 📁 components/
│   │   │   ├── Dashboard.tsx     # Главная панель
│   │   │   ├── EventGrid.tsx     # Журнал событий
│   │   │   ├── EventForm.tsx     # Форма события
│   │   │   ├── ReferenceManager.tsx # Управление справочниками
│   │   │   ├── Layout.tsx        # Общий layout
│   │   │   ├── 📁 reports/       # Модуль отчётов
│   │   │   │   ├── ReportsPage.tsx
│   │   │   │   ├── OperationalView.tsx
│   │   │   │   ├── AnalyticalView.tsx
│   │   │   │   └── EfficiencyView.tsx
│   │   │   └── 📁 ui/            # UI компоненты
│   │   │       └── Select.tsx
│   │   ├── 📁 pages/
│   │   │   ├── LoginPage.tsx     # Страница входа
│   │   │   └── AdminPanel.tsx    # Панель администратора
│   │   ├── 📁 context/
│   │   │   └── AuthContext.tsx   # Контекст аутентификации
│   │   ├── types.ts              # TypeScript типы
│   │   └── App.tsx               # Корневой компонент
│   ├── package.json
│   └── vite.config.ts
│
├── 📁 server/                    # Backend (Express + Prisma)
│   ├── 📁 prisma/
│   │   └── schema.prisma         # Схема базы данных
│   ├── 📁 src/
│   │   ├── index.ts              # Точка входа
│   │   ├── routes.ts             # API маршруты
│   │   ├── auth.ts               # Аутентификация
│   │   ├── prisma.ts             # Prisma client
│   │   └── seed.ts               # Начальные данные
│   ├── .env.example              # Пример конфигурации
│   └── package.json
│
├── install.bat                   # Установщик Windows
├── install_linux.sh              # Установщик Linux
├── start_server.bat              # Запуск Windows
├── start_linux.sh                # Запуск Linux
├── setup_service.sh              # Настройка Systemd
├── .gitignore                    # Git ignore
└── README.md                     # Документация
```

---

## ⚙️ Конфигурация

### Переменные окружения

Создайте файл `server/.env`:

```env
# Порт API сервера (по умолчанию 3001)
PORT=3001

# JWT секретный ключ — ОБЯЗАТЕЛЬНО измените!
# Сгенерируйте: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-super-secret-key-here

# База данных (SQLite)
DATABASE_URL=file:../dev.db
```

### Vite прокси (режим разработки)

В `client/vite.config.ts` настроен прокси для API:

```typescript
server: {
  proxy: {
    '/api': 'http://localhost:3001'
  }
}
```

---

## � Команды

### Server

```bash
npm run dev      # Разработка с hot-reload
npm run start    # Запуск в продакшене
npm run seed     # Заполнение начальными данными
```

### Client

```bash
npm run dev      # Разработка с HMR
npm run build    # Сборка для продакшена
npm run preview  # Предпросмотр сборки
npm run lint     # Проверка ESLint
```

### Prisma

```bash
npx prisma generate    # Генерация клиента
npx prisma db push     # Синхронизация схемы
npx prisma studio      # GUI для базы данных
```

---

## 🌍 Развёртывание

### Linux (Systemd)

```bash
# Настройка автозапуска
chmod +x setup_service.sh
sudo ./setup_service.sh

# Управление сервисом
sudo systemctl status ods      # Статус
sudo systemctl restart ods     # Перезапуск
sudo systemctl stop ods        # Остановка
sudo journalctl -u ods -f      # Логи
```

### Docker (пример)

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY . .

RUN cd server && npm install --legacy-peer-deps
RUN cd client && npm install --legacy-peer-deps && npm run build

WORKDIR /app/server
RUN npx prisma generate

EXPOSE 3001
CMD ["npm", "start"]
```

---

## 🐛 Решение проблем

### Ошибка "Cannot find module prisma"
```bash
cd server
npx prisma generate
```

### Ошибка CORS
Убедитесь что клиент собран и сервер раздаёт статику:
```bash
cd client && npm run build
```

### Сброс базы данных
```bash
cd server
rm dev.db
npx prisma db push
npm run seed
```

### JWT токен истёк
Токен действует 12 часов. Перезайдите в систему.

---

## �📄 Лицензия

MIT License. См. файл [LICENSE](LICENSE) для подробностей.

---

## 🙏 Благодарности

- [React](https://react.dev/) — UI библиотека
- [Prisma](https://www.prisma.io/) — ORM
- [Tailwind CSS](https://tailwindcss.com/) — Стилизация
- [Recharts](https://recharts.org/) — Графики
- [Lucide](https://lucide.dev/) — Иконки
