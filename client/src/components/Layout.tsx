
import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    FileText,
    Database,
    Zap,
    Menu,
    X,
    ChevronRight,
    BarChart3,
    LogOut,
    User
} from 'lucide-react';
import clsx from 'clsx';

export const Layout: React.FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const { user, logout } = useAuth();

    // Название страницы по маршруту
    const getPageTitle = (pathname: string) => {
        if (pathname.includes('dashboard')) return 'Дашборд';
        if (pathname.includes('register')) return 'Новое отключение';
        if (pathname.includes('journal')) return 'Журнал отключений';
        if (pathname.includes('references')) return 'Объекты';
        if (pathname.includes('reports')) return 'Отчеты';
        return 'Обзор';
    };

    const navItemClass = ({ isActive }: { isActive: boolean }) =>
        clsx(
            "group flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-300 font-medium mb-1",
            isActive
                ? "bg-white text-slate-800 shadow-sm ring-1 ring-black/5"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
        );

    // Доступ по ролям
    const canManageReferences = ['SENIOR', 'ADMIN'].includes(user?.role || '');
    const canManageUsers = user?.role === 'ADMIN';

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/80 z-20 backdrop-blur-sm transition-opacity md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <aside
                className={clsx(
                    "fixed inset-y-0 left-0 z-30 w-72 bg-[#F5F5F7] border-r border-slate-200/60 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col md:backdrop-blur-xl",
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="h-24 flex items-center gap-4 px-8 pt-4 pb-2">
                    <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-slate-100/50">
                        <Zap className="text-brand-600" size={24} fill="currentColor" />
                    </div>
                    <div>
                        <h1 className="text-[15px] font-bold text-slate-800 leading-tight">
                            Мониторинг<br />
                            <span className="text-slate-400 font-medium">АЭС</span>
                        </h1>
                    </div>
                    <button
                        className="ml-auto md:hidden text-slate-400 hover:text-slate-600"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-10 overflow-y-auto custom-scrollbar">
                    <div className="space-y-1">
                        <div className="px-4 mb-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest opacity-80">
                            Основное
                        </div>
                        <NavLink to="/dashboard" className={navItemClass}>
                            <LayoutDashboard size={19} className="transition-transform group-hover:scale-105" />
                            <span className="tracking-wide text-[13px]">Дашборд</span>
                        </NavLink>

                        <NavLink to="/journal" className={navItemClass}>
                            <FileText size={19} className="transition-transform group-hover:scale-105" />
                            <span className="tracking-wide text-[13px]">Журнал</span>
                        </NavLink>
                        <NavLink to="/reports" className={navItemClass}>
                            <BarChart3 size={19} className="transition-transform group-hover:scale-105" />
                            <span className="tracking-wide text-[13px]">Отчеты</span>
                        </NavLink>
                    </div>

                    <div className="space-y-1">
                        <div className="px-4 mb-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest opacity-80">
                            Система
                        </div>
                        {/* Управление справочниками */}
                        {canManageReferences && (
                            <NavLink to="/references" className={navItemClass}>
                                <Database size={19} className="transition-transform group-hover:scale-105" />
                                <span className="tracking-wide text-[13px]">Объекты</span>
                            </NavLink>
                        )}

                        {/* Управление пользователями */}
                        {canManageUsers && (
                            <NavLink to="/admin" className={navItemClass}>
                                <User size={19} className="transition-transform group-hover:scale-105" />
                                <span className="tracking-wide text-[13px]">Сотрудники</span>
                            </NavLink>
                        )}

                    </div>
                </nav>

                <div className="p-4 border-t border-slate-200/60 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-brand-600 shadow-sm shrink-0">
                            <span className="font-bold text-sm">{user?.name?.[0]?.toUpperCase()}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-bold text-slate-700 leading-tight mb-0.5 break-words">{user?.name}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{user?.role}</div>
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                            title="Выйти"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 shrink-0 relative z-10">
                    <div className="flex items-center gap-4">
                        <button
                            className="md:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-lg"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu size={24} />
                        </button>

                        <div className="hidden md:flex items-center text-sm text-slate-500">
                            <span className="hover:text-brand-600 transition-colors cursor-pointer">Главная</span>
                            <ChevronRight size={16} className="mx-2 text-slate-300" />
                            <span className="font-medium text-slate-800 bg-slate-100 px-2 py-1 rounded-md">
                                {getPageTitle(location.pathname)}
                            </span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-slate-50/50 p-4 md:p-8 custom-scrollbar">
                    <div className="max-w-[1600px] mx-auto animate-fade-in pb-12">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div >
    );
};
