
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { buildWorkoutPlanPdfFilename, exportPlanToPDF, generatePlanDocument } from './pdfExport';
import { Plan } from '@/types/fitness';
import { jsPDF } from 'jspdf';

type JsPDFMockInstance = {
    save: ReturnType<typeof vi.fn>;
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
