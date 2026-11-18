
import { beforeEach, describe, it, expect, vi } from 'vitest';
import {
    buildWorkoutPlanPdfFilename,
    exportPlanToPDF,
    formatPdfDayTitle,
    generatePlanDocument,
    getPdfTableHeaders,
    PDF_TABLE_CELL_PADDING,
    PDF_TABLE_COLUMN_WIDTHS,
    stripLeadingDayPrefix,
    toPdfSafeText,
} from './pdfExport';
import { Plan } from '@/types/fitness';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import en from '@/locales/en.json';
import es from '@/locales/es.json';
import de from '@/locales/de.json';
import pt from '@/locales/pt.json';

type JsPDFMockInstance = {
    save: ReturnType<typeof vi.fn>;
    text: ReturnType<typeof vi.fn>;
};

type AutoTableOptions = {
    head: string[][];
    body: string[][];
    columnStyles: Record<number, { cellWidth?: number | string }>;
};

// Mock jsPDF
vi.mock('jspdf', () => {
    class JsPDFMock {
        static instances: JsPDFMock[] = [];

        constructor() {
            JsPDFMock.instances.push(this);
        }

        setFillColor = vi.fn();
        rect = vi.fn();
        roundedRect = vi.fn();
        setTextColor = vi.fn();
        setDrawColor = vi.fn();
        setLineWidth = vi.fn();
        line = vi.fn();
        setFontSize = vi.fn();
        setFont = vi.fn();
        text = vi.fn();
        splitTextToSize = vi.fn((text) => [text]); // simple mock
        addPage = vi.fn();
        save = vi.fn();
        lastAutoTable = { finalY: 100 };
    }

    return {
        jsPDF: JsPDFMock,
        default: { jsPDF: JsPDFMock },
    };
});

vi.mock('jspdf-autotable', () => ({
    default: vi.fn()
}));

const createMockPlan = (firstName = 'Test', lastName = 'User'): Plan => ({
    id: 'test',
    createdAt: new Date(),
    selections: {
        firstName,
        lastName,
        personalGoalNote: 'Goal',
        isTrainer: false,
        coachNotes: '',
        goal: 'strength',
        experienceLevel: 'beginner',
        equipment: [],
        targetMuscles: [],
        constraints: [],
        daysPerWeek: 3,
        sessionDuration: 60
    },
    splitType: 'full_body',
    workoutDays: [
        {
            dayIndex: 0,
            name: 'Day 1',
            focusTags: [],
            estimatedDuration: 60,
            exercises: [],
            warmUp: [],
            coolDown: []
        }
    ],
    weeklyVolume: [],
    rirProgression: [],
    notes: []
});

const getLastJsPDFInstance = (): JsPDFMockInstance => {
    const JsPDFCtor = jsPDF as unknown as { instances: JsPDFMockInstance[] };
    const instances = JsPDFCtor.instances;
    const lastInstance = instances[instances.length - 1];
    if (!lastInstance) {
        throw new Error('Expected jsPDF instance to be created');
    }
    return lastInstance;
};

beforeEach(() => {
    const JsPDFCtor = jsPDF as unknown as { instances: JsPDFMockInstance[] };
    JsPDFCtor.instances.length = 0;
    vi.clearAllMocks();
});

describe('generatePlanDocument', () => {
    it('should generate a PDF document without errors', () => {
        const mockPlan = createMockPlan();
        const doc = generatePlanDocument(mockPlan, false);
        expect(doc).toBeDefined();
        // Since we mocked jsPDF, checks are limited to ensuring function completed
    });
});

describe('buildWorkoutPlanPdfFilename', () => {
    it('should build initials filename for first and last name', () => {
        const filename = buildWorkoutPlanPdfFilename('Lincoln', 'Ogden');
        expect(filename).toBe('L.O. Fitz-Wizardly workout plan.pdf');
    });

    it('should build initials filename when only first name exists', () => {
        const filename = buildWorkoutPlanPdfFilename('Lincoln', '');
        expect(filename).toBe('L. Fitz-Wizardly workout plan.pdf');
    });

    it('should fallback to suffix-only filename when names are blank', () => {
        const filename = buildWorkoutPlanPdfFilename('', '');
        expect(filename).toBe('Fitz-Wizardly workout plan.pdf');
    });

    it('should trim whitespace before extracting initials', () => {
        const filename = buildWorkoutPlanPdfFilename('  lincoln  ', '  ogden  ');
        expect(filename).toBe('L.O. Fitz-Wizardly workout plan.pdf');
    });
});

