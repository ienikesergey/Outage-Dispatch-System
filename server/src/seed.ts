import { PrismaClient } from './generated/client';
import bcrypt from 'bcryptjs';
import path from 'path';

const prisma = new PrismaClient({
    datasourceUrl: `file:${path.resolve(__dirname, '../dev.db')}`
});

const users = [
    { username: 'admin', password: 'admin', name: 'Администратор', role: 'ADMIN' },
    { username: 'senior', password: '123', name: 'Иванов Иван (Старший)', role: 'SENIOR' },
    { username: 'editor', password: '123', name: 'Петров Петр (Диспетчер)', role: 'EDITOR' },
    { username: 'reader', password: '123', name: 'Сидоров Сидор (Просмотр)', role: 'READER' },
];

const reasons = [
    // Category 1: КЛ-6/10кВ
    { category: 'Причины выхода из строя КЛ-0,4/6/10кВ', subcategory: 'Пробой изоляции' },
    { category: 'Причины выхода из строя КЛ-0,4/6/10кВ', subcategory: 'Производство несанкционированных зем. работ в охранной зоне КЛ' },
    { category: 'Причины выхода из строя КЛ-0,4/6/10кВ', subcategory: 'Токи перегрузки или КЗ' },
    { category: 'Причины выхода из строя КЛ-0,4/6/10кВ', subcategory: 'Дефекты заводского изготовления' },
    { category: 'Причины выхода из строя КЛ-0,4/6/10кВ', subcategory: 'Дефект при монтаже кабельных муфт' },
    { category: 'Причины выхода из строя КЛ-0,4/6/10кВ', subcategory: 'Дефекты конструкций кабельных муфт' },
    { category: 'Причины выхода из строя КЛ-0,4/6/10кВ', subcategory: 'Причина не установлена' },

    // Category 2: ВЛ-6/10кВ
    { category: 'Причины выхода из строя ВЛ-0,4/6/10кВ', subcategory: 'Атмосферные перенапряжения, (гроза)' },
    { category: 'Причины выхода из строя ВЛ-0,4/6/10кВ', subcategory: 'Гололед, мокрый снег' },
    { category: 'Причины выхода из строя ВЛ-0,4/6/10кВ', subcategory: 'Перекрытие птицами и животными' },
    { category: 'Причины выхода из строя ВЛ-0,4/6/10кВ', subcategory: 'Наводнение, ледоход' },
    { category: 'Причины выхода из строя ВЛ-0,4/6/10кВ', subcategory: 'Природные пожары' },
    { category: 'Причины выхода из строя ВЛ-0,4/6/10кВ', subcategory: 'Ветровые нагрузки' },
    { category: 'Причины выхода из строя ВЛ-0,4/6/10кВ', subcategory: 'Температурные атмосферные воздейст.' },
    { category: 'Причины выхода из строя ВЛ-0,4/6/10кВ', subcategory: 'Наезд транспорта' },
    { category: 'Причины выхода из строя ВЛ-0,4/6/10кВ', subcategory: 'Проезд крупногабаритной техники' },
    { category: 'Причины выхода из строя ВЛ-0,4/6/10кВ', subcategory: 'Производство несанкционированных строительных и погрузочно-разгрузочных работ в охранных зонах объектов электросетевого хозяйства' },
    { category: 'Причины выхода из строя ВЛ-0,4/6/10кВ', subcategory: 'Наброс на ВЛ' },
    { category: 'Причины выхода из строя ВЛ-0,4/6/10кВ', subcategory: 'Разрушение изоляторов' },
    { category: 'Причины выхода из строя ВЛ-0,4/6/10кВ', subcategory: 'Слетел изолятор с крюка' },
    { category: 'Причины выхода из строя ВЛ-0,4/6/10кВ', subcategory: 'Крюк вылетел из опоры' },
    { category: 'Причины выхода из строя ВЛ-0,4/6/10кВ', subcategory: 'Падение деревьев, веток' },
    { category: 'Причины выхода из строя ВЛ-0,4/6/10кВ', subcategory: 'Несанкционированная рубка лесных насаждений' },
    { category: 'Причины выхода из строя ВЛ-0,4/6/10кВ', subcategory: 'Прочие посторонние воздействия' },
    { category: 'Причины выхода из строя ВЛ-0,4/6/10кВ', subcategory: 'Токи перегрузки или КЗ' },
    { category: 'Причины выхода из строя ВЛ-0,4/6/10кВ', subcategory: 'Обрыв провода' },
    { category: 'Причины выхода из строя ВЛ-0,4/6/10кВ', subcategory: 'Дефекты заводского изготовления' },
    { category: 'Причины выхода из строя ВЛ-0,4/6/10кВ', subcategory: 'Разрушение траверс' },
    { category: 'Причины выхода из строя ВЛ-0,4/6/10кВ', subcategory: 'Причина не установлена' },

    // Category 3: Стороннее оборудование
    { category: 'Отключение оборудования по вине стороннего оборудования', subcategory: 'Отключение (повреждение) оборудования в смежной электрической сети' },
    { category: 'Отключение оборудования по вине стороннего оборудования', subcategory: 'Отключение (повреждение) оборудования потребителей электрической энергии' },
    { category: 'Отключение оборудования по вине стороннего оборудования', subcategory: 'Отключение (повреждение) оборудования в вышестоящей электрической сети' },

    // Category 4: ТП, КТПН и т.д.
    { category: 'Причины выхода ТП, КТПН, СТП, КТПС и т.д. 10/6/-0,4КВ', subcategory: 'Попадание животных в электроустановку' },
    { category: 'Причины выхода ТП, КТПН, СТП, КТПС и т.д. 10/6/-0,4КВ', subcategory: 'Ошибочные действия персонала' },
    { category: 'Причины выхода ТП, КТПН, СТП, КТПС и т.д. 10/6/-0,4КВ', subcategory: 'Нарушение режима работы' },
    { category: 'Причины выхода ТП, КТПН, СТП, КТПС и т.д. 10/6/-0,4КВ', subcategory: 'Нарушение сроков и объемов ремонтов' },
    { category: 'Причины выхода ТП, КТПН, СТП, КТПС и т.д. 10/6/-0,4КВ', subcategory: 'Превышение номинальных токов' },
    { category: 'Причины выхода ТП, КТПН, СТП, КТПС и т.д. 10/6/-0,4КВ', subcategory: 'Нагрев контактных соединений' },
    { category: 'Причины выхода ТП, КТПН, СТП, КТПС и т.д. 10/6/-0,4КВ', subcategory: 'Попадание воды на оборудование' },
    { category: 'Причины выхода ТП, КТПН, СТП, КТПС и т.д. 10/6/-0,4КВ', subcategory: 'Прочие недостатки эксплуатации' },
    { category: 'Причины выхода ТП, КТПН, СТП, КТПС и т.д. 10/6/-0,4КВ', subcategory: 'Витковое замыкание внутри силового трансформатора' },
    { category: 'Причины выхода ТП, КТПН, СТП, КТПС и т.д. 10/6/-0,4КВ', subcategory: 'Обрыв "фазы" внутри силового трансформатора' },
    { category: 'Причины выхода ТП, КТПН, СТП, КТПС и т.д. 10/6/-0,4КВ', subcategory: 'Короткое замыкание в баке силового трансформатора' },
    { category: 'Причины выхода ТП, КТПН, СТП, КТПС и т.д. 10/6/-0,4КВ', subcategory: 'Разрушение изоляторов' },
    { category: 'Причины выхода ТП, КТПН, СТП, КТПС и т.д. 10/6/-0,4КВ', subcategory: 'Выход из строя предохранителей 6/10кВ' },
    { category: 'Причины выхода ТП, КТПН, СТП, КТПС и т.д. 10/6/-0,4КВ', subcategory: 'Течь масла (расширительный бак, силовой трансформатор)' },
    { category: 'Причины выхода ТП, КТПН, СТП, КТПС и т.д. 10/6/-0,4КВ', subcategory: 'Износ оборудования' },
    { category: 'Причины выхода ТП, КТПН, СТП, КТПС и т.д. 10/6/-0,4КВ', subcategory: 'Подтопление талыми водами' },
    { category: 'Причины выхода ТП, КТПН, СТП, КТПС и т.д. 10/6/-0,4КВ', subcategory: 'Разрушение конструкции здания и сооружения' },
    { category: 'Причины выхода ТП, КТПН, СТП, КТПС и т.д. 10/6/-0,4КВ', subcategory: 'Причина не установлена' },
];

