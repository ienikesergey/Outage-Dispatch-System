import React, { useState, useMemo } from 'react';
import type { Event } from '../../types';
import {
    Clock,
    Activity,
    CheckCircle2,
    Flame,
    Filter,
    Zap,
    Calendar
} from 'lucide-react';
import clsx from 'clsx';
import { format, parseISO } from 'date-fns';

interface Props {
    events: Event[];
    allEvents: Event[];
}

type FilterType = 'all' | 'emergency' | 'planned' | 'active' | 'completed';

export const OperationalView: React.FC<Props> = ({ events, allEvents }) => {
    const [typeFilter, setTypeFilter] = useState<FilterType>('all');

    // Current Active (always from allEvents)
    const currentOutages = useMemo(() => allEvents.filter(e => !e.isCompleted), [allEvents]);

    // Deadline Control
    const deadlineEvents = useMemo(() => {
        const now = new Date();
        return allEvents.filter(e => {
            if (e.isCompleted || !e.deadlineDate) return false;
            const deadline = parseISO(e.deadlineDate);
            const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
            return diffHours < 2;
        }).sort((a, b) => new Date(a.deadlineDate!).getTime() - new Date(b.deadlineDate!).getTime());
    }, [allEvents]);

    // Shift Log (filtered)
    const shiftLog = useMemo(() => {
        let filtered = [...events];
        if (typeFilter === 'emergency') filtered = filtered.filter(e => e.type === 'Аварийное');
        if (typeFilter === 'planned') filtered = filtered.filter(e => e.type === 'Плановое');
        if (typeFilter === 'active') filtered = filtered.filter(e => !e.isCompleted);
        if (typeFilter === 'completed') filtered = filtered.filter(e => e.isCompleted);
        return filtered.sort((a, b) => new Date(b.timeStart || 0).getTime() - new Date(a.timeStart || 0).getTime());
    }, [events, typeFilter]);

    const stats = useMemo(() => ({
        total: events.length,
        emergency: events.filter(e => e.type === 'Аварийное').length,
        planned: events.filter(e => e.type === 'Плановое').length,
        active: events.filter(e => !e.isCompleted).length,
        completed: events.filter(e => e.isCompleted).length,
    }), [events]);

    return (
        <div className="space-y-5">
            {/* Dashboard Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Current Outages */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Activity size={16} className="text-brand-500" />
                            Текущая обстановка
                        </h3>
                        <span className="text-xs font-bold text-white bg-brand-500 px-2 py-0.5 rounded-full">
                            {currentOutages.length}
                        </span>
                    </div>
                    <div className="p-3 space-y-2 max-h-[280px] overflow-y-auto">
                        {currentOutages.length === 0 ? (
                            <div className="text-center text-slate-400 py-6 flex flex-col items-center gap-2">
                                <CheckCircle2 size={28} className="text-emerald-400" />
                                <span className="text-sm">Нет активных событий</span>
                            </div>
                        ) : (
                            currentOutages.map(e => (
                                <div key={e.id} className={clsx(
                                    "p-3 rounded-lg border flex items-start gap-3",
                                    e.type === 'Аварийное' ? "bg-rose-50 border-rose-100" : "bg-amber-50 border-amber-100"
                                )}>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={clsx(
                                                "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                                                e.type === 'Аварийное' ? "bg-rose-200 text-rose-800" : "bg-amber-200 text-amber-800"
                                            )}>
                                                {e.type === 'Аварийное' ? 'АВ' : 'ПЛ'}
                                            </span>
                                            <span className="text-[10px] font-mono text-slate-500">
                                                {e.timeStart ? format(parseISO(e.timeStart), 'dd.MM HH:mm') : '--.-- --:--'}
                                            </span>
                                        </div>
                                        <div className="font-semibold text-sm text-slate-800 truncate">
                                            {e.substation?.name}
                                            {e.substation && e.tp && <span className="text-slate-300 mx-1">/</span>}
                                            {e.tp?.name}
                                        </div>
                                        <div className="text-[11px] text-slate-500 truncate">{e.cell?.name || e.reasonCategory}</div>
                                    </div>
                                    {e.type === 'Аварийное' && <Zap size={16} className="text-rose-500 shrink-0" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Deadline Control */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <Flame size={16} className="text-rose-500" />
                            Контроль сроков
                        </h3>
                        {deadlineEvents.length > 0 && (
                            <span className="text-xs font-bold text-white bg-rose-500 px-2 py-0.5 rounded-full animate-pulse">
                                {deadlineEvents.length}
                            </span>
                        )}
                    </div>
                    <div className="p-3 space-y-2 max-h-[280px] overflow-y-auto">
                        {deadlineEvents.length === 0 ? (
                            <div className="text-center text-emerald-500 py-6 flex flex-col items-center gap-2">
                                <CheckCircle2 size={28} />
                                <span className="text-sm font-medium">Просрочек нет</span>
                            </div>
                        ) : (
                            deadlineEvents.map(e => {
                                const deadline = parseISO(e.deadlineDate!);
                                const isOverdue = new Date() > deadline;
                                return (
                                    <div key={e.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="text-sm font-semibold text-slate-700 truncate">
                                                {e.substation?.name}
                                                {e.substation && e.tp && <span className="text-slate-300 mx-1">/</span>}
                                                {e.tp?.name}
                                            </div>
                                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                                <Clock size={10} />
                                                {format(deadline, 'dd.MM HH:mm')}
                                            </div>
                                        </div>
                                        <span className={clsx(
                                            "text-[10px] font-bold px-2 py-1 rounded uppercase shrink-0",
                                            isOverdue ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                                        )}>
                                            {isOverdue ? 'Просрочено' : 'Скоро'}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Shift Log Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        Журнал за период
                        <span className="text-xs font-normal text-slate-400">({stats.total})</span>
                    </h3>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <Filter size={12} className="text-slate-400" />
                        {[
                            { id: 'all', label: 'Все', count: stats.total },
                            { id: 'emergency', label: 'Аварии', count: stats.emergency },
                            { id: 'planned', label: 'План', count: stats.planned },
                            { id: 'active', label: 'В работе', count: stats.active },
                            { id: 'completed', label: 'Готово', count: stats.completed },
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setTypeFilter(f.id as FilterType)}
                                className={clsx(
                                    "text-[10px] font-semibold px-2 py-1 rounded transition-all",
                                    typeFilter === f.id
                                        ? "bg-slate-700 text-white"
                                        : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                                )}
                            >
                                {f.label} ({f.count})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-semibold sticky top-0">
                            <tr>
                                <th className="px-4 py-2 w-24">Дата</th>
                                <th className="px-4 py-2">Объект</th>
                                <th className="px-4 py-2 w-20">Тип</th>
                                <th className="px-4 py-2">Причина</th>
                                <th className="px-4 py-2 w-20 text-center">Статус</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {shiftLog.length === 0 ? (
                                <tr><td colSpan={5} className="py-8 text-center text-slate-400">Нет записей</td></tr>
                            ) : (
                                shiftLog.slice(0, 50).map(e => (
                                    <tr key={e.id} className={clsx(
                                        "hover:bg-slate-50",
                                        e.type === 'Аварийное' && !e.isCompleted && "bg-rose-50/40"
                                    )}>
                                        <td className="px-4 py-2 font-mono text-slate-600">
                                            <div>{e.timeStart ? format(parseISO(e.timeStart), 'dd.MM.yy') : '--.--.--'}</div>
                                            <div className="text-[10px] text-slate-400">{e.timeStart ? format(parseISO(e.timeStart), 'HH:mm') : '--:--'}</div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="font-semibold text-slate-800">
                                                {e.substation?.name}
                                                {e.substation && e.tp && <span className="text-slate-300 mx-1">/</span>}
                                                {e.tp?.name}
                                            </div>
                                            <div className="text-[10px] text-slate-400">{e.cell?.name}</div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className={clsx(
                                                "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                                                e.type === 'Аварийное' ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                                            )}>
                                                {e.type === 'Аварийное' ? 'АВ' : 'ПЛ'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-slate-600 max-w-[200px] truncate">
                                            {e.reasonCategory || '—'}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            {e.isCompleted ? (
                                                <CheckCircle2 size={14} className="text-emerald-500 mx-auto" />
                                            ) : (
                                                <Clock size={14} className="text-amber-500 mx-auto animate-pulse" />
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
