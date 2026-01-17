import React, { useMemo } from 'react';
import type { Event } from '../../types';
import {
    Clock,
    CheckCircle2,
    AlertTriangle,
    Zap,
    TrendingDown
} from 'lucide-react';
import { differenceInMinutes, parseISO, format } from 'date-fns';
import clsx from 'clsx';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LineChart,
    Line
} from 'recharts';
import { ru } from 'date-fns/locale';

interface Props {
    events: Event[];
}

export const EfficiencyView: React.FC<Props> = ({ events }) => {

    // 1. MTTR (Mean Time To Recovery) Global
    const mttr = useMemo(() => {
        const emergencies = events.filter(e => e.type === 'Аварийное' && e.isCompleted && e.timeEnd);
        if (emergencies.length === 0) return 0;

        const totalMinutes = emergencies.reduce((acc, e) => {
            if (!e.timeEnd || !e.timeStart) return acc;
            return acc + differenceInMinutes(parseISO(e.timeEnd), parseISO(e.timeStart));
        }, 0);

        return Math.round(totalMinutes / emergencies.length);
    }, [events]);

    // 2. MTTR Trend (Daily Average)
    const mttrTrend = useMemo(() => {
        const dailyData: Record<string, { total: number, count: number }> = {};

        events.forEach(e => {
            if (e.type === 'Аварийное' && e.isCompleted && e.timeEnd && e.timeStart) {
                const dateKey = format(parseISO(e.timeStart), 'yyyy-MM-dd');
                const diff = differenceInMinutes(parseISO(e.timeEnd), parseISO(e.timeStart));

                if (!dailyData[dateKey]) dailyData[dateKey] = { total: 0, count: 0 };
                dailyData[dateKey].total += diff;
                dailyData[dateKey].count += 1;
            }
        });

        return Object.entries(dailyData)
            .map(([date, stats]) => ({
                date,
                displayDate: format(parseISO(date), 'dd MMM', { locale: ru }),
                avgTime: Math.round(stats.total / stats.count)
            }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [events]);

    // 3. Planned vs Emergency Ratio
    const ratioData = useMemo(() => {
        const active = events.filter(e => e.type === 'Аварийное').length;
        const planned = events.filter(e => e.type === 'Плановое').length;
        return [
            { name: 'Аварийные', value: active, color: '#f43f5e' },
            { name: 'Плановые', value: planned, color: '#3b82f6' }
        ];
    }, [events]);

    // 4. Feeder Frequency - prioritize lines (фидера), not cells
    const feederFreq = useMemo(() => {
        const counts: Record<string, number> = {};
        events.forEach(e => {
            if (e.type === 'Аварийное') {
                // Count each line (feeder) separately
                if (e.lines && e.lines.length > 0) {
                    e.lines.forEach(line => {
                        if (line.name) {
                            counts[line.name] = (counts[line.name] || 0) + 1;
                        }
                    });
                }
            }
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [events]);


    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard
                    title="Среднее время восстановления (MTTR)"
                    value={`${mttr} мин`}
                    icon={Clock}
                    color={mttr > 180 ? 'rose' : 'emerald'}
                    desc="Целевое значение: < 180 мин"
                />
                <KPICard
                    title="Всего аварий"
                    value={ratioData[0].value.toString()}
                    icon={AlertTriangle}
                    color="rose"
                />
                <KPICard
                    title="Всего плановых"
                    value={ratioData[1].value.toString()}
                    icon={CheckCircle2}
                    color="blue"
                />
            </div>

            {/* MTTR Trend Chart */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <TrendingDown className="text-emerald-500" size={20} />
                    Динамика времени восстановления (MTTR)
                </h3>
                <div className="h-[300px] w-full text-xs">
                    {mttrTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={mttrTrend} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="displayDate" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} unit=" мин" />
                                <Tooltip
                                    formatter={(value: any) => [`${value} мин`, 'Среднее время']}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line type="monotone" dataKey="avgTime" name="MTTR" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400">Нет данных для графика</div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Planned vs Emergency */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Zap className="text-amber-500" size={20} />
                        Соотношение работ
                    </h3>
                    <div className="h-[300px] w-full text-xs">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={ratioData} barSize={60}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    formatter={(value: any) => [value, 'Заявок']}
                                    contentStyle={{ borderRadius: '12px' }}
                                />
                                <Bar dataKey="value" name="Количество" radius={[8, 8, 0, 0]}>
                                    {ratioData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Feeder Frequency */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <AlertTriangle className="text-rose-500" size={20} />
                        Частота отключений (ТОП-5 фидеров)
                    </h3>
                    <div className="space-y-3">
                        {feederFreq.length > 0 ? feederFreq.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="font-medium text-slate-700">{item.name}</span>
                                <span className="font-bold text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200">
                                    {item.value} откл.
                                </span>
                            </div>
                        )) : (
                            <div className="border border-dashed border-slate-200 rounded-xl h-full flex items-center justify-center text-slate-400">
                                Нет данных по авариям
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const KPICard = ({ title, value, icon: Icon, color, desc }: any) => {
    const colors: any = {
        emerald: "text-emerald-600 bg-emerald-50",
        rose: "text-rose-600 bg-rose-50",
        blue: "text-blue-600 bg-blue-50",
    };

    return (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">{title}</p>
                    <div className="text-3xl font-black text-slate-800">{value}</div>
                    {desc && <div className="text-xs font-medium text-slate-400 mt-2">{desc}</div>}
                </div>
                <div className={clsx("p-3 rounded-2xl", colors[color])}>
                    <Icon size={28} />
                </div>
            </div>
        </div>
    )
}
