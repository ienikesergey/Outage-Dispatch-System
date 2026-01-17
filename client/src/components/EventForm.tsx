import React, { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';
import type { Substation, Event, Tp, Line } from '../types';
import { Check, X, Plus, MapPin, Clock, AlertTriangle, FileText } from 'lucide-react';
import clsx from 'clsx';
import { Select } from './ui/Select';

interface Props {
    substations: Substation[];
    tps: Tp[];
    lines: Line[];
    reasons: Record<string, string[]>;
    onSuccess: () => void;
    initialData?: Event | null;
    onCancel?: () => void;
}

export const EventForm: React.FC<Props> = ({ substations, tps, lines: allLines, reasons, onSuccess, initialData, onCancel }) => {
    // State
    const [substationId, setSubstationId] = useState<number | ''>('');
    const [cellId, setCellId] = useState<number | ''>('');
    const [tpIds, setTpIds] = useState<number[]>([]);
    const [lineId, setLineId] = useState<number | ''>('');

    const [type, setType] = useState('Аварийное');
    const [category, setCategory] = useState('');
    const [subcategory, setSubcategory] = useState('');

    const [timeStart, setTimeStart] = useState('');
    const [timeEnd, setTimeEnd] = useState('');
    const [measuresPlanned, setMeasuresPlanned] = useState('');
    const [deadlineDate, setDeadlineDate] = useState('');
    const [measuresTaken, setMeasuresTaken] = useState('');
    const [comment, setComment] = useState('');
    const [isCompleted, setIsCompleted] = useState(false);

    // Initialization Effect
    useEffect(() => {
        if (initialData) {
            setSubstationId(initialData.substationId || '');
            setCellId(initialData.cellId || '');
            // Поддержка множественного выбора ТП
            if (initialData.tps && initialData.tps.length > 0) {
                setTpIds(initialData.tps.map((t: any) => t.id));
            } else if (initialData.tpId) {
                setTpIds([initialData.tpId]);
            } else {
                setTpIds([]);
            }
            if (initialData.lines && initialData.lines.length > 0) {
                setLineId(initialData.lines[0].id);
            }
            setType(initialData.type || 'Аварийное');
            setCategory(initialData.reasonCategory || '');
            setSubcategory(initialData.reasonSubcategory || '');
            setTimeStart(initialData.timeStart || '');
            setTimeEnd(initialData.timeEnd || '');
            setMeasuresPlanned(initialData.measuresPlanned || '');
            setDeadlineDate(initialData.deadlineDate || '');
            setMeasuresTaken(initialData.measuresTaken || '');
            setComment(initialData.comment || '');
            setIsCompleted(Boolean(initialData.isCompleted));
        }
    }, [initialData]);

    // List of subcategories for selected category
    const subcategories = reasons[category] || [];

    // Cascading Filtering - only for Cells under Substation
    const filteredCells = substationId
        ? substations.find(s => s.id === Number(substationId))?.cells || []
        : [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!substationId && tpIds.length === 0 && !lineId) {
            return alert('Выберите хотя бы один объект (ПС, Линию или ТП)');
        }

        if (!timeStart) {
            return alert('Укажите время начала события');
        }

        if (!category || !subcategory) {
            return alert('Укажите категорию и подкатегорию');
        }

        const payload = {
            substationId: substationId ? Number(substationId) : null,
            cellId: cellId ? Number(cellId) : null,
            tpIds: tpIds,
            lineIds: lineId ? [Number(lineId)] : [],
            type,
            reasonCategory: category,
            reasonSubcategory: subcategory,
            timeStart,
            timeEnd: timeEnd || null,
            measuresPlanned,
            deadlineDate: deadlineDate || null,
            measuresTaken,
            comment,
            isCompleted
        };

        try {
            if (initialData) await api.put(`/events/${initialData.id}`, payload);
            else await api.post('/events', payload);

            onSuccess();
            if (!initialData) {
                setComment(''); setMeasuresPlanned(''); setMeasuresTaken(''); setIsCompleted(false);
            }
        } catch (err) {
            alert('Ошибка при сохранении события');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white mx-auto overflow-hidden flex flex-col h-[calc(100vh-140px)] rounded-3xl shadow-2xl border border-slate-200/80">

            {/* Header */}
            <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-6 flex justify-between items-center border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-4">
                    <div className={clsx(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg",
                        initialData ? "bg-blue-500 shadow-blue-200" : "bg-emerald-500 shadow-emerald-200"
                    )}>
                        {initialData ? <FileText className="text-white" size={22} /> : <Plus className="text-white" size={24} />}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                            {initialData ? 'Редактирование события' : 'Новое отключение'}
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">Заполните информацию о событии</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Status Toggle */}
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner">
                        <button
                            type="button"
                            onClick={() => setIsCompleted(false)}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm font-semibold",
                                !isCompleted
                                    ? "bg-white text-amber-600 shadow-md"
                                    : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <div className={clsx("w-2 h-2 rounded-full", !isCompleted ? "bg-amber-500 animate-pulse" : "bg-slate-300")} />
                            В работе
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsCompleted(true)}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm font-semibold",
                                isCompleted
                                    ? "bg-white text-emerald-600 shadow-md"
                                    : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <div className={clsx("w-2 h-2 rounded-full", isCompleted ? "bg-emerald-500" : "bg-slate-300")} />
                            Завершено
                        </button>
                    </div>

                    {onCancel && (
                        <button type="button" onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                            <X size={22} />
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto px-8 py-8 bg-gradient-to-b from-slate-50/50 to-white">
                <div className="max-w-5xl mx-auto space-y-8">

                    {/* Section 1: Location */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                <MapPin size={16} className="text-blue-600" />
                            </div>
                            <h3 className="font-bold text-slate-800">Место события</h3>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Подстанция</label>
                                <Select
                                    value={substationId}
                                    onChange={(v) => { setSubstationId(v ? Number(v) : ''); setCellId(''); }}
                                    options={substations.map(s => ({ value: s.id, label: s.name }))}
                                    placeholder="Выберите ПС..."
                                    searchable
                                    clearable
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Ячейка</label>
                                <Select
                                    value={cellId}
                                    onChange={(v) => setCellId(v ? Number(v) : '')}
                                    options={filteredCells.map(c => ({ value: c.id, label: c.name }))}
                                    placeholder={substationId ? "Выберите..." : "Сначала ПС"}
                                    disabled={!substationId}
                                    clearable
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Линия / Фидер</label>
                                <Select
                                    value={lineId}
                                    onChange={(v) => setLineId(v ? Number(v) : '')}
                                    options={allLines.map(l => ({ value: l.id, label: l.name }))}
                                    placeholder="Выберите линию..."
                                    searchable
                                    clearable
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">ТП (можно несколько)</label>
                                {/* Выбранные ТП */}
                                {tpIds.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {tpIds.map(tid => {
                                            const tp = tps.find(t => t.id === tid);
                                            return tp ? (
                                                <span key={tid} className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-xs font-medium">
                                                    {tp.name}
                                                    <button type="button" onClick={() => setTpIds(tpIds.filter(id => id !== tid))} className="hover:text-emerald-900">×</button>
                                                </span>
                                            ) : null;
                                        })}
                                    </div>
                                )}
                                <Select
                                    value=""
                                    onChange={(v) => { if (v && !tpIds.includes(Number(v))) setTpIds([...tpIds, Number(v)]); }}
                                    options={tps.filter(t => !tpIds.includes(t.id)).map(t => ({ value: t.id, label: t.name }))}
                                    placeholder={tpIds.length > 0 ? "Добавить ещё..." : "Выберите ТП..."}
                                    searchable
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Event Type & Reason */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                <AlertTriangle size={16} className="text-amber-600" />
                            </div>
                            <h3 className="font-bold text-slate-800">Тип и причина</h3>
                        </div>

                        {/* Event Type Pills */}
                        <div className="mb-5">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Тип события</label>
                            <div className="flex gap-2">
                                {['Аварийное', 'Плановое', 'Оперативное переключение', 'Превентивные меры'].map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setType(t)}
                                        className={clsx(
                                            "px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border-2",
                                            type === t
                                                ? t === 'Аварийное' ? "bg-rose-50 border-rose-300 text-rose-700"
                                                    : t === 'Плановое' ? "bg-blue-50 border-blue-300 text-blue-700"
                                                        : t === 'Оперативное переключение' ? "bg-purple-50 border-purple-300 text-purple-700"
                                                            : "bg-emerald-50 border-emerald-300 text-emerald-700"
                                                : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300"
                                        )}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                                    Категория <span className="text-rose-500">*</span>
                                </label>
                                <Select
                                    value={category}
                                    onChange={(v) => { setCategory(String(v)); setSubcategory(''); }}
                                    options={Object.keys(reasons).map(k => ({ value: k, label: k }))}
                                    placeholder="Выберите категорию..."
                                    searchable
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                                    Подкатегория <span className="text-rose-500">*</span>
                                </label>
                                <Select
                                    value={subcategory}
                                    onChange={(v) => setSubcategory(String(v))}
                                    options={subcategories.map(s => ({ value: s, label: s }))}
                                    placeholder={category ? "Уточните причину..." : "Сначала категорию"}
                                    disabled={!category}
                                    searchable
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Time */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                                <Clock size={16} className="text-violet-600" />
                            </div>
                            <h3 className="font-bold text-slate-800">Время и сроки</h3>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                                    Начало <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none shadow-sm hover:border-slate-400"
                                    value={timeStart}
                                    onChange={e => setTimeStart(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Окончание</label>
                                <input
                                    type="datetime-local"
                                    className={clsx(
                                        "w-full bg-white border text-slate-900 text-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none shadow-sm hover:border-slate-400",
                                        timeEnd && timeStart && timeEnd < timeStart ? "border-rose-400 bg-rose-50" : "border-slate-300"
                                    )}
                                    value={timeEnd}
                                    onChange={e => setTimeEnd(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Контрольный срок</label>
                                <input
                                    type="date"
                                    className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none shadow-sm hover:border-slate-400"
                                    value={deadlineDate}
                                    onChange={e => setDeadlineDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Details */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                <FileText size={16} className="text-slate-600" />
                            </div>
                            <h3 className="font-bold text-slate-800">Описание и результаты</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Запланированные меры</label>
                                <textarea
                                    className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none shadow-sm hover:border-slate-400 resize-none h-28"
                                    value={measuresPlanned}
                                    onChange={e => setMeasuresPlanned(e.target.value)}
                                    placeholder="Опишите план работ..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Выполненные работы / Комментарий</label>
                                <textarea
                                    className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none shadow-sm hover:border-slate-400 resize-none h-28"
                                    value={measuresTaken}
                                    onChange={e => setMeasuresTaken(e.target.value)}
                                    placeholder="Что было сделано..."
                                />
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-slate-200 px-8 py-5 flex justify-between items-center shrink-0">
                {initialData ? (
                    <button type="button" className="text-rose-500 text-sm font-semibold hover:bg-rose-50 px-5 py-2.5 rounded-xl transition-colors">
                        Удалить событие
                    </button>
                ) : <div />}

                <div className="flex gap-3">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-6 py-3 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 transition-colors text-sm"
                        >
                            Отменить
                        </button>
                    )}
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/25 transform hover:-translate-y-0.5 active:translate-y-0 transition-all text-sm flex items-center gap-2"
                    >
                        {initialData ? <><Check size={18} /> Сохранить</> : <><Plus size={18} /> Создать событие</>}
                    </button>
                </div>
            </div>
        </form>
    );
};
