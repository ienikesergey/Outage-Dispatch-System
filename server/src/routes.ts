
import { Router } from 'express';
import { prisma } from './prisma';
import * as fs from 'fs';
import * as path from 'path';
import { authenticate, requireRole } from './auth';

// Сериализация BigInt для Prisma Raw Queries
(BigInt.prototype as any).toJSON = function () {
    return Number(this);
};

export const router = Router();

const logFile = path.resolve(__dirname, '../debug.log');

function log(msg: string) {
    const time = new Date().toISOString();
    try {
        fs.appendFileSync(logFile, `[${time}] ${msg}\n`);
    } catch (e) {
        console.error('Failed to write to log file:', e);
    }
}

// Глобальный middleware аутентификации
router.use(authenticate);

// Справочные данные (чтение для всех авторизованных)
router.get('/reference-data', async (req, res) => {
    try {
        const substations = await prisma.substation.findMany({
            include: {
                cells: true
            }
        });

        const lines = await prisma.line.findMany();
        const reasons = await prisma.outageReason.findMany();

        const reasonHierarchy: Record<string, string[]> = {};
        reasons.forEach((r) => {
            if (!reasonHierarchy[r.category]) reasonHierarchy[r.category] = [];
            if (!reasonHierarchy[r.category].includes(r.subcategory)) reasonHierarchy[r.category].push(r.subcategory);
        });

        const tps = await prisma.tp.findMany();

        res.json({
            substations: substations,
            tps: tps,
            reasons: reasonHierarchy,
            lines
        });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// События (чтение для всех)
router.get('/events', async (req, res) => {
    try {
        const events = await prisma.outageEvent.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                substation: true,
                cell: true,
                tp: true,
                eventLines: { include: { line: true } },
                eventTps: { include: { tp: true } }
            }
        });

        const eventsWithLines = events.map(e => ({
            ...e,
            lines: e.eventLines.map(el => el.line),
            tps: e.eventTps.map(et => et.tp),
            isCompleted: Boolean(e.isCompleted)
        }));

        res.json(eventsWithLines);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// События (запись для редакторов)
const checkWriteAccess = requireRole(['EDITOR', 'SENIOR', 'ADMIN']);

router.post('/events', checkWriteAccess, async (req, res) => {
    try {
        const {
            substationId, cellId, lineIds, tpIds,
            type, reasonCategory, reasonSubcategory,
            timeStart, timeEnd,
            measuresPlanned, deadlineDate, measuresTaken, comment,
            isCompleted
        } = req.body;

        const event = await prisma.outageEvent.create({
            data: {
                substationId: substationId ? Number(substationId) : null,
                cellId: cellId ? Number(cellId) : null,
                tpId: req.body.tpId ? Number(req.body.tpId) : null,

                type, reasonCategory, reasonSubcategory,
                timeStart, timeEnd, measuresPlanned, deadlineDate, measuresTaken, comment,
                isCompleted: isCompleted ? 1 : 0,
                eventLines: {
                    create: Array.isArray(lineIds) ? lineIds.map((lid: number) => ({
                        line: { connect: { id: lid } }
                    })) : []
                },
                eventTps: {
                    create: Array.isArray(tpIds) ? tpIds.map((tid: number) => ({
                        tp: { connect: { id: tid } }
                    })) : []
                }
            }
        });
        res.json(event);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/events/:id', checkWriteAccess, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const {
            substationId, cellId, lineIds, tpIds,
            type, reasonCategory, reasonSubcategory,
            timeStart, timeEnd,
            measuresPlanned, deadlineDate, measuresTaken, comment,
            isCompleted
        } = req.body;

        await prisma.$transaction(async (tx) => {
            await tx.outageEvent.update({
                where: { id },
                data: {
                    substationId: substationId ? Number(substationId) : null,
                    cellId: cellId ? Number(cellId) : null,
                    tpId: req.body.tpId ? Number(req.body.tpId) : null,

                    type, reasonCategory, reasonSubcategory,
                    timeStart, timeEnd, measuresPlanned, deadlineDate, measuresTaken,
                    comment, isCompleted: isCompleted ? 1 : 0
                }
            });
            // Обновление связей с линиями
            await tx.eventLine.deleteMany({ where: { eventId: id } });
            if (Array.isArray(lineIds) && lineIds.length > 0) {
                for (const lid of lineIds) {
                    await tx.eventLine.create({
                        data: { eventId: id, lineId: lid }
                    });
                }
            }
            // Обновление связей с ТП
            await tx.eventTp.deleteMany({ where: { eventId: id } });
            if (Array.isArray(tpIds) && tpIds.length > 0) {
                for (const tid of tpIds) {
                    await tx.eventTp.create({
                        data: { eventId: id, tpId: tid }
                    });
                }
            }
        });
        res.json({ success: true });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.patch('/events/:id', checkWriteAccess, async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { isCompleted, measuresTaken, comment, timeEnd } = req.body;
        const data: any = {};
        if (isCompleted !== undefined) data.isCompleted = isCompleted ? 1 : 0;
        if (measuresTaken !== undefined) data.measuresTaken = measuresTaken;
        if (comment !== undefined) data.comment = comment;
        if (timeEnd !== undefined) data.timeEnd = timeEnd;
        await prisma.outageEvent.update({ where: { id }, data });
        res.json({ success: true });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.delete('/events/:id', checkWriteAccess, async (req, res) => {
    try {
        await prisma.outageEvent.delete({ where: { id: Number(req.params.id) } });
        res.json({ success: true });
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Аналитика
import { Prisma } from './generated/client';
router.get('/analytics', async (req, res) => {
    try {
        const byCategory = await prisma.$queryRaw`
            SELECT reason_category as category, reason_subcategory as subcategory, COUNT(*) as value
            FROM OutageEvent GROUP BY reason_category, reason_subcategory
        `;

        // По объектам (ПС + ТП)
        const bySubstationRaw: any[] = await prisma.$queryRaw`
            SELECT s.name as name, COUNT(*) as count, 'PS' as type
            FROM OutageEvent e JOIN Substation s ON e.substationId = s.id 
            GROUP BY e.substationId
        `;
        const byTpRaw: any[] = await prisma.$queryRaw`
            SELECT t.name as name, COUNT(*) as count, 'TP' as type
            FROM OutageEvent e JOIN Tp t ON e.tpId = t.id 
            GROUP BY e.tpId
        `;
        const bySubstation = [
            ...bySubstationRaw.map(r => ({ name: r.name, count: Number(r.count), type: 'PS' })),
            ...byTpRaw.map(r => ({ name: r.name, count: Number(r.count), type: 'TP' }))
        ].sort((a, b) => b.count - a.count);

        const totalResult: any = await prisma.$queryRaw`SELECT COUNT(*) as c FROM OutageEvent`;
        const activeResult: any = await prisma.$queryRaw`SELECT COUNT(*) as c FROM OutageEvent WHERE is_completed = 0`;
        const total = Number(totalResult[0].c);
        const active = Number(activeResult[0].c);

        const typeStatsRaw: any[] = await prisma.$queryRaw`
            SELECT type, COUNT(*) as total, SUM(CASE WHEN is_completed = 0 THEN 1 ELSE 0 END) as active
            FROM OutageEvent GROUP BY type
        `;
        const typeStats = {
            emergency: { total: 0, active: 0 },
            planned: { total: 0, active: 0 },
            preventive: { total: 0, active: 0 },
            operative: { total: 0, active: 0 }
        };
        typeStatsRaw.forEach((row: any) => {
            const t = row.type ? row.type.trim() : '';
            const tTotal = Number(row.total);
            const tActive = Number(row.active);
            if (t === 'Аварийное') typeStats.emergency = { total: tTotal, active: tActive };
            if (t === 'Плановое') typeStats.planned = { total: tTotal, active: tActive };
            if (t.includes('Превентив')) { typeStats.preventive.total += tTotal; typeStats.preventive.active += tActive; }
            if (t.includes('Оператив')) { typeStats.operative.total += tTotal; typeStats.operative.active += tActive; }
        });

        const timelineRaw: any[] = await prisma.$queryRaw`
            SELECT strftime('%Y-%m', time_start) as month, type, COUNT(*) as count
            FROM OutageEvent WHERE time_start >= '2025-01-01' GROUP BY month, type ORDER BY month
        `;
        const timelineMap: Record<string, any> = {};
        timelineRaw.forEach((row: any) => {
            if (!timelineMap[row.month]) timelineMap[row.month] = { date: row.month, emergency: 0, planned: 0 };
            const t = row.type ? row.type.trim() : '';
            if (t === 'Аварийное') timelineMap[row.month].emergency += Number(row.count);
            if (t === 'Плановое') timelineMap[row.month].planned += Number(row.count);
        });

        // Аварийные объекты (ячейки + фидеры)
        const topCellsRaw: any[] = await prisma.$queryRaw`
            SELECT s.name as substation, c.name as cell, COUNT(*) as count, 'PS' as type
            FROM OutageEvent e JOIN Cell c ON e.cellId = c.id JOIN Substation s ON e.substationId = s.id
            WHERE e.type LIKE '%Аварий%' GROUP BY e.cellId
        `;
        const topFeedersRaw: any[] = await prisma.$queryRaw`
            SELECT t.name as substation, l.name as cell, COUNT(el.line_id) as count, 'TP' as type
            FROM OutageEvent e 
            JOIN EventLine el ON e.id = el.event_id 
            JOIN Line l ON el.line_id = l.id 
            JOIN Tp t ON e.tpId = t.id
            WHERE e.type LIKE '%Аварий%' 
            GROUP BY l.id, t.id
        `;

        const topHazardous = [
            ...topCellsRaw.map(r => ({ ...r, count: Number(r.count) })),
            ...topFeedersRaw.map(r => ({ ...r, count: Number(r.count) }))
        ].sort((a, b) => b.count - a.count).slice(0, 50);

        res.json({ byCategory, bySubstation, stats: { total, active, byType: typeStats }, timeline: Object.values(timelineMap), topHazardous });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Справочники (запись для старших и админов)
const checkReferenceAccess = requireRole(['SENIOR', 'ADMIN']);

router.post('/substations', checkReferenceAccess, async (req, res) => {
    try {
        const { name, voltageClass, district } = req.body;
        const result = await prisma.substation.create({
            data: {
                name,
                voltageClass,
                district
            }
        });
        res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/substations/:id', checkReferenceAccess, async (req, res) => {
    try {
        const { name, voltageClass, district } = req.body;
        await prisma.substation.update({
            where: { id: Number(req.params.id) },
            data: {
                name,
                voltageClass,
                district
            }
        });
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/substations/:id', checkReferenceAccess, async (req, res) => {
    try {
        const id = Number(req.params.id);
        await prisma.$transaction(async (tx) => {
            const cells = await tx.cell.findMany({ where: { substationId: id } });
            for (const cell of cells) {
                const events = await tx.outageEvent.findMany({ where: { cellId: cell.id } });
                for (const e of events) {
                    await tx.eventLine.deleteMany({ where: { eventId: e.id } });
                    await tx.outageEvent.delete({ where: { id: e.id } });
                }
                await tx.cell.delete({ where: { id: cell.id } });
            }
            const events = await tx.outageEvent.findMany({ where: { substationId: id } });
            for (const e of events) {
                await tx.eventLine.deleteMany({ where: { eventId: e.id } });
                await tx.outageEvent.delete({ where: { id: e.id } });
            }
            await tx.substation.delete({ where: { id } });
        });
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/cells', checkReferenceAccess, async (req, res) => {
    try {
        const { name, substationId, voltageClass } = req.body;
        const result = await prisma.cell.create({
            data: {
                name,
                substationId: Number(substationId),
                voltageClass
            }
        });
        res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/cells/:id', checkReferenceAccess, async (req, res) => {
    try {
        const { name, voltageClass } = req.body;
        await prisma.cell.update({
            where: { id: Number(req.params.id) },
            data: {
                name,
                voltageClass
            }
        });
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/cells/:id', checkReferenceAccess, async (req, res) => {
    try {
        const id = Number(req.params.id);
        await prisma.$transaction(async tx => {
            const events = await tx.outageEvent.findMany({ where: { cellId: id } });
            for (const e of events) {
                await tx.eventLine.deleteMany({ where: { eventId: e.id } });
                await tx.outageEvent.delete({ where: { id: e.id } });
            }
            await tx.cell.delete({ where: { id } });
        });
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/lines', checkReferenceAccess, async (req, res) => {
    try {
        const { name, voltageClass, lineType, sourceCellId, sourceTpId, normalSourceCellId, normalSourceTpId } = req.body;
        const result = await prisma.line.create({
            data: {
                name,
                voltageClass,
                lineType,
                sourceCellId: sourceCellId ? Number(sourceCellId) : null,
                sourceTpId: sourceTpId ? Number(sourceTpId) : null,
                normalSourceCellId: normalSourceCellId ? Number(normalSourceCellId) : (sourceCellId ? Number(sourceCellId) : null),
                normalSourceTpId: normalSourceTpId ? Number(normalSourceTpId) : (sourceTpId ? Number(sourceTpId) : null)
            }
        });
        res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/lines/:id', checkReferenceAccess, async (req, res) => {
    try {
        const { name, voltageClass, lineType, sourceCellId, sourceTpId, normalSourceCellId, normalSourceTpId } = req.body;
        await prisma.line.update({
            where: { id: Number(req.params.id) },
            data: {
                name,
                voltageClass,
                lineType,
                sourceCellId: sourceCellId ? Number(sourceCellId) : null,
                sourceTpId: sourceTpId ? Number(sourceTpId) : null,
                normalSourceCellId: normalSourceCellId ? Number(normalSourceCellId) : null,
                normalSourceTpId: normalSourceTpId ? Number(normalSourceTpId) : null
            }
        });
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});



// --- TP / Feeders ---

router.post('/tps', checkReferenceAccess, async (req, res) => {
    try {
        const { name, voltageClass, capacity, feederId, normalFeederId } = req.body;
        const result = await prisma.tp.create({
            data: {
                name,
                voltageClass,
                capacity,
                feederId: feederId ? Number(feederId) : null,
                normalFeederId: normalFeederId ? Number(normalFeederId) : (feederId ? Number(feederId) : null)
            }
        });
        res.json(result);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/tps/:id', checkReferenceAccess, async (req, res) => {
    try {
        const { name, voltageClass, capacity, feederId, normalFeederId } = req.body;
        await prisma.tp.update({
            where: { id: Number(req.params.id) },
            data: {
                name,
                voltageClass,
                capacity,
                feederId: feederId ? Number(feederId) : null,
                normalFeederId: normalFeederId ? Number(normalFeederId) : null
            }
        });
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/topology/switch', checkReferenceAccess, async (req, res) => {
    try {
        const { objectId, objectType, toSourceId, comment } = req.body;
        const id = Number(objectId);
        const sourceId = toSourceId ? Number(toSourceId) : null;

        await prisma.$transaction(async tx => {
            let oldSourceId = null;

            if (objectType === 'TP') {
                const tp = await tx.tp.findUnique({ where: { id } });
                oldSourceId = tp?.feederId;
                await tx.tp.update({ where: { id }, data: { feederId: sourceId } });
            } else if (objectType === 'LINE') {
                const line = await tx.line.findUnique({ where: { id } });
                // Note: Simplified logic assumes switch between same source types for now or explicit source selection
                // In full implementation, we'd check if sourceId is Cell or TP
                const isCell = await tx.cell.findUnique({ where: { id: sourceId || 0 } });
                if (isCell) {
                    oldSourceId = line?.sourceCellId;
                    await tx.line.update({ where: { id }, data: { sourceCellId: sourceId, sourceTpId: null } });
                } else {
                    oldSourceId = line?.sourceTpId;
                    await tx.line.update({ where: { id }, data: { sourceTpId: sourceId, sourceCellId: null } });
                }
            }

            // Create Event for History
            await tx.outageEvent.create({
                data: {
                    type: 'ПЕРЕКЛЮЧЕНИЕ',
                    reasonCategory: 'Оперативные переключения',
                    reasonSubcategory: 'Изменение схемы питания',
                    timeStart: new Date().toISOString(),
                    isSwitching: 1,
                    switchingDetails: JSON.stringify({ objectId, objectType, fromId: oldSourceId, toId: sourceId }),
                    comment: comment || `Переключение объекта ${objectType} #${id}`,
                    isCompleted: 1,
                    tpId: objectType === 'TP' ? id : null
                    // If line, we'd need a multi-line link or specialized field. For now TP focus.
                }
            });

            await tx.topologySwitch.create({
                data: { objectId: id, objectType, fromSourceId: oldSourceId, toSourceId: sourceId, eventId: 0 }
            });
        });

        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/lines/:id', checkReferenceAccess, async (req, res) => {
    try {
        const id = Number(req.params.id);
        await prisma.$transaction(async tx => {
            await tx.eventLine.deleteMany({ where: { lineId: id } });
            await tx.line.delete({ where: { id } });
        });
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/tps/:id', checkReferenceAccess, async (req, res) => {
    try {
        const id = Number(req.params.id);
        await prisma.$transaction(async tx => {
            const events = await tx.outageEvent.findMany({ where: { tpId: id } });
            for (const e of events) {
                await tx.eventLine.deleteMany({ where: { eventId: e.id } });
                await tx.outageEvent.delete({ where: { id: e.id } });
            }
            await tx.tp.delete({ where: { id } });
        });
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});
