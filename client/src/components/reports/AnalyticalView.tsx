import React, { useMemo } from 'react';
import type { Event } from '../../types';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from 'recharts';
import { AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Props {
    events: Event[];
    refData: any;
}

export const AnalyticalView: React.FC<Props> = ({ events }) => {

    // 1. Failure Dynamics (Area Chart by Day)
    const dynamics = useMemo(() => {
        const data: Record<string, number> = {};
        events.forEach(e => {
            if (e.type === 'Аварийное' && e.timeStart) {
                const dateKey = format(parseISO(e.timeStart), 'yyyy-MM-dd');
                data[dateKey] = (data[dateKey] || 0) + 1;
            }
        });

        return Object.entries(data)
            .map(([date, count]) => ({
                date,
                displayDate: format(parseISO(date), 'dd MMM', { locale: ru }),
                count
            }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [events]);

    // 2. Unreliable Objects (Top 5 Substations)
    const topSubstations = useMemo(() => {
        const counts: Record<string, number> = {};
        events.forEach(e => {
            if (e.type === 'Аварийное' && e.substation?.name) {
                counts[e.substation.name] = (counts[e.substation.name] || 0) + 1;
            }
        });

        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [events]);

    // 3. Cause Analysis (Categories)
    const causes = useMemo(() => {
        const counts: Record<string, number> = {};
        events.forEach(e => {
            if (e.type === 'Аварийное') {
                const cat = e.reasonCategory || 'Не указано';
                counts[cat] = (counts[cat] || 0) + 1;
            }
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [events]);

    const COLORS = ['#3b82f6', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'];


    return (
        <div className="space-y-6">

            {/* Dynamics Chart (New) */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Activity className="text-brand-500" size={20} />
                    Динамика аварийности
                </h3>
                <div className="h-[300px] w-full text-xs">
                    {dynamics.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dynamics} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="displayDate" tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <Tooltip
                                    formatter={(value: any) => [value, 'Количество']}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="count" name="Аварий" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400">Нет данных для графика</div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Top Substations Chart */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <AlertTriangle className="text-rose-500" size={20} />
                        Топ "ненадежных" объектов
                    </h3>
                    <div className="h-[300px] w-full text-xs">
                        {topSubstations.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topSubstations} layout="vertical" margin={{ left: 20, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#64748b', fontSize: 11 }} />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        formatter={(value: any) => [value, 'Количество']}
                                        contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="count" name="Событий" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">Нет данных</div>
                        )}
                    </div>
                </div>

                {/* Pareto / Pie Chart */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <TrendingUp className="text-blue-500" size={20} />
                        Причины аварийности
                    </h3>
                    <div className="h-[300px] w-full text-xs">
                        {causes.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={causes}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                        nameKey="name"
                                    >
                                        {causes.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: any) => [value, 'Событий']}
                                        contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">Нет данных</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