describe('exportPlanToPDF', () => {
    it('should include initials in filename when privacy mode is on', () => {
        const mockPlan = createMockPlan('Lincoln', 'Ogden');
        exportPlanToPDF(mockPlan, true);

        const docInstance = getLastJsPDFInstance();
        expect(docInstance.save).toHaveBeenCalledWith('L.O. Fitz-Wizardly workout plan.pdf');
    });
});

const createPlanWithDays = (): Plan => {
    const plan = createMockPlan();
    const baseDay = plan.workoutDays[0];
    return {
        ...plan,
        selections: { ...plan.selections, personalGoalNote: 'Get strong 💪🔥' },
        workoutDays: [
            {
                ...baseDay,
                name: 'Day 1: Push 💪',
                focusTags: ['chest 🏋️‍♂️', 'triceps'],
                warmUp: ['Arm circles 🔄'],
                coolDown: ['Stretch ✅'],
                exercises: [
                    {
                        exercise: { id: 'bench', name: 'Bench Press 🏋️' },
                        sets: 3,
                        reps: '8-12',
                        rir: 2,
                        restSeconds: 90,
                    },
                    {
                        exercise: { id: 'dips', name: 'Dips' },
                        sets: 2,
                        reps: '10',
                        rir: 0,
                        restSeconds: 60,
                    },
                ] as unknown as Plan['workoutDays'][number]['exercises'],
            },
            { ...baseDay, dayIndex: 1, name: 'Day 2 - Pull' },
            { ...baseDay, dayIndex: 2, name: 'Legs' },
        ],
    };
};

const allTextDrawn = (instance: JsPDFMockInstance): string[] =>
    instance.text.mock.calls.map((call) => String(call[0]));

const lastAutoTableOptions = (): AutoTableOptions => {
    const calls = vi.mocked(autoTable).mock.calls;
    const lastCall = calls[calls.length - 1];
    if (!lastCall) throw new Error('Expected autoTable to be called');
    return lastCall[1] as unknown as AutoTableOptions;
};

describe('day titles (no duplicated "DAY 1: DAY 1:")', () => {
    it('strips a leading "Day N" prefix in its common forms', () => {
        expect(stripLeadingDayPrefix('Day 1: Push')).toBe('Push');
        expect(stripLeadingDayPrefix('day 2 - Pull')).toBe('Pull');
        expect(stripLeadingDayPrefix('DAY 3 – Legs')).toBe('Legs');
        expect(stripLeadingDayPrefix('Day 4')).toBe('');
        expect(stripLeadingDayPrefix('Upper Body')).toBe('Upper Body');
        expect(stripLeadingDayPrefix('Daybreak Cardio')).toBe('Daybreak Cardio');
    });

    it('prints each day number once', () => {
        expect(formatPdfDayTitle(0, 'Day 1: Push')).toBe('DAY 1: PUSH');
        expect(formatPdfDayTitle(1, 'Pull')).toBe('DAY 2: PULL');
        expect(formatPdfDayTitle(0, 'Day 1')).toBe('DAY 1');
    });

    it('never draws "DAY n: DAY" in the document', () => {
        generatePlanDocument(createPlanWithDays(), false);
        const drawn = allTextDrawn(getLastJsPDFInstance());

        expect(drawn).toContain('DAY 1: PUSH');
        expect(drawn).toContain('DAY 2: PULL');
        expect(drawn).toContain('DAY 3: LEGS');
        expect(drawn.some((text) => /DAY\s*\d+\s*:\s*DAY/i.test(text))).toBe(false);
    });
});

