
import { X, AlertOctagon } from 'lucide-react';

interface HazardousObjectsModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any[];
}

export const HazardousObjectsModal = ({ isOpen, onClose, data }: HazardousObjectsModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-in">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white z-10">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Аварийные объекты</h3>
                        <p className="text-slate-400 text-sm mt-1">Рейтинг мест с частыми авариями</p>
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
                    <div className="space-y-4">
                        {data.map((obj, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-red-50/50 transition-colors group border border-slate-100/50">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className={`
                                        w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0
                                        ${index === 0 ? 'bg-red-500 text-white shadow-red-200 shadow-lg' :
                                            index === 1 ? 'bg-orange-500 text-white shadow-orange-200 shadow-md' :
                                                index === 2 ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-500'}
                                    `}>
                                        {index + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-slate-800 truncate text-sm">{obj.cell}</div>
                                        <div className="text-xs text-slate-400 truncate mt-0.5">{obj.substation}</div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end flex-shrink-0 ml-2">
                                    <span className="text-lg font-bold text-slate-700 group-hover:text-red-500 transition-colors">
                                        {obj.count}
                                    </span>
                                    <span className="text-[10px] uppercase font-bold text-slate-400">Аварий</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50">
                    <div className="flex justify-between items-center text-sm text-slate-500 font-medium">
                        <span>Всего объектов в списке: {data.length}</span>
                        <div className="flex items-center gap-2">
                            <AlertOctagon size={16} className="text-red-400" />
                            <span>Сводка по аварийности</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
