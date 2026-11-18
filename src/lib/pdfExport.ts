import i18n from 'i18next';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Plan } from '@/types/fitness';
import { formatIdentifierLabel } from '@/lib/displayText';

const WORKOUT_PLAN_FILENAME_SUFFIX = 'Fitz-Wizardly workout plan';

/**
 * Emoji and other pictographs, plus the invisible pieces that build emoji sequences
 * (variation selectors, zero-width joiner, keycap, skin tones, flag letters).
 * jsPDF's standard fonts only cover WinAnsi, so these print as garbage like "Ø=Üª".
 * ©, ® and ™ are pictographic in Unicode but exist in WinAnsi, so they are kept.
 */
const UNPRINTABLE_GLYPHS =
    /(?![\u00A9\u00AE\u2122])\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}\u{1F1E6}-\u{1F1FF}]|\u200D|\u20E3|\uFE0E|\uFE0F/gu;

/** Removes characters the PDF's standard fonts can't draw, then tidies the spacing left behind. */
export const toPdfSafeText = (value: string | null | undefined): string =>
    (value ?? '')
        .replace(UNPRINTABLE_GLYPHS, '')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();

/** Matches a leading "Day 1:", "Day 2 -", "day 3 –" or a bare "Day 4" that the day number already covers. */
const LEADING_DAY_PREFIX = /^day\s*\d+\s*(?:[:\-–]\s*|$)/i;

/** Day names from the plan engine often start with "Day N:"; the PDF adds its own number. */
export const stripLeadingDayPrefix = (name: string): string => name.replace(LEADING_DAY_PREFIX, '').trim();

/**
 * Translated label with an English fallback. Works before i18n has initialised
 * (for example in a unit test), because then `t` has nothing to return.
 */
const pdfLabel = (key: string, fallback: string, options?: Record<string, unknown>): string => {
    if (!i18n.isInitialized) {
        return fallback.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => String(options?.[name] ?? ''));
    }
    const value = i18n.t(key, { defaultValue: fallback, ...options });
    return typeof value === 'string' && value ? value : fallback;
};

export const getPdfTableHeaders = (): [string, string, string, string, string] => [
    pdfLabel('pdfExport.headers.exercise', 'EXERCISE'),
    pdfLabel('pdfExport.headers.sets', 'SETS'),
    pdfLabel('pdfExport.headers.reps', 'REPS'),
    pdfLabel('pdfExport.headers.rir', 'RIR'),
    pdfLabel('pdfExport.headers.rest', 'REST'),
];

/** Cell padding in mm. Left and right are kept small so short headers fit their columns. */
export const PDF_TABLE_CELL_PADDING = { top: 4, bottom: 4, left: 2, right: 2 } as const;

/**
 * Fixed widths (mm) for every column but the exercise name, which takes the rest.
 * Sized so the longest translated header (es/pt "DESCANSO", 8pt bold) fits on one line.
 */
export const PDF_TABLE_COLUMN_WIDTHS = { sets: 18, reps: 22, rir: 22, rest: 24 } as const;

/** "DAY 1: PUSH" from index 0 and a name like "Day 1: Push 💪". */
export const formatPdfDayTitle = (index: number, name: string): string => {
    const dayLabel = pdfLabel('pdfExport.dayLabel', 'DAY {{number}}', { number: index + 1 }).toUpperCase();
    const cleanName = stripLeadingDayPrefix(toPdfSafeText(name)).toUpperCase();
    return cleanName ? `${dayLabel}: ${cleanName}` : dayLabel;
};