describe('table headers (no mid-word wrapping)', () => {
    it('uses the short, translatable header set', () => {
        expect(getPdfTableHeaders()).toEqual(['EXERCISE', 'SETS', 'REPS', 'RIR', 'REST']);

        generatePlanDocument(createPlanWithDays(), false);
        const options = lastAutoTableOptions();
        expect(options.head).toEqual([['EXERCISE', 'SETS', 'REPS', 'RIR', 'REST']]);
        expect(options.columnStyles[1].cellWidth).toBe(PDF_TABLE_COLUMN_WIDTHS.sets);
        expect(options.columnStyles[2].cellWidth).toBe(PDF_TABLE_COLUMN_WIDTHS.reps);
        expect(options.columnStyles[3].cellWidth).toBe(PDF_TABLE_COLUMN_WIDTHS.rir);
        expect(options.columnStyles[4].cellWidth).toBe(PDF_TABLE_COLUMN_WIDTHS.rest);
    });

    it.each([
        ['en', en],
        ['es', es],
        ['de', de],
        ['pt', pt],
    ])('fits every %s header on one line at 8pt bold', async (_code, locale) => {
        const { jsPDF: RealJsPDF } = await vi.importActual<typeof import('jspdf')>('jspdf');
        const measuring = new RealJsPDF();
        measuring.setFont('helvetica', 'bold');
        measuring.setFontSize(8);

        const headers = locale.pdfExport.headers;
        const fixedColumns: Array<[string, number]> = [
            [headers.sets, PDF_TABLE_COLUMN_WIDTHS.sets],
            [headers.reps, PDF_TABLE_COLUMN_WIDTHS.reps],
            [headers.rir, PDF_TABLE_COLUMN_WIDTHS.rir],
            [headers.rest, PDF_TABLE_COLUMN_WIDTHS.rest],
        ];
        const horizontalPadding = PDF_TABLE_CELL_PADDING.left + PDF_TABLE_CELL_PADDING.right;

        for (const [label, width] of fixedColumns) {
            expect(measuring.getTextWidth(label)).toBeLessThanOrEqual(width - horizontalPadding);
        }
    });

    it('fits the failure label in the RIR column at 9pt bold', async () => {
        const { jsPDF: RealJsPDF } = await vi.importActual<typeof import('jspdf')>('jspdf');
        const measuring = new RealJsPDF();
        measuring.setFont('helvetica', 'bold');
        measuring.setFontSize(9);
        const horizontalPadding = PDF_TABLE_CELL_PADDING.left + PDF_TABLE_CELL_PADDING.right;

        for (const locale of [en, es, de, pt]) {
            expect(measuring.getTextWidth(locale.pdfExport.failure)).toBeLessThanOrEqual(
                PDF_TABLE_COLUMN_WIDTHS.rir - horizontalPadding,
            );
        }
    });
});

describe('emoji (no garbled "Ø=Üª" characters)', () => {
    const PICTOGRAPHIC = /\p{Extended_Pictographic}|\u200D|\uFE0F/u;

    it('removes emoji, joiners and variation selectors, and tidies spacing', () => {
        expect(toPdfSafeText('Push 💪 day')).toBe('Push day');
        expect(toPdfSafeText('🏋️‍♂️ Lift')).toBe('Lift');
        expect(toPdfSafeText('Flags 🇺🇸 and thumbs 👍🏽')).toBe('Flags and thumbs');
        expect(toPdfSafeText('Brand™ ©')).toBe('Brand™ ©');
        expect(toPdfSafeText('Ünïcödé – ok • fine')).toBe('Ünïcödé – ok • fine');
        expect(toPdfSafeText(undefined)).toBe('');
    });

    it('draws no emoji anywhere in the document or its table', () => {
        generatePlanDocument(createPlanWithDays(), false);
        const drawn = allTextDrawn(getLastJsPDFInstance());

        expect(drawn).toContain('"Get strong"');
        expect(drawn).toContain('CHEST • TRICEPS');
        expect(drawn.some((text) => PICTOGRAPHIC.test(text))).toBe(false);

        const tableText = vi.mocked(autoTable).mock.calls.flatMap((call) => {
            const options = call[1] as unknown as AutoTableOptions;
            return [...options.head.flat(), ...options.body.flat()];
        });
        expect(tableText).toContain('Bench Press');
        expect(tableText).toContain('FAILURE');
        expect(tableText.some((text) => PICTOGRAPHIC.test(text))).toBe(false);
    });
});
