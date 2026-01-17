export interface Line {
    id: number;
    name: string;
    voltageClass?: string;
    lineType?: string;
    sourceCellId?: number | null;
    sourceTpId?: number | null;
    normalSourceCellId?: number | null;
    normalSourceTpId?: number | null;
}

export interface Cell {
    id: number;
    name: string;
    substationId: number;
    voltageClass?: string;
}

export interface Substation {
    id: number;
    name: string;
    voltageClass?: string;
    district?: string;
    cells: Cell[];
}


export interface Tp {
    id: number;
    name: string;
    voltageClass?: string;
    capacity?: string;
    feederId?: number | null;
    normalFeederId?: number | null;
}

export interface Event {
    id: number;
    substationId: number | null;
    cellId: number | null;
    tpId: number | null;
    type: string;
    reasonCategory: string;
    reasonSubcategory: string;
    timeStart: string;
    timeEnd: string | null;
    measuresPlanned: string | null;
    deadlineDate: string | null;
    measuresTaken: string | null;
    isCompleted: boolean;
    comment: string | null;
    isSwitching?: number;
    switchingDetails?: string;

    // Данные связанных объектов из бэкенда
    substation?: { id: number; name: string; voltageClass?: string; district?: string };
    cell?: { id: number; name: string; voltageClass?: string };
    tp?: { id: number; name: string; voltageClass?: string; capacity?: string };
    tps?: { id: number; name: string; voltageClass?: string; capacity?: string }[];
    lines?: { id: number; name: string; voltageClass?: string; lineType?: string }[];
}

export interface ReferenceData {
    substations: Substation[];
    tps: Tp[];
    reasons: Record<string, string[]>;
    lines: Line[];
}