async function main() {
    console.log('Seeding Users...');
    for (const u of users) {
        const hashedPassword = bcrypt.hashSync(u.password, 10);
        await prisma.user.upsert({
            where: { username: u.username },
            update: { password: hashedPassword, name: u.name, role: u.role },
            create: { username: u.username, password: hashedPassword, name: u.name, role: u.role }
        });
    }

    console.log('Seeding Outage Reasons...');
    await prisma.outageReason.deleteMany({});
    for (const r of reasons) {
        await prisma.outageReason.create({ data: r });
    }

    console.log('Seeding Substations and Cells...');
    await prisma.cell.deleteMany({});
    await prisma.substation.deleteMany({});

    const ps1 = await prisma.substation.create({
        data: {
            name: 'ПС 110/35/10 кВ "Северная"',
            voltageClass: '110 кВ',
            district: 'Северный РЭС',
            cells: {
                create: [
                    { name: 'Ячейка №1 (КЛ-10кВ)', voltageClass: '10 кВ' },
                    { name: 'Ячейка №2 (ВЛ-10кВ)', voltageClass: '10 кВ' },
                ]
            }
        },
        include: { cells: true }
    });

    const ps2 = await prisma.substation.create({
        data: {
            name: 'ПС 35/6 кВ "Заречная"',
            voltageClass: '35 кВ',
            district: 'Центральный РЭС',
            cells: {
                create: [
                    { name: 'Ячейка №5', voltageClass: '6 кВ' },
                ]
            }
        },
        include: { cells: true }
    });

    console.log('Seeding Lines (Feeders from Cells)...');
    await prisma.eventLine.deleteMany({});
    await prisma.line.deleteMany({});

    // Line 101 starts from PS1 Cell 2
    const line101 = await prisma.line.create({
        data: {
            name: 'ВЛ-10 кВ №101',
            voltageClass: '10 кВ',
            lineType: 'ВЛ',
            sourceCellId: ps1.cells.find(c => c.name.includes('№2'))?.id,
            normalSourceCellId: ps1.cells.find(c => c.name.includes('№2'))?.id
        }
    });

    // Line 102 starts from PS1 Cell 1
    const line102 = await prisma.line.create({
        data: {
            name: 'КЛ-10 кВ №102',
            voltageClass: '10 кВ',
            lineType: 'КЛ',
            sourceCellId: ps1.cells.find(c => c.name.includes('№1'))?.id,
            normalSourceCellId: ps1.cells.find(c => c.name.includes('№1'))?.id
        }
    });

    console.log('Seeding TPs (Supplied by Lines)...');
    await prisma.tp.deleteMany({});

    const tp101 = await prisma.tp.create({
        data: {
            name: 'ТП-101',
            voltageClass: '10/0.4 кВ',
            capacity: '400 кВА',
            feederId: line101.id,
            normalFeederId: line101.id
        }
    });

    const tp102 = await prisma.tp.create({
        data: {
            name: 'ТП-102',
            voltageClass: '10/0.4 кВ',
            capacity: '250 кВА',
            feederId: line101.id,
            normalFeederId: line101.id
        }
    });

    const line6Za = await prisma.line.create({
        data: {
            name: 'Л-6кВ (Заречная)',
            voltageClass: '6 кВ',
            lineType: 'КЛ',
            sourceCellId: ps2.cells[0].id,
            normalSourceCellId: ps2.cells[0].id
        }
    });

    const tp205 = await prisma.tp.create({
        data: {
            name: 'ТП-205',
            voltageClass: '6/0.4 кВ',
            capacity: '630 кВА',
            feederId: line6Za.id,
            normalFeederId: line6Za.id
        }
    });

    console.log('Seeding Secondary Lines (Feeders from TPs)...');
    const lineSek1 = await prisma.line.create({
        data: {
            name: 'ВЛ-0.4 кВ L1 (от ТП-101)',
            voltageClass: '0.4 кВ',
            lineType: 'ВЛ',
            sourceTpId: tp101.id,
            normalSourceTpId: tp101.id
        }
    });

    const lineSek2 = await prisma.line.create({
        data: {
            name: 'ВЛ-0.4 кВ L2 (от ТП-101)',
            voltageClass: '0.4 кВ',
            lineType: 'ВЛ',
            sourceTpId: tp101.id,
            normalSourceTpId: tp101.id
        }
    });

    console.log('Seeding Sample Outages...');
    await prisma.outageEvent.deleteMany({});

    // 1. Emergency outage on Substation
    const subNorth = await prisma.substation.findFirst({ where: { name: { contains: 'Северная' } } });
    const cell1 = await prisma.cell.findFirst({ where: { name: { contains: '№1' } } });
    // Using line102 from earlier definition
    if (subNorth && cell1 && line102) {
        const event = await prisma.outageEvent.create({
            data: {
                substationId: subNorth.id,
                cellId: cell1.id,
                type: 'Аварийное',
                reasonCategory: 'Причины выхода из строя КЛ-6/10кВ',
                reasonSubcategory: 'Пробой изоляции',
                timeStart: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
                comment: 'Автоматическое отключение КЛ. Визуально повреждений не обнаружено.',
                isCompleted: 0
            }
        });
        await prisma.eventLine.create({ data: { eventId: event.id, lineId: line102.id } });
    }

    // 2. Planned outage on TP
    // Using tp101 from earlier definition
    if (tp101) {
        await prisma.outageEvent.create({
            data: {
                tpId: tp101.id,
                type: 'Плановое',
                reasonCategory: 'Причины выхода из ТП, КТПН, СТП, КТПС и т.д. 10/6/-0,4КВ',
                reasonSubcategory: 'Износ оборудования',
                timeStart: new Date().toISOString(),
                measuresPlanned: 'Техническое обслуживание трансформатора',
                comment: 'Плановые работы по графику РЭС',
                isCompleted: 0
            }
        });
    }

    // 3. Completed outage on Line
    // Using line101 from earlier definition
    if (line101) {
        const event = await prisma.outageEvent.create({
            data: {
                type: 'Аварийное',
                reasonCategory: 'Причины выхода из строя ВЛ-6/10кВ',
                reasonSubcategory: 'Падение деревьев, веток',
                timeStart: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                timeEnd: new Date(Date.now() - 86400000 + 3600000 * 2).toISOString(), // lasted 2 hours
                comment: 'Устранение наброса веток на ВЛ.',
                isCompleted: 1
            }
        });
        await prisma.eventLine.create({ data: { eventId: event.id, lineId: line101.id } });
    }

    console.log('Seeding completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
