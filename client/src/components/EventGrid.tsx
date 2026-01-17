import React, { useState, useMemo, useEffect } from 'react';
import type { Event, ReferenceData } from '../types';
import {
    Edit2, Trash2, Search, Filter, Clock, ChevronDown, ChevronUp, X
} from 'lucide-react';
import { EventForm } from './EventForm';
import { api } from '../context/AuthContext';
import clsx from 'clsx';
import { format, differenceInMinutes, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Select } from './ui/Select';

interface Props {
    events: Event[];
    refData: ReferenceData | null;
    onRefresh: () => void;
}

export const EventGrid: React.FC<Props> = ({ events, refData, onRefresh }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [allowOverflow, setAllowOverflow] = useState(false);

    // Overflow state for animation
    useEffect(() => {
        if (isFilterOpen) {
            const timer = setTimeout(() => setAllowOverflow(true), 300); // 300ms matches transition duration
            return () => clearTimeout(timer);
        } else {
            setAllowOverflow(false);
        }
    }, [isFilterOpen]);

    // Filter State
    const [filters, setFilters] = useState({
        searchQuery: '',
        dateStart: '',
        dateEnd: '',
        // Object filters - all independent
        substationId: '',
        cellId: '',
        lineId: '',
        tpId: '',
        // Object properties
        voltageClass: '',
        district: '',
        lineType: '',
        // Event properties
        type: '',
        category: '',
        subcategory: '',
        // Status
        status: '' as '' | 'active' | 'completed',
        showOverdueOnly: false,
        // Duration
        durationMin: '',
        durationMax: '',
    });

    const resetFilters = () => {
        setFilters({
            searchQuery: '',
            dateStart: '',
            dateEnd: '',
            substationId: '',
            cellId: '',
            lineId: '',
            tpId: '',
            voltageClass: '',
            district: '',
            lineType: '',
            type: '',
            category: '',
            subcategory: '',
            status: '',
            showOverdueOnly: false,
            durationMin: '',
            durationMax: '',
        });
    };

    // Extract unique values for property filters
    const uniqueVoltageClasses = useMemo(() => {
        const classes = new Set<string>();
        refData?.substations?.forEach(s => s.voltageClass && classes.add(s.voltageClass));
        refData?.substations?.forEach(s => s.cells?.forEach(c => c.voltageClass && classes.add(c.voltageClass)));
        refData?.lines?.forEach(l => l.voltageClass && classes.add(l.voltageClass));
        refData?.tps?.forEach(t => t.voltageClass && classes.add(t.voltageClass));
        return Array.from(classes).sort();
    }, [refData]);

    const uniqueDistricts = useMemo(() => {
        const districts = new Set<string>();
        refData?.substations?.forEach(s => s.district && districts.add(s.district));
        return Array.from(districts).sort();
    }, [refData]);

    const uniqueLineTypes = useMemo(() => {
        const types = new Set<string>();
        refData?.lines?.forEach(l => l.lineType && types.add(l.lineType));
        return Array.from(types).sort();
    }, [refData]);

    // Count active filters
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.searchQuery) count++;
        if (filters.dateStart || filters.dateEnd) count++;
        if (filters.substationId) count++;
        if (filters.cellId) count++;
        if (filters.lineId) count++;
        if (filters.tpId) count++;
        if (filters.voltageClass) count++;
        if (filters.district) count++;
        if (filters.lineType) count++;
        if (filters.type) count++;
        if (filters.category) count++;
        if (filters.status) count++;
        if (filters.durationMin || filters.durationMax) count++;
        return count;
    }, [filters]);

    // Filter Logic
    const filteredEvents = useMemo(() => {
        if (!Array.isArray(events)) return [];
        return events.filter(e => {
            // 1. Status Filter
            if (filters.status === 'active' && e.isCompleted) return false;
            if (filters.status === 'completed' && !e.isCompleted) return false;

            // 2. Overdue Only
            if (filters.showOverdueOnly) {
                if (!e.deadlineDate) return false;
                const deadline = parseISO(e.deadlineDate);
                if (e.isCompleted) {
                    if (!e.timeEnd) return false;
                    const end = parseISO(e.timeEnd);
                    if (end <= deadline) return false;
                } else {
                    const now = new Date();
                    if (now <= deadline) return false;
                }
            }

            // 3. Global Search (Smart Search)
            if (filters.searchQuery) {
                const q = filters.searchQuery.toLowerCase();
                const textMatch =
                    e.substation?.name.toLowerCase().includes(q) ||
                    e.substation?.district?.toLowerCase().includes(q) ||
                    e.cell?.name.toLowerCase().includes(q) ||
                    e.tp?.name.toLowerCase().includes(q) ||
                    e.lines?.some(l => l.name.toLowerCase().includes(q)) ||
                    e.reasonCategory.toLowerCase().includes(q) ||
                    e.reasonSubcategory?.toLowerCase().includes(q) ||
                    e.measuresTaken?.toLowerCase().includes(q) ||
                    e.measuresPlanned?.toLowerCase().includes(q) ||
                    e.comment?.toLowerCase().includes(q);
                if (!textMatch) return false;
            }

            // 4. Date Range (inclusive)
            if (filters.dateStart || filters.dateEnd) {
                const eventDate = parseISO(e.timeStart);
                if (filters.dateStart) {
                    // Start of the selected day (00:00:00.000)
                    const startParts = filters.dateStart.split('-');
                    const start = new Date(Number(startParts[0]), Number(startParts[1]) - 1, Number(startParts[2]), 0, 0, 0, 0);
                    if (eventDate < start) return false;
                }
                if (filters.dateEnd) {
                    // End of the selected day (23:59:59.999)
                    const endParts = filters.dateEnd.split('-');
                    const end = new Date(Number(endParts[0]), Number(endParts[1]) - 1, Number(endParts[2]), 23, 59, 59, 999);
                    if (eventDate > end) return false;
                }
            }

            // 5. Object Filters (all independent)
            if (filters.substationId && e.substationId !== Number(filters.substationId)) return false;
            if (filters.cellId && e.cellId !== Number(filters.cellId)) return false;
            if (filters.lineId && !e.lines?.some(l => l.id === Number(filters.lineId))) return false;
            if (filters.tpId && e.tpId !== Number(filters.tpId)) return false;

            // 6. Object Property Filters
            if (filters.voltageClass) {
                const hasVoltage =
                    e.substation?.voltageClass === filters.voltageClass ||
                    e.cell?.voltageClass === filters.voltageClass ||
                    e.tp?.voltageClass === filters.voltageClass ||
                    e.lines?.some(l => l.voltageClass === filters.voltageClass);
                if (!hasVoltage) return false;
            }
            if (filters.district && e.substation?.district !== filters.district) return false;
            if (filters.lineType && !e.lines?.some(l => l.lineType === filters.lineType)) return false;

            // 7. Type
            if (filters.type && e.type !== filters.type) return false;

            // 8. Category / Subcategory
            if (filters.category && e.reasonCategory !== filters.category) return false;
            if (filters.subcategory && e.reasonSubcategory !== filters.subcategory) return false;

            // 9. Duration
            if (filters.durationMin || filters.durationMax) {
                const start = parseISO(e.timeStart);
                const end = e.timeEnd ? parseISO(e.timeEnd) : new Date();
                const durationMinutes = differenceInMinutes(end, start);
                if (filters.durationMin && durationMinutes < Number(filters.durationMin)) return false;
                if (filters.durationMax && durationMinutes > Number(filters.durationMax)) return false;
            }

            return true;
        });
    }, [events, filters]);


    const toggleStatus = async (event: Event, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.patch(`/events/${event.id}`, {
                isCompleted: !event.isCompleted,
                timeEnd: !event.isCompleted ? new Date().toISOString() : null
            });
            onRefresh();
        } catch (err) {
            console.error(err);
            alert('Не удалось изменить статус');
        }
    };

    const deleteEvent = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Вы действительно хотите удалить эту запись?')) return;
        try {
            await api.delete(`/events/${id}`);
            onRefresh();
        } catch (err) {
            console.error(err);
            alert('Ошибка при удалении');
        }
    };

    const statusColors: Record<string, string> = {
        'Аварийное': 'bg-rose-100 text-rose-700 border-rose-200',
        'Плановое': 'bg-blue-100 text-blue-700 border-blue-200',
        'Оперативное переключение': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'Превентивные меры': 'bg-amber-100 text-amber-700 border-amber-200',
        'ПЕРЕКЛЮЧЕНИЕ': 'bg-brand-500 text-white border-brand-600 shadow-sm',
    };

    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return { time: '--:--', date: '--.--.----' };
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return { time: '--:--', date: '--.--.----' };
        return {
            time: format(date, 'HH:mm'),
            date: format(date, 'dd.MM.yyyy', { locale: ru })
        };
    };

    const inputClass = "w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none placeholder:text-slate-400 font-normal shadow-sm hover:border-slate-300";
    const labelClass = "block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1";

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto animate-fade-in pb-10">

            {/* Header / Controls */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100">
                <div className="p-6 flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Оперативный журнал</h2>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{filteredEvents.length} событий</span>
                            {filters.status === 'active' && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold">Активные</span>}
                            {filters.status === 'completed' && <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold">Завершенные</span>}
                            {filters.showOverdueOnly && <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-xs font-bold">Просроченные</span>}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={clsx(
                                "flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all shadow-sm border-2",
                                isFilterOpen || activeFilterCount > 0 ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                            )}
                        >
                            <Filter size={18} />
                            Фильтры
                            {activeFilterCount > 0 && (
                                <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                    {activeFilterCount}
                                </span>
                            )}
                            {isFilterOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        {/* Quick Status Filters */}
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button
                                onClick={() => setFilters(prev => ({ ...prev, status: prev.status === 'active' ? '' : 'active' }))}
                                className={clsx(
                                    "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                                    filters.status === 'active' ? "bg-amber-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                Активные
                            </button>
                            <button
                                onClick={() => setFilters(prev => ({ ...prev, status: prev.status === 'completed' ? '' : 'completed' }))}
                                className={clsx(
                                    "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                                    filters.status === 'completed' ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                Завершенные
                            </button>
                        </div>

                        <button
                            onClick={() => setFilters(prev => ({ ...prev, showOverdueOnly: !prev.showOverdueOnly }))}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all border-2",
                                filters.showOverdueOnly ? "bg-rose-50 border-rose-300 text-rose-700" : "bg-white border-slate-200 text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <div className={clsx("w-2 h-2 rounded-full", filters.showOverdueOnly ? "bg-rose-500" : "bg-slate-300")} />
                            Просроч.
                        </button>

                        <button
                            onClick={() => { setEditingEvent(null); setIsFormOpen(true); }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                        >
                            <Edit2 size={18} />
                            Добавить
                        </button>
                    </div>
                </div>

                {/* Advanced Filter Panel */}
                <div className={clsx(
                    "border-t border-slate-100 bg-gradient-to-b from-slate-50 to-white transition-all duration-300 ease-in-out rounded-b-[2rem]",
                    isFilterOpen ? "max-h-[800px] opacity-100 p-6" : "max-h-0 opacity-0",
                    allowOverflow ? "overflow-visible" : "overflow-hidden"
                )}>
                    <div className="space-y-6">

                        {/* Row 1: Search & Dates */}
                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-5">
                                <label className={labelClass}>Поиск по всем полям</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Название, причина, комментарий..."
                                        className={clsx(inputClass, "pl-10")}
                                        value={filters.searchQuery}
                                        onChange={e => setFilters(p => ({ ...p, searchQuery: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className={labelClass}>Дата от</label>
                                <input
                                    type="date"
                                    className={inputClass}
                                    value={filters.dateStart}
                                    onChange={e => setFilters(p => ({ ...p, dateStart: e.target.value }))}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className={labelClass}>Дата до</label>
                                <input
                                    type="date"
                                    className={inputClass}
                                    value={filters.dateEnd}
                                    onChange={e => setFilters(p => ({ ...p, dateEnd: e.target.value }))}
                                />
                            </div>
                            <div className="col-span-3">
                                <label className={labelClass}>Длительность (мин)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        className={inputClass}
                                        placeholder="От"
                                        value={filters.durationMin}
                                        onChange={e => setFilters(p => ({ ...p, durationMin: e.target.value }))}
                                    />
                                    <span className="text-slate-400 self-center">—</span>
                                    <input
                                        type="number"
                                        min="0"
                                        className={inputClass}
                                        placeholder="До"
                                        value={filters.durationMax}
                                        onChange={e => setFilters(p => ({ ...p, durationMax: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Objects - All Independent */}
                        <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
                            <div className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                Объекты сети (независимые фильтры)
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                <div>
                                    <label className={labelClass}>Подстанция</label>
                                    <Select
                                        value={filters.substationId}
                                        onChange={(v: any) => setFilters(p => ({ ...p, substationId: v }))}
                                        options={[
                                            { value: '', label: 'Все подстанции' },
                                            ...(refData?.substations.map(s => ({ value: s.id, label: s.name })) || [])
                                        ]}
                                        placeholder="Все подстанции"
                                        searchable
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Ячейка</label>
                                    <Select
                                        value={filters.cellId}
                                        onChange={(v: any) => setFilters(p => ({ ...p, cellId: v }))}
                                        options={[
                                            { value: '', label: 'Все ячейки' },
                                            ...(refData?.substations.flatMap(s => s.cells.map(c => ({
                                                value: c.id,
                                                label: `${c.name} (${s.name})`
                                            }))) || [])
                                        ]}
                                        placeholder="Все ячейки"
                                        searchable
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Линия / Фидер</label>
                                    <Select
                                        value={filters.lineId}
                                        onChange={(v: any) => setFilters(p => ({ ...p, lineId: v }))}
                                        options={[
                                            { value: '', label: 'Все линии' },
                                            ...(refData?.lines.map(l => ({ value: l.id, label: l.name })) || [])
                                        ]}
                                        placeholder="Все линии"
                                        searchable
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>ТП</label>
                                    <Select
                                        value={filters.tpId}
                                        onChange={(v: any) => setFilters(p => ({ ...p, tpId: v }))}
                                        options={[
                                            { value: '', label: 'Все ТП' },
                                            ...(refData?.tps.map(t => ({ value: t.id, label: t.name })) || [])
                                        ]}
                                        placeholder="Все ТП"
                                        searchable
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Row 3: Object Properties */}
                        <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-100">
                            <div className="text-xs font-bold text-purple-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                Свойства объектов
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className={labelClass}>Класс напряжения</label>
                                    <Select
                                        value={filters.voltageClass}
                                        onChange={(v: any) => setFilters(p => ({ ...p, voltageClass: v }))}
                                        options={[
                                            { value: '', label: 'Любой класс' },
                                            ...uniqueVoltageClasses.map(vc => ({ value: vc, label: vc }))
                                        ]}
                                        placeholder="Любой класс"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Район / РЭС</label>
                                    <Select
                                        value={filters.district}
                                        onChange={(v: any) => setFilters(p => ({ ...p, district: v }))}
                                        options={[
                                            { value: '', label: 'Все районы' },
                                            ...uniqueDistricts.map(d => ({ value: d, label: d }))
                                        ]}
                                        placeholder="Все районы"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Тип линии</label>
                                    <Select
                                        value={filters.lineType}
                                        onChange={(v: any) => setFilters(p => ({ ...p, lineType: v }))}
                                        options={[
                                            { value: '', label: 'Все типы' },
                                            ...uniqueLineTypes.map(lt => ({ value: lt, label: lt }))
                                        ]}
                                        placeholder="Все типы"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Row 4: Event Properties */}
                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-4">
                                <label className={labelClass}>Тип события</label>
                                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                                    {['', 'Аварийное', 'Плановое', 'Оперативное переключение'].map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setFilters(p => ({ ...p, type: t }))}
                                            className={clsx(
                                                "flex-1 px-2 py-2 rounded-lg text-xs font-semibold transition-all text-center",
                                                filters.type === t
                                                    ? "bg-white text-slate-800 shadow-sm"
                                                    : "text-slate-500 hover:text-slate-700"
                                            )}
                                        >
                                            {t || 'Все'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="col-span-4">
                                <label className={labelClass}>Категория причины</label>
                                <Select
                                    value={filters.category}
                                    onChange={(val) => setFilters(p => ({ ...p, category: val, subcategory: '' }))}
                                    options={[
                                        { value: '', label: 'Все категории' },
                                        ...(refData?.reasons ? Object.keys(refData.reasons).map(k => ({ value: k, label: k })) : [])
                                    ]}
                                    placeholder="Все категории"
                                    searchable
                                />
                            </div>
                            <div className="col-span-4">
                                <label className={labelClass}>Подкатегория</label>
                                <Select
                                    value={filters.subcategory}
                                    onChange={(val) => setFilters(p => ({ ...p, subcategory: val }))}
                                    options={[
                                        { value: '', label: 'Все подкатегории' },
                                        ...(filters.category && refData?.reasons?.[filters.category]
                                            ? refData.reasons[filters.category].map((s: string) => ({ value: s, label: s }))
                                            : [])
                                    ]}
                                    placeholder="Все подкатегории"
                                    disabled={!filters.category}
                                    searchable
                                />
                            </div>
                        </div>

                        {/* Reset Button */}
                        <div className="flex justify-between items-center pt-2">
                            <div className="text-sm text-slate-500">
                                Найдено: <span className="font-bold text-slate-800">{filteredEvents.length}</span> из {events.length}
                            </div>
                            <button
                                onClick={resetFilters}
                                className="text-slate-600 font-semibold text-sm bg-white border border-slate-200 rounded-xl px-5 py-2.5 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center gap-2"
                            >
                                <X size={14} />
                                Сбросить все фильтры
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Events List */}
            <div className="space-y-3">
                {filteredEvents.map(event => {
                    const start = formatDateTime(event.timeStart);
                    const end = event.timeEnd ? formatDateTime(event.timeEnd) : null;

                    // Расчёт продолжительности
                    const startDate = parseISO(event.timeStart);
                    const endDate = event.timeEnd ? parseISO(event.timeEnd) : new Date();
                    const durationMins = differenceInMinutes(endDate, startDate);
                    const hours = Math.floor(durationMins / 60);
                    const mins = durationMins % 60;
                    const durationText = hours > 0 ? `${hours}ч ${mins}м` : `${mins}м`;

                    return (
                        <div
                            key={event.id}
                            onClick={() => { setEditingEvent(event); setIsFormOpen(true); }}
                            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group"
                        >
                            <div className="flex items-start gap-5">
                                {/* Time Block */}
                                <div className="flex flex-col items-center min-w-[90px] py-2 px-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="font-mono font-bold text-2xl text-slate-800">{start.time}</span>
                                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{start.date}</span>
                                    {end ? (
                                        <div className="mt-2 pt-2 border-t border-slate-200 w-full text-center">
                                            <span className="font-mono font-bold text-lg text-emerald-600">{end.time}</span>
                                            <div className="text-[9px] text-emerald-500 font-bold uppercase">Завершено</div>
                                        </div>
                                    ) : (
                                        <div className="mt-2 pt-2 border-t border-slate-200 w-full text-center">
                                            <div className="flex items-center justify-center gap-1 text-amber-500">
                                                <Clock size={12} className="animate-pulse" />
                                                <span className="text-[10px] font-bold uppercase">Активно</span>
                                            </div>
                                        </div>
                                    )}
                                    {/* Продолжительность */}
                                    <div className="mt-2 pt-2 border-t border-slate-200 w-full text-center">
                                        <div className="text-[10px] text-slate-400 font-medium uppercase">Длит.</div>
                                        <div className="font-mono font-bold text-sm text-slate-600">{durationText}</div>
                                    </div>
                                </div>

                                {/* Main Content */}
                                <div className="flex-1 min-w-0">
                                    {/* Header Row */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className={clsx(
                                            "px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide",
                                            statusColors[event.type] || 'bg-slate-100 text-slate-600'
                                        )}>
                                            {event.type}
                                        </span>
                                        <span className="text-xs text-slate-400 font-medium">
                                            {event.reasonCategory}
                                        </span>
                                    </div>

                                    {/* Location Grid */}
                                    <div className="grid grid-cols-4 gap-3 mb-3">
                                        {/* Substation */}
                                        <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                                            <div className="text-[9px] font-bold text-blue-400 uppercase tracking-wide mb-1">Подстанция</div>
                                            <div className="font-bold text-blue-800 text-sm truncate">
                                                {event.substation?.name || <span className="text-slate-300">—</span>}
                                            </div>
                                            {event.substation?.voltageClass && (
                                                <div className="text-[10px] text-blue-600 mt-0.5">{event.substation.voltageClass}</div>
                                            )}
                                        </div>

                                        {/* Cell */}
                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">Ячейка</div>
                                            <div className="font-bold text-slate-800 text-sm truncate">
                                                {event.cell?.name || <span className="text-slate-300">—</span>}
                                            </div>
                                            {event.cell?.voltageClass && (
                                                <div className="text-[10px] text-amber-600 mt-0.5">{event.cell.voltageClass}</div>
                                            )}
                                        </div>

                                        {/* Line */}
                                        <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                                            <div className="text-[9px] font-bold text-purple-400 uppercase tracking-wide mb-1">Линия / Фидер</div>
                                            <div className="font-bold text-purple-800 text-sm truncate">
                                                {event.lines && event.lines.length > 0
                                                    ? event.lines[0].name
                                                    : <span className="text-slate-300">—</span>}
                                            </div>
                                            {event.lines && event.lines[0]?.voltageClass && (
                                                <div className="text-[10px] text-purple-600 mt-0.5">{event.lines[0].voltageClass}</div>
                                            )}
                                        </div>

                                        {/* TP */}
                                        <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                                            <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-wide mb-1">ТП</div>
                                            <div className="font-bold text-emerald-800 text-sm truncate">
                                                {event.tps && event.tps.length > 0
                                                    ? event.tps.map(t => t.name).join(', ')
                                                    : event.tp?.name || <span className="text-slate-300">—</span>}
                                            </div>
                                            {(event.tps && event.tps.length > 0 ? event.tps[0]?.capacity : event.tp?.capacity) && (
                                                <div className="text-[10px] text-emerald-600 mt-0.5">
                                                    {event.tps && event.tps.length > 0 ? event.tps[0].capacity : event.tp?.capacity}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Reason */}
                                    <div className="text-sm text-slate-600">
                                        <span className="text-slate-400 mr-2">Причина:</span>
                                        <span className="font-medium">{event.reasonSubcategory || event.reasonCategory}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col items-end gap-2 ml-4">
                                    <button
                                        onClick={(e) => toggleStatus(event, e)}
                                        className={clsx(
                                            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all",
                                            event.isCompleted
                                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                                : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                        )}
                                    >
                                        <div className={clsx(
                                            "w-2 h-2 rounded-full",
                                            event.isCompleted ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                                        )} />
                                        {event.isCompleted ? 'Выполнено' : 'В работе'}
                                    </button>

                                    <button
                                        onClick={(e) => deleteEvent(event.id, e)}
                                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filteredEvents.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
                        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search size={24} className="text-slate-300" />
                        </div>
                        <h3 className="text-slate-900 font-bold text-lg">Событий не найдено</h3>
                        <p className="text-slate-500">Попробуйте изменить параметры фильтрации</p>
                    </div>
                )}
            </div>

            {
                isFormOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                        <div className="w-full max-w-7xl h-full md:h-auto max-h-[95vh] bg-transparent rounded-3xl overflow-hidden animate-slide-up flex items-center justify-center">
                            <div className="w-full h-full max-w-7xl">
                                <EventForm
                                    initialData={editingEvent}
                                    substations={refData?.substations || []}
                                    tps={refData?.tps || []}
                                    lines={refData?.lines || []}
                                    reasons={refData?.reasons || {}} // Handle legacy or new prop structure
                                    onSuccess={() => { setIsFormOpen(false); setEditingEvent(null); onRefresh(); }}
                                    onCancel={() => { setIsFormOpen(false); setEditingEvent(null); }}
                                />
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
