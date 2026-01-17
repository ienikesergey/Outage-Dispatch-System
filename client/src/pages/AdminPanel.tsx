
import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import { Plus, Trash2, User, Edit2 } from 'lucide-react';
import clsx from 'clsx';

interface UserData {
    id: number;
    username: string;
    name: string;
    role: string;
    createdAt: string;
}

export const AdminPanel = () => {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Form State
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState('READER');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/auth/users');
            setUsers(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEditingUserId(null);
        setUsername('');
        setPassword('');
        setName('');
        setRole('READER');
        setIsFormOpen(false);
    };

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUserId) {
                // Update
                const payload: any = { username, name, role };
                if (password) payload.password = password;

                await api.put(`/auth/users/${editingUserId}`, payload);
            } else {
                // Create
                await api.post('/auth/users', { username, password, name, role });
            }

            resetForm();
            fetchUsers();
        } catch (e) {
            alert('Ошибка при сохранении пользователя');
        }
    };

    const startEditing = (user: UserData) => {
        setEditingUserId(user.id);
        setUsername(user.username);
        setName(user.name);
        setRole(user.role);
        setPassword(''); // Password empty by default
        setIsFormOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Удалить пользователя?')) return;
        try {
            await api.delete(`/auth/users/${id}`);
            fetchUsers();
        } catch (e) {
            alert('Ошибка при удалении');
        }
    };

    const roleColors: Record<string, string> = {
        'ADMIN': 'bg-rose-100 text-rose-700',
        'SENIOR': 'bg-violet-100 text-violet-700',
        'EDITOR': 'bg-blue-100 text-blue-700',
        'READER': 'bg-slate-100 text-slate-600',
    };

    if (loading) return <div>Загрузка...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Управление пользователями</h2>
                    <p className="text-slate-500 mt-1">Доступ и роли сотрудников</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsFormOpen(true); }}
                    className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-200 transition-all flex items-center gap-2"
                >
                    <Plus size={18} />
                    Добавить пользователя
                </button>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Сотрудник</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Логин</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Роль</th>
                                <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Создан</th>
                                <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                                <User size={20} />
                                            </div>
                                            <span className="font-bold text-slate-700">{u.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-slate-600 font-mono text-sm">{u.username}</td>
                                    <td className="px-8 py-4">
                                        <span className={clsx("px-3 py-1 rounded-full text-xs font-bold", roleColors[u.role] || 'bg-slate-50')}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4 text-slate-400 text-sm">
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => startEditing(u)}
                                                className="p-2 text-slate-300 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                                                title="Редактировать"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(u.id)}
                                                className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                title="Удалить"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-slide-up">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">
                            {editingUserId ? 'Редактировать пользователя' : 'Новый пользователь'}
                        </h3>
                        <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ФИО / Имя</label>
                                <input
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
                                    value={name} onChange={e => setName(e.target.value)} required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Логин</label>
                                <input
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
                                    value={username} onChange={e => setUsername(e.target.value)} required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                    Пароль {editingUserId && <span className="font-normal text-slate-400 lowercase">(оставьте пустым, чтобы не менять)</span>}
                                </label>
                                <input
                                    type="password"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required={!editingUserId} // Required only for new users
                                    placeholder={editingUserId ? "••••••••" : ""}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Роль</label>
                                <select
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                    value={role} onChange={e => setRole(e.target.value)}
                                >
                                    <option value="READER">READER (Только чтение)</option>
                                    <option value="EDITOR">EDITOR (Ввод данных)</option>
                                    <option value="SENIOR">SENIOR (Ввод + Справочники)</option>
                                    <option value="ADMIN">ADMIN (Полный доступ)</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-xl"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-200"
                                >
                                    {editingUserId ? 'Сохранить' : 'Создать'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
