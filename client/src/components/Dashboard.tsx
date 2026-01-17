import { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import {
    CheckCircle2, Calendar, Zap, AlertOctagon, Cpu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';
import { StatsModal } from './StatsModal';
import { HazardousObjectsModal } from './HazardousObjectsModal';
// Removed unused types Event and ReferenceData
// import type { Event, ReferenceData } from '../types';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const Dashboard = ({ refreshTrigger }: { refreshTrigger: number }) => {
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        byType: {
            emergency: { total: 0, active: 0 },
            planned: { total: 0, active: 0 },
            preventive: { total: 0, active: 0 },
            operative: { total: 0, active: 0 }
        }
    });
    const [chartData, setChartData] = useState<any[]>([]);
    const [topObjects, setTopObjects] = useState<any[]>([]);
    const [showAllStats, setShowAllStats] = useState(false);
    const [showObjsModal, setShowObjsModal] = useState(false);
    const { token } = useAuth();
    // Removed timelineData

    useEffect(() => {
        if (token) {
            fetchAnalytics();
        }
    }, [refreshTrigger, token]);

    const fetchAnalytics = async () => {
        try {
            const res = await api.get('/analytics');
            const { stats: serverStats, byCategory, topHazardous } = res.data;

            if (serverStats) {
                setStats({
                    total: serverStats.total || 0,
                    active: serverStats.active || 0,
                    byType: serverStats.byType || {
                        emergency: { total: 0, active: 0 },
                        planned: { total: 0, active: 0 },
                        preventive: { total: 0, active: 0 },
                        operative: { total: 0, active: 0 }
                    }
                });
            }

            // Timeline data processing removed

            if (byCategory && Array.isArray(byCategory)) {
                // Formatting for Pie Chart -> Now Reason List
                setChartData(byCategory
                    .filter((c: any) => c.subcategory || c.category) // filter out empties
                    .map((c: any, id: number) => ({
                        name: c.subcategory || c.category,
                        value: c.value,
                        id
                    })));
            }

            if (topHazardous && Array.isArray(topHazardous)) {
                setTopObjects(topHazardous);
            }

        } catch (err) { console.error(err); }
    };

    // Internal Stat Card Layout
    const StatCard = ({ title, active, total, icon: Icon, color }: any) => (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all h-[160px] relative overflow-hidden group">
            <div className={clsx("absolute top-0 right-0 p-8 opacity-5 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform", color)}>
                <Icon size={120} />
            </div>

            <div className="flex items-start justify-between z-10">
                <div className={clsx("p-3 rounded-2xl bg-opacity-10", color.replace('text-', 'bg-'))}>
                    <Icon size={24} className={color} />
                </div>
                {active > 0 && (
                    <div className="px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold shadow-lg animate-pulse">
                        {active} в работе
                    </div>
                )}
            </div>

            <div className="z-10 mt-auto">
                <div className="text-4xl font-bold text-slate-800 tracking-tight">{total}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{title}</div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Ситуационный центр</h2>
                    <div className="flex items-center gap-4 mt-2">
                        <span className="text-slate-500 text-lg">Сводка по оперативной обстановке</span>
                        <div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>
                        <span className="font-bold text-slate-700">Всего отключений: {stats.total}</span>
                        {stats.active > 0 && (
                            <>
                                <div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>
                                <span className="font-bold text-emerald-600">В работе: {stats.active}</span>
                            </>
                        )}
                    </div>
                </div>
                <div className="text-right hidden md:block">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Обновлено</div>
                    <div className="font-mono text-slate-800 font-bold text-lg">
                        {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>

            {/* 1. Categorized Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Аварийные"
                    total={stats.byType.emergency.total}
                    active={stats.byType.emergency.active}
                    icon={AlertOctagon}
                    color="text-rose-500"
                />
                <StatCard
                    title="Плановые"
                    total={stats.byType.planned.total}
                    active={stats.byType.planned.active}
                    icon={Calendar}
                    color="text-blue-500"
                />
                <StatCard
                    title="Превентивные меры"
                    total={stats.byType.preventive.total}
                    active={stats.byType.preventive.active}
                    icon={CheckCircle2}
                    color="text-amber-500"
                />
                <StatCard
                    title="Опер. переключения"
                    total={stats.byType.operative.total}
                    active={stats.byType.operative.active}
                    icon={Zap}
                    color="text-emerald-500"
                />
            </div>

            {/* 2. Main Analytics Section - Grid Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Col: Reason Statistics */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-lg transition-shadow duration-500 animate-slide-up flex flex-col h-full">
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Статистика причин</h3>
                            <p className="text-slate-400 text-sm mt-1 font-medium">Топ-5 частых нарушений</p>
                        </div>
                        <div className="bg-blue-50/80 backdrop-blur-sm px-5 py-3 rounded-2xl border border-blue-100 text-center min-w-[100px]">
                            <span className="block text-2xl font-black text-brand-600 leading-none">{stats.total}</span>
                            <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider mt-1 block">Всего событий</span>
                        </div>
                    </div>

                    <div className="space-y-9 flex-1">
                        {chartData.sort((a, b) => b.value - a.value).slice(0, 5).map((entry, index) => {
                            const percent = ((entry.value / stats.total) * 100).toFixed(1);
                            return (
                                <div key={index} className="group cursor-default">
                                    <div className="flex justify-between items-end mb-2.5">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <div className={`w-2 h-2 rounded-full flex-shrink-0`} style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></div>
                                            <span className="text-[15px] font-semibold text-slate-700 group-hover:text-brand-600 transition-colors truncate pr-2">
                                                {entry.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                                                {entry.value} шт
                                            </span>
                                            <span className="text-sm font-bold text-slate-800 w-[45px] text-right tabular-nums">
                                                {percent}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-[10px] overflow-hidden shadow-inner">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                                            style={{
                                                width: `${percent}%`,
                                                backgroundColor: CHART_COLORS[index % CHART_COLORS.length]
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-white/20"></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {chartData.length === 0 && (
                            <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                Нет данных для отображения
                            </div>
                        )}
                    </div>

                    {chartData.length > 5 && (
                        <div className="pt-6 flex justify-center mt-auto">
                            <button
                                onClick={() => setShowAllStats(true)}
                                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-brand-600 font-bold text-sm transition-all py-3.5 rounded-2xl border border-slate-100 hover:border-brand-200 hover:shadow-sm flex items-center justify-center gap-2 group"
                            >
                                <span>Показать все причины</span>
                                <div className="w-1.5 h-1.5 border-r border-b border-current transform rotate-45 group-hover:mt-0.5 transition-all"></div>
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Col: Most Hazardous Objects */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-lg transition-shadow duration-500 animate-slide-up flex flex-col h-full" style={{ animationDelay: '100ms' }}>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Аварийные объекты</h3>
                            <p className="text-slate-400 text-sm mt-1 font-medium">Рейтинг аварийности (Топ-5)</p>
                        </div>
                    </div>

                    <div className="space-y-3 flex-1">
                        {topObjects.slice(0, 5).map((obj, index) => (
                            <div
                                key={index}
                                className={`
                                    flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 group relative overflow-hidden
                                    ${index === 0 ? 'bg-gradient-to-r from-red-50 to-white border-red-100 shadow-sm' : 'bg-slate-50 border-transparent hover:border-slate-200 hover:bg-white hover:shadow-sm'}
                                `}
                            >
                                <div className="flex items-center gap-4 min-w-0 z-10">
                                    <div className={`
                                        w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 shadow-sm
                                        ${index === 0 ? 'bg-red-500 text-white shadow-red-200 shadow-md ring-4 ring-red-100' :
                                            index === 1 ? 'bg-orange-500 text-white shadow-orange-200' :
                                                index === 2 ? 'bg-amber-400 text-white' : 'bg-white border border-slate-200 text-slate-400'}
                                    `}>
                                        {index + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            {obj.type === 'TP' ? (
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-slate-800 text-white uppercase tracking-wider flex items-center gap-1">
                                                    <Cpu size={8} /> ТП
                                                </span>
                                            ) : (
                                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-brand-100 text-brand-700 uppercase tracking-wider">ПС</span>
                                            )}
                                            <div className={`font-bold truncate text-sm flex-1 ${index === 0 ? 'text-red-900' : 'text-slate-700'}`}>
                                                {obj.cell}
                                                {obj.voltageClass && (
                                                    <span className="ml-1 text-[8px] opacity-70">({obj.voltageClass})</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className={`text-xs truncate font-medium max-w-[200px] pl-1 ${index === 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                            {obj.substation}
                                        </div>
                                    </div>
                                </div>
                                <div className="z-10 bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-black/5 flex flex-col items-end flex-shrink-0 ml-3 min-w-[70px]">
                                    <span className={`text-lg font-black leading-none ${index === 0 ? 'text-red-500' : 'text-slate-700'}`}>
                                        {obj.count}
                                    </span>
                                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">Аварий</span>
                                </div>
                            </div>
                        ))}

                        {topObjects.length === 0 && (
                            <div className="py-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                <AlertOctagon size={40} className="mb-3 text-slate-300" />
                                <span className="font-medium">Нет аварийных данных</span>
                            </div>
                        )}
                    </div>

                    {topObjects.length > 5 && (
                        <div className="pt-6 flex justify-center mt-auto">
                            <button
                                onClick={() => setShowObjsModal(true)}
                                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-brand-600 font-bold text-sm transition-all py-3.5 rounded-2xl border border-slate-100 hover:border-brand-200 hover:shadow-sm flex items-center justify-center gap-2 group"
                            >
                                <span>Открыть полный список</span>
                                <div className="w-1.5 h-1.5 border-r border-b border-current transform rotate-45 group-hover:mt-0.5 transition-all"></div>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <StatsModal
                isOpen={showAllStats}
                onClose={() => setShowAllStats(false)}
                data={chartData}
                total={stats.total}
                colors={CHART_COLORS}
            />

            <HazardousObjectsModal
                isOpen={showObjsModal}
                onClose={() => setShowObjsModal(false)}
                data={topObjects}
            />
        </div >
    );
};
