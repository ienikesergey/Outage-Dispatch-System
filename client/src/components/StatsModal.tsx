
import { X } from 'lucide-react';

interface StatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any[];
    total: number;
    colors: string[];
}

export const StatsModal = ({ isOpen, onClose, data, total, colors }: StatsModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-in">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white z-10">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Полная статистика</h3>
                        <p className="text-slate-400 text-sm mt-1">Все причины отключений</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="grid grid-cols-1 gap-4">
                        {data.sort((a, b) => b.value - a.value).map((entry, index) => {
                            const percent = ((entry.value / total) * 100).toFixed(1);
                            return (
                                <div key={index} className="group p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-sm font-semibold text-slate-700 group-hover:text-brand-600 transition-colors pr-4">
                                            {entry.name}
                                        </span>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <span className="text-xs font-bold text-slate-400 bg-white border border-slate-100 px-2 py-1 rounded-lg shadow-sm">
                                                {entry.value} шт
                                            </span>
                                            <span className="text-sm font-bold text-slate-800 w-[45px] text-right">
                                                {percent}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="h-full rounded-full"
                                            style={{
                                                width: `${percent}%`,
                                                backgroundColor: colors[index % colors.length]
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50">
                    <div className="flex justify-between items-center text-sm text-slate-500 font-medium">
                        <span>Всего категорий: {data.length}</span>
                        <span>Всего событий: {total}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
