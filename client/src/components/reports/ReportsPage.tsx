import React, { useState, useMemo } from 'react';
import {
    LayoutDashboard,
    PieChart,
    TrendingUp,
    FileText,
    Calendar,
    AlertTriangle,
    Clock
} from 'lucide-react';
import clsx from 'clsx';
import type { Event, ReferenceData } from '../../types';
import { OperationalView } from './OperationalView';
import { AnalyticalView } from './AnalyticalView';
import { EfficiencyView } from './EfficiencyView';
import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, startOfYear, isWithinInterval, parseISO, format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Props {
    events: Event[];
    refData: ReferenceData | null;
}

type TabType = 'operational' | 'analytical' | 'efficiency';
type DateRangePreset = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'all';

export const ReportsPage: React.FC<Props> = ({ events, refData }) => {
    const [activeTab, setActiveTab] = useState<TabType>('operational');
    const [dateRange, setDateRange] = useState<DateRangePreset>('month');

    const tabs = [
        { id: 'operational', label: 'Оперативная', icon: LayoutDashboard },
        { id: 'analytical', label: 'Аналитика', icon: PieChart },
        { id: 'efficiency', label: 'KPI', icon: TrendingUp },
    ];

    const getDateInterval = (preset: DateRangePreset) => {
        const now = new Date();
        switch (preset) {
            case 'today': return { start: startOfDay(now), end: endOfDay(now) };
            case 'yesterday': return { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) };
            case 'week': return { start: subDays(now, 7), end: endOfDay(now) };
            case 'month': return { start: startOfMonth(now), end: endOfMonth(now) };
            case 'year': return { start: startOfYear(now), end: endOfDay(now) };
            case 'all': return { start: new Date(0), end: new Date(9999, 11, 31) };
            default: return { start: startOfMonth(now), end: endOfMonth(now) };
        }
    };

    const { start: intervalStart, end: intervalEnd } = getDateInterval(dateRange);

    const filteredEvents = useMemo(() => {
        return events.filter(e => {
            if (!e.timeStart) return false;
            const eventDate = parseISO(e.timeStart);
            return isWithinInterval(eventDate, { start: intervalStart, end: intervalEnd });
        });
    }, [events, intervalStart, intervalEnd]);

    const stats = useMemo(() => {
        const active = filteredEvents.filter(e => !e.isCompleted).length;
        const emergency = filteredEvents.filter(e => e.type === 'Аварийное' && !e.isCompleted).length;
        return { active, emergency, total: filteredEvents.length };
    }, [filteredEvents]);

    const getDateRangeLabel = () => {
        const now = new Date();
        switch (dateRange) {
            case 'today': return format(now, 'd MMMM', { locale: ru });
            case 'yesterday': return format(subDays(now, 1), 'd MMMM', { locale: ru });
            case 'week': return `${format(subDays(now, 7), 'd MMM', { locale: ru })} — ${format(now, 'd MMM', { locale: ru })}`;
            case 'month': return format(now, 'LLLL yyyy', { locale: ru });
            case 'year': return format(now, 'yyyy', { locale: ru }) + ' г.';
            case 'all': return 'Все время';
            default: return '';
        }
    };

    return (
        <div className="max-w-[1400px] mx-auto px-6 pb-8 space-y-6">
            {/* Header Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                {/* Left: Title + Stats */}
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-brand-100 rounded-xl">
                        <FileText className="text-brand-600" size={22} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Отчеты</h1>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <Calendar size={12} />
                            <span className="font-medium text-slate-700">{getDateRangeLabel()}</span>
                        </div>
                    </div>
                </div>

                {/* Right: Controls */}
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Period Buttons */}
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        {[
                            { id: 'today', label: 'Сегодня' },
                            { id: 'week', label: 'Неделя' },
                            { id: 'month', label: 'Месяц' },
                            { id: 'year', label: 'Год' },
                            { id: 'all', label: 'Все' },
                        ].map(p => (
                            <button
                                key={p.id}
                                onClick={() => setDateRange(p.id as DateRangePreset)}
                                className={clsx(
                                    "px-3 py-1.5 text-xs font-semibold rounded-md transition-all",
                                    dateRange === p.id
                                        ? "bg-white text-slate-800 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Buttons */}
                    <div className="flex bg-brand-50 p-1 rounded-lg">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={clsx(
                                        "px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5",
                                        activeTab === tab.id
                                            ? "bg-brand-600 text-white shadow-sm"
                                            : "text-brand-700 hover:bg-brand-100"
                                    )}
                                >
                                    <Icon size={14} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                        <FileText size={18} className="text-slate-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
                        <div className="text-xs text-slate-500">Событий за период</div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-amber-200 p-4 flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                        <Clock size={18} className="text-amber-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-amber-600">{stats.active}</div>
                        <div className="text-xs text-slate-500">В работе</div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-rose-200 p-4 flex items-center gap-3">
                    <div className="p-2 bg-rose-100 rounded-lg">
                        <AlertTriangle size={18} className="text-rose-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-rose-600">{stats.emergency}</div>
                        <div className="text-xs text-slate-500">Аварий</div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div>
                {activeTab === 'operational' && <OperationalView events={filteredEvents} allEvents={events} />}
                {activeTab === 'analytical' && <AnalyticalView events={filteredEvents} refData={refData} />}
                {activeTab === 'efficiency' && <EfficiencyView events={filteredEvents} />}
            </div>
        </div>
    );
};