export const generatePlanDocument = (currentPlan: Plan, redactSensitive: boolean): jsPDF => {
    const doc = new jsPDF();
    const selections = currentPlan.selections;

    // Generate timestamp
    const now = new Date();
    const timestamp = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Purple/Pink branded header
    // --- PREMIUM DESIGN CONSTANTS ---
    const COLORS = {
        primary: [139, 92, 246] as [number, number, number], // Violet 500
        secondary: [236, 72, 153] as [number, number, number], // Pink 500
        dark: [15, 23, 42] as [number, number, number], // Slate 900 (Darker)
        surface: [248, 250, 252] as [number, number, number], // Slate 50
        card: [255, 255, 255] as [number, number, number], // White
        text: {
            heading: [15, 23, 42] as [number, number, number],
            body: [51, 65, 85] as [number, number, number],
            light: [100, 116, 139] as [number, number, number],
            accent: [139, 92, 246] as [number, number, number]
        }
    };

    // Helper: Draw decorative sport lines
    const drawSportAccents = (yPos: number) => {
        doc.setDrawColor(...COLORS.secondary);
        doc.setLineWidth(1);
        doc.line(0, yPos, 40, yPos);
        doc.setDrawColor(...COLORS.primary);
        doc.line(40, yPos, 80, yPos);
    };

    // --- COVER PAGE ---
    // Full dark background
    doc.setFillColor(...COLORS.dark);
    doc.rect(0, 0, 220, 300, 'F');

    // Dynamic "Slash" background graphic
    doc.setFillColor(30, 41, 59); // Slate 800
    const anyDoc = doc as jsPDF & {
        triangle?: (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, style?: string) => unknown;
        lines?: (...args: unknown[]) => unknown;
    };
    if (typeof anyDoc.triangle === 'function') {
        anyDoc.triangle(0, 300, 220, 200, 220, 300, 'F');
    } else if (typeof anyDoc.lines === 'function') {
        anyDoc.lines(
            [
                [220 - 0, 200 - 300],
                [220 - 220, 300 - 200],
                [0 - 220, 300 - 300],
            ],
            0,
            300,
            [1, 1],
            'F',
            true
        );
    } else {
        // Fallback for environments where polygon APIs aren't available
        doc.rect(0, 240, 220, 60, 'F');
    }

    // Logo / Brand
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FITWIZARD', 20, 30);
    drawSportAccents(35);

    // Main Title
    doc.setFontSize(50);
    doc.setFont('helvetica', 'bold');
    doc.text('TRAINING', 20, 100);
    doc.setTextColor(...COLORS.secondary);
    doc.text('PROGRAM', 20, 120);

    // User & Goal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    const userName = redactSensitive
        ? 'ATHLETE'
        : toPdfSafeText(`${selections.firstName || ''} ${selections.lastName || ''}`);
    doc.text(userName.toUpperCase() || 'ATHLETE', 20, 160);

    doc.setFontSize(12);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(`${formatIdentifierLabel(currentPlan.splitType).toUpperCase()} • ${selections.goal.toUpperCase()}`, 20, 170);

    // Footer Info
    doc.setFontSize(10);
    doc.text(`Generated on ${timestamp}`, 20, 270);
    doc.text(`${selections.daysPerWeek} Days / Week • ${selections.sessionDuration} Mins`, 20, 276);

    // --- CONTENT PAGES ---
    doc.addPage();
    let y = 20;

    // Header per page
    const addHeader = () => {
        doc.setFillColor(...COLORS.dark);
        doc.rect(0, 0, 220, 15, 'F');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('FITWIZARD TRAINING SYSTEMS', 10, 10);
        doc.text(userName.toUpperCase(), 190, 10, { align: 'right' });
    };

    addHeader();
    y = 30;

    // Personal Note
    const personalGoalNote = redactSensitive ? '' : toPdfSafeText(selections.personalGoalNote);
    if (personalGoalNote) {
        doc.setTextColor(...COLORS.text.body);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'italic');
        doc.text(`"${personalGoalNote}"`, 105, y, { align: 'center' });
        y += 15;
    }

    // --- WORKOUT DAYS LOOP ---
    currentPlan.workoutDays.forEach((day, index) => {
        // Check for space
        if (y > 220) {
            doc.addPage();
            addHeader();
            y = 30;
        }

        // Card Container

        // Day Title Bar
        doc.setFillColor(...COLORS.surface);
        doc.roundedRect(10, y, 190, 12, 1, 1, 'F');
        doc.setDrawColor(...COLORS.primary);
        doc.setLineWidth(0.5);
        doc.line(10, y, 10, y + 12); // Left accent border

        doc.setFontSize(10);
        doc.setTextColor(...COLORS.text.heading);
        doc.setFont('helvetica', 'bold');
        doc.text(formatPdfDayTitle(index, day.name), 15, y + 8);

        // Tags
        const focusTags = (day.focusTags ?? []).map(toPdfSafeText).filter(Boolean);
        if (focusTags.length > 0) {
            doc.setFontSize(8);
            doc.setTextColor(...COLORS.text.light);
            doc.text(focusTags.join(' • ').toUpperCase(), 195, y + 8, { align: 'right' });
        }

        y += 18;

        // Warmup (Subtle)
        if (day.warmUp && day.warmUp.length > 0) {
            doc.setFontSize(8);
            doc.setTextColor(...COLORS.text.light);
            doc.text(toPdfSafeText(`WARM UP: ${day.warmUp.join(', ')}`), 15, y);
            y += 8;
        }

        // Exercise Table
        const failureLabel = pdfLabel('pdfExport.failure', 'FAILURE');
        const rows = day.exercises.map(e => {
            const rirLabel = e.rir === 0 ? failureLabel : `${e.rir} RIR`;
            return [
                toPdfSafeText(e.exercise.name),
                `${e.sets}`,
                toPdfSafeText(e.reps),
                rirLabel,
                `${e.restSeconds}s`
            ];
        });

        autoTable(doc, {
            startY: y,
            head: [getPdfTableHeaders()],
            body: rows,
            theme: 'plain', // Cleaner look, we will add borders manually if needed or rely on row colors
            styles: {
                font: 'helvetica',
                fontSize: 9,
                textColor: COLORS.text.body,
                cellPadding: { ...PDF_TABLE_CELL_PADDING },
            },
            headStyles: {
                fillColor: [255, 255, 255],
                textColor: COLORS.primary,
                fontSize: 8,
                fontStyle: 'bold',
                halign: 'left',
                lineWidth: 0 // No border
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 'auto' },
                1: { halign: 'center', cellWidth: PDF_TABLE_COLUMN_WIDTHS.sets },
                2: { halign: 'center', cellWidth: PDF_TABLE_COLUMN_WIDTHS.reps },
                3: { halign: 'center', cellWidth: PDF_TABLE_COLUMN_WIDTHS.rir, fontStyle: 'bold', textColor: COLORS.secondary }, // Pink Intensity
                4: { halign: 'center', cellWidth: PDF_TABLE_COLUMN_WIDTHS.rest }
            },
            alternateRowStyles: {
                fillColor: COLORS.surface
            },
            // Centre the number-column headers over their centred values.
            didParseCell: (data) => {
                if (data.section === 'head' && data.column.index > 0) {
                    data.cell.styles.halign = 'center';
                }
            },
            margin: { left: 10, right: 10 }
        });

        const lastAutoTable = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable;
        if (lastAutoTable && typeof lastAutoTable.finalY === 'number') {
            y = lastAutoTable.finalY + 10;
        } else {
            y += 10;
        }

        // Cooldown
        if (day.coolDown && day.coolDown.length > 0) {
            doc.setFontSize(8);
            doc.setTextColor(...COLORS.text.light);
            doc.text(toPdfSafeText(`COOL DOWN: ${day.coolDown.join(', ')}`), 15, y);
            y += 8;
        }

        y += 10; // Spacing between days
    });

    return doc;
};

const toInitial = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    return `${trimmed.charAt(0).toUpperCase()}.`;
};

export const buildWorkoutPlanPdfFilename = (firstName?: string, lastName?: string): string => {
    const firstInitial = toInitial(firstName || '');
    const lastInitial = toInitial(lastName || '');
    const initials = `${firstInitial}${lastInitial}`;

    return initials
        ? `${initials} ${WORKOUT_PLAN_FILENAME_SUFFIX}.pdf`
        : `${WORKOUT_PLAN_FILENAME_SUFFIX}.pdf`;
};

export const exportPlanToPDF = (currentPlan: Plan, redactSensitive: boolean) => {
    const doc = generatePlanDocument(currentPlan, redactSensitive);
    const selections = currentPlan.selections;
    const filename = buildWorkoutPlanPdfFilename(selections.firstName, selections.lastName);

    doc.save(filename);
};
