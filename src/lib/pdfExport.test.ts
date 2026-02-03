
import { describe, it, expect, vi } from 'vitest';
import { generatePlanDocument } from './pdfExport';
import { Plan } from '@/types/fitness';
// Mock jsPDF
vi.mock('jspdf', () => {
    class JsPDFMock {
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

describe('generatePlanDocument', () => {
    it('should generate a PDF document without errors', () => {
        const mockPlan: Plan = {
            id: 'test',
            createdAt: new Date(),
            selections: {
                firstName: 'Test',
                lastName: 'User',
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
        };

        const doc = generatePlanDocument(mockPlan, false);
        expect(doc).toBeDefined();
        // Since we mocked jsPDF, checks are limited to ensuring function completed
    });
});
