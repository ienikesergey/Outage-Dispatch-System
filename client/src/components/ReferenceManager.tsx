import React, { useState } from 'react';
import type { ReferenceData } from '../types';
import { api } from '../context/AuthContext';
import {
    Plus, Zap, Trash2,
    Box, GitBranch, Edit2, Check, X,
    Cpu
} from 'lucide-react';
import clsx from 'clsx';

interface Props {
    data: ReferenceData;
    onRefresh: () => void;
}

export const ReferenceManager: React.FC<Props> = ({ data, onRefresh }) => {
    // State
    const [activeTab, setActiveTab] = useState<'substations' | 'cells' | 'tps' | 'lines'>('substations');
    const [newFields, setNewFields] = useState<Record<string, string>>({});

    // For specific additions
    const [selectedSubstationId, setSelectedSubstationId] = useState<number | ''>('');

    // Edit State
    const [editingState, setEditingState] = useState<{ id: number, type: 'substations' | 'cells' | 'tps' | 'lines', fields: Record<string, string> } | null>(null);

    // Handlers
    const handleAdd = async () => {
        if (!newFields.name?.trim()) return;
        try {
            const payload = { ...newFields };
            if (activeTab === 'substations') {
                await api.post('/substations', payload);
            } else if (activeTab === 'cells') {
                if (!selectedSubstationId) return alert('Выберите подстанцию');
                await api.post('/cells', { ...payload, substationId: Number(selectedSubstationId) });
            } else if (activeTab === 'tps') {
                await api.post('/tps', payload);
            } else if (activeTab === 'lines') {
                await api.post('/lines', payload);
            }
            setNewFields({});
            onRefresh();
        } catch (e) { alert('Ошибка при сохранении'); }
    };

    const handleDelete = async (endpoint: string, id: number) => {
        if (!confirm('Удалить запись?')) return;
        try {
            await api.delete(`/${endpoint}/${id}`);
            onRefresh();
        } catch (e: any) { alert(e.response?.data?.error || 'Ошибка'); }
    };

    // Edit Handlers
    // Edit Handlers
    const startEditing = (id: number, type: 'substations' | 'cells' | 'tps' | 'lines', currentFields: Record<string, any>) => {
        const fields: Record<string, string> = {};
        Object.entries(currentFields).forEach(([k, v]) => {
            if (typeof v === 'string' || v === null) fields[k] = v || '';
        });
        setEditingState({ id, type, fields });
    };

    const cancelEditing = () => {
        setEditingState(null);
    };

    const saveEditing = async () => {
        if (!editingState) return;
        try {
            await api.put(`/${editingState.type}/${editingState.id}`, editingState.fields);
            setEditingState(null);
            onRefresh();
        } catch (e: any) {
            alert(e.response?.data?.error || 'Ошибка при сохранении');
        }
    };

    // Components
    const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
        <button
            onClick={() => { setActiveTab(id); setNewFields({}); setEditingState(null); }}
            className={clsx(
                "flex-1 flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 whitespace-nowrap",
                activeTab === id
                    ? "text-slate-800 shadow-sm bg-white ring-1 ring-black/5"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            )}
        >
            <Icon size={16} className={clsx("transition-transform", activeTab === id ? "text-brand-600 scale-105" : "text-slate-400")} />
            {label}
        </button>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-2">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Справочники</h2>
                    <p className="text-slate-500 mt-1">Управление объектами сети</p>
                </div>

                {/* Tabs - Apple Segmented Control Style */}
                <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1.5 w-full md:w-auto shadow-inner border border-slate-200/50 flex-wrap">
                    <TabButton id="substations" label="ПС" icon={Zap} />
                    <TabButton id="cells" label="Ячейки" icon={Box} />
                    <TabButton id="tps" label="ТП" icon={Cpu} />
                    <TabButton id="lines" label="Линии / Фидеры" icon={GitBranch} />
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-[2.5rem] shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden min-h-[600px] flex flex-col">

                {/* Add New Section */}
                <div className="p-8 border-b border-slate-50 bg-white">
                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            {activeTab === 'cells' && (
                                <div className="flex gap-2 w-full md:w-auto">
                                    <select
                                        className="w-full md:w-64 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all cursor-pointer"
                                        value={selectedSubstationId}
                                        onChange={e => setSelectedSubstationId(Number(e.target.value))}
                                    >
                                        <option value="">Выберите объект...</option>
                                        {data.substations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div className="flex-1 flex gap-3 w-full">
                                <input
                                    type="text"
                                    placeholder={
                                        activeTab === 'substations' ? "Название подстанции..." :
                                            activeTab === 'cells' ? "Название ячейки..." :
                                                activeTab === 'tps' ? "Название ТП..." :
                                                    "Название линии / фидера..."
                                    }
                                    className="flex-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                                    value={newFields.name || ''}
                                    onChange={e => setNewFields({ ...newFields, name: e.target.value })}
                                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                                />
                                <button
                                    onClick={handleAdd}
                                    disabled={!newFields.name}
                                    className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center"
                                >
                                    <Plus size={20} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>

                        {/* Extra Fields for Add */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {activeTab === 'substations' && (
                                <>
                                    <input
                                        type="text"
                                        placeholder="Класс напряжения"
                                        className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all"
                                        value={newFields.voltageClass || ''}
                                        onChange={e => setNewFields({ ...newFields, voltageClass: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Район (РЭС)"
                                        className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all"
                                        value={newFields.district || ''}
                                        onChange={e => setNewFields({ ...newFields, district: e.target.value })}
                                    />
                                </>
                            )}
                            {activeTab === 'tps' && (
                                <>
                                    <input
                                        type="text"
                                        placeholder="Класс напряжения"
                                        className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all"
                                        value={newFields.voltageClass || ''}
                                        onChange={e => setNewFields({ ...newFields, voltageClass: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Мощность (кВА)"
                                        className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all"
                                        value={newFields.capacity || ''}
                                        onChange={e => setNewFields({ ...newFields, capacity: e.target.value })}
                                    />
                                </>
                            )}
                            {activeTab === 'lines' && (
                                <>
                                    <input
                                        type="text"
                                        placeholder="Класс напряжения"
                                        className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all"
                                        value={newFields.voltageClass || ''}
                                        onChange={e => setNewFields({ ...newFields, voltageClass: e.target.value })}
                                    />
                                    <select
                                        className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all"
                                        value={newFields.lineType || ''}
                                        onChange={e => setNewFields({ ...newFields, lineType: e.target.value })}
                                    >
                                        <option value="">Тип линии...</option>
                                        <option value="ВЛ">ВЛ (Воздушная)</option>
                                        <option value="КЛ">КЛ (Кабельная)</option>
                                    </select>
                                </>
                            )}
                            {activeTab === 'cells' && (
                                <input
                                    type="text"
                                    placeholder="Класс напряжения"
                                    className="px-5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all"
                                    value={newFields.voltageClass || ''}
                                    onChange={e => setNewFields({ ...newFields, voltageClass: e.target.value })}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {activeTab === 'substations' && (
                        <div className="space-y-2">
                            {data.substations.map(s => (
                                <div key={s.id} className="group flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all cursor-default border border-transparent hover:border-slate-100">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm bg-brand-50 text-brand-600">
                                            {s.name.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            {editingState?.id === s.id && editingState.type === 'substations' ? (
                                                <div className="flex flex-col gap-2">
                                                    <input
                                                        autoFocus
                                                        className="w-full px-3 py-1 bg-white border border-brand-300 rounded-lg text-sm"
                                                        value={editingState.fields.name || ''}
                                                        onChange={e => setEditingState({ ...editingState, fields: { ...editingState.fields, name: e.target.value } })}
                                                    />
                                                    <div className="flex gap-2">
                                                        <input
                                                            placeholder="Напряжение"
                                                            className="flex-1 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                                                            value={editingState.fields.voltageClass || ''}
                                                            onChange={e => setEditingState({ ...editingState, fields: { ...editingState.fields, voltageClass: e.target.value } })}
                                                        />
                                                        <input
                                                            placeholder="Район"
                                                            className="flex-1 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                                                            value={editingState.fields.district || ''}
                                                            onChange={e => setEditingState({ ...editingState, fields: { ...editingState.fields, district: e.target.value } })}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="font-bold text-slate-800 text-[15px]">{s.name}</div>
                                                    <div className="text-xs font-medium text-slate-400 mt-0.5">
                                                        {s.voltageClass && <span className="mr-2 text-brand-500">{s.voltageClass}</span>}
                                                        {s.district && <span className="mr-2">{s.district}</span>}
                                                        {s.cells?.length || 0} ячеек
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                        {editingState?.id === s.id && editingState.type === 'substations' ? (
                                            <>
                                                <button onClick={saveEditing} className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors">
                                                    <Check size={18} />
                                                </button>
                                                <button onClick={cancelEditing} className="p-2.5 bg-slate-50 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                                                    <X size={18} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => startEditing(s.id, 'substations', s)} className="p-2.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete('substations', s.id)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                                    <Trash2 size={18} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'tps' && (
                        <div className="space-y-2">
                            {data.tps?.map(s => (
                                <div key={s.id} className="group flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all cursor-default border border-transparent hover:border-slate-100">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm bg-amber-50 text-amber-600">
                                            Т
                                        </div>
                                        <div className="flex-1">
                                            {editingState?.id === s.id && editingState.type === 'tps' ? (
                                                <div className="flex flex-col gap-2">
                                                    <input
                                                        autoFocus
                                                        className="w-full px-3 py-1 bg-white border border-brand-300 rounded-lg text-sm"
                                                        value={editingState.fields.name || ''}
                                                        onChange={e => setEditingState({ ...editingState, fields: { ...editingState.fields, name: e.target.value } })}
                                                    />
                                                    <div className="flex gap-2">
                                                        <input
                                                            placeholder="Напряжение"
                                                            className="flex-1 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                                                            value={editingState.fields.voltageClass || ''}
                                                            onChange={e => setEditingState({ ...editingState, fields: { ...editingState.fields, voltageClass: e.target.value } })}
                                                        />
                                                        <input
                                                            placeholder="Мощность"
                                                            className="flex-1 px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                                                            value={editingState.fields.capacity || ''}
                                                            onChange={e => setEditingState({ ...editingState, fields: { ...editingState.fields, capacity: e.target.value } })}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="font-bold text-slate-800 text-[15px]">{s.name}</div>
                                                    <div className="text-xs font-medium text-slate-400 mt-0.5 flex flex-wrap gap-x-2 gap-y-1">
                                                        {s.voltageClass && <span className="text-amber-600 font-bold">{s.voltageClass}</span>}
                                                        {s.capacity && <span>{s.capacity}</span>}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                        {editingState?.id === s.id && editingState.type === 'tps' ? (
                                            <>
                                                <button onClick={saveEditing} className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors">
                                                    <Check size={18} />
                                                </button>
                                                <button onClick={cancelEditing} className="p-2.5 bg-slate-50 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                                                    <X size={18} />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => startEditing(s.id, 'tps', s)} className="p-2.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete('tps', s.id)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                                    <Trash2 size={18} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'cells' && (
                        <div className="space-y-8">
                            {data.substations.map(ps => (
                                <div key={ps.id}>
                                    <div className="sticky top-0 bg-white/95 backdrop-blur-sm p-3 z-10 border-b border-slate-50 mb-2">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
                                            {ps.name}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {ps.cells && ps.cells.length > 0 ? ps.cells.map(c => (
                                            <div key={c.id} className="group flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-brand-200 hover:shadow-md transition-all">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                                        <div className="p-2 bg-white rounded-lg shadow-sm text-slate-400">
                                                            <Box size={16} />
                                                        </div>

                                                        {editingState?.id === c.id && editingState.type === 'cells' ? (
                                                            <input
                                                                autoFocus
                                                                className="w-full px-2 py-1 bg-white border border-brand-300 rounded text-sm"
                                                                value={editingState.fields.name || ''}
                                                                onChange={e => setEditingState({ ...editingState, fields: { ...editingState.fields, name: e.target.value } })}
                                                            />
                                                        ) : (
                                                            <span className="text-sm font-semibold text-slate-700 truncate">{c.name}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {editingState?.id === c.id && editingState.type === 'cells' ? (
                                                            <div className="flex gap-1 ml-2">
                                                                <button onClick={saveEditing} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><Check size={14} /></button>
                                                                <button onClick={cancelEditing} className="p-1.5 bg-slate-100 text-slate-400 rounded-lg"><X size={14} /></button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex gap-1 ml-2">
                                                                <button onClick={() => startEditing(c.id, 'cells', c)} className="p-1.5 text-slate-300 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                                                                    <Edit2 size={14} />
                                                                </button>
                                                                <button onClick={() => handleDelete('cells', c.id)} className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {editingState?.id === c.id && editingState.type === 'cells' ? (
                                                    <input
                                                        placeholder="Напряжение"
                                                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs mt-1"
                                                        value={editingState.fields.voltageClass || ''}
                                                        onChange={e => setEditingState({ ...editingState, fields: { ...editingState.fields, voltageClass: e.target.value } })}
                                                    />
                                                ) : (
                                                    <div className="text-[10px] text-slate-400 font-medium ml-11">
                                                        {c.voltageClass || '—'}
                                                    </div>
                                                )}
                                            </div>
                                        )) : (
                                            <div className="col-span-full p-6 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                                Нет ячеек
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}


                    {activeTab === 'lines' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {data.lines.map(l => (
                                <div key={l.id} className="group flex items-start justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-brand-200 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className="p-2 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-500 transition-colors mt-0.5">
                                            <GitBranch size={18} />
                                        </div>
                                        <div className="flex-1">
                                            {editingState?.id === l.id && editingState.type === 'lines' ? (
                                                <div className="flex flex-col gap-2">
                                                    <input
                                                        autoFocus
                                                        className="w-full px-2 py-1 bg-white border border-brand-300 rounded text-sm"
                                                        value={editingState.fields.name || ''}
                                                        onChange={e => setEditingState({ ...editingState, fields: { ...editingState.fields, name: e.target.value } })}
                                                    />
                                                    <div className="flex flex-wrap gap-2">
                                                        <input
                                                            placeholder="Напряжение"
                                                            className="flex-1 min-w-[80px] px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                                                            value={editingState.fields.voltageClass || ''}
                                                            onChange={e => setEditingState({ ...editingState, fields: { ...editingState.fields, voltageClass: e.target.value } })}
                                                        />
                                                        <select
                                                            className="flex-1 min-w-[80px] px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                                                            value={editingState.fields.lineType || ''}
                                                            onChange={e => setEditingState({ ...editingState, fields: { ...editingState.fields, lineType: e.target.value } })}
                                                        >
                                                            <option value="">Тип...</option>
                                                            <option value="ВЛ">ВЛ</option>
                                                            <option value="КЛ">КЛ</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="font-semibold text-slate-700 text-sm leading-snug">{l.name}</div>
                                                    <div className="text-[10px] font-medium text-slate-400 mt-1 flex items-center flex-wrap gap-x-2 gap-y-1">
                                                        {l.voltageClass && <span className="font-bold text-slate-500">{l.voltageClass}</span>}
                                                        {l.lineType && <span>{l.lineType}</span>}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all">
                                        {editingState?.id === l.id && editingState.type === 'lines' ? (
                                            <div className="flex gap-1 ml-2">
                                                <button onClick={saveEditing} className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><Check size={14} /></button>
                                                <button onClick={cancelEditing} className="p-1.5 bg-slate-100 text-slate-400 rounded-lg"><X size={14} /></button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-1 ml-2">
                                                <button onClick={() => startEditing(l.id, 'lines', l)} className="p-1.5 text-slate-300 hover:text-brand-600 hover:bg-brand-50 rounded-lg">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => handleDelete('lines', l.id)} className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
