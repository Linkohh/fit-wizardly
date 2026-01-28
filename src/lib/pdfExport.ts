import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Plan } from '@/types/fitness';

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
    doc.triangle(0, 300, 220, 200, 220, 300, 'F');

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
    const userName = redactSensitive ? 'ATHLETE' : `${selections.firstName || ''} ${selections.lastName || ''}`.trim();
    doc.text(userName.toUpperCase() || 'ATHLETE', 20, 160);

    doc.setFontSize(12);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(`${currentPlan.splitType.replace('_', ' ').toUpperCase()} • ${selections.goal.toUpperCase()}`, 20, 170);

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
    if (!redactSensitive && selections.personalGoalNote) {
        doc.setTextColor(...COLORS.text.body);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'italic');
        doc.text(`"${selections.personalGoalNote}"`, 105, y, { align: 'center' });
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
        doc.text(`DAY ${index + 1}: ${day.name.toUpperCase()}`, 15, y + 8);

        // Tags
        if (day.focusTags && day.focusTags.length > 0) {
            doc.setFontSize(8);
            doc.setTextColor(...COLORS.text.light);
            doc.text(day.focusTags.join(' • ').toUpperCase(), 195, y + 8, { align: 'right' });
        }

        y += 18;

        // Warmup (Subtle)
        if (day.warmUp && day.warmUp.length > 0) {
            doc.setFontSize(8);
            doc.setTextColor(...COLORS.text.light);
            doc.text(`WARM UP: ${day.warmUp.join(', ')}`, 15, y);
            y += 8;
        }

        // Exercise Table
        const rows = day.exercises.map(e => {
            const rirLabel = e.rir === 0 ? 'FAILURE' : `${e.rir} RIR`;
            return [
                e.exercise.name,
                `${e.sets}`,
                e.reps,
                rirLabel,
                `${e.restSeconds}s`
            ];
        });

        autoTable(doc, {
            startY: y,
            head: [['EXERCISE', 'SETS', 'REPS', 'INTENSITY', 'REST']],
            body: rows,
            theme: 'plain', // Cleaner look, we will add borders manually if needed or rely on row colors
            styles: {
                font: 'helvetica',
                fontSize: 9,
                textColor: COLORS.text.body,
                cellPadding: 4,
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
                1: { halign: 'center', cellWidth: 15 },
                2: { halign: 'center', cellWidth: 20 },
                3: { halign: 'center', cellWidth: 20, fontStyle: 'bold', textColor: COLORS.secondary }, // Pink Intensity
                4: { halign: 'center', cellWidth: 15 }
            },
            alternateRowStyles: {
                fillColor: COLORS.surface
            },
            margin: { left: 10, right: 10 }
        });

        // @ts-ignore
        y = doc.lastAutoTable.finalY + 10;

        // Cooldown
        if (day.coolDown && day.coolDown.length > 0) {
            doc.setFontSize(8);
            doc.setTextColor(...COLORS.text.light);
            doc.text(`COOL DOWN: ${day.coolDown.join(', ')}`, 15, y);
            y += 8;
        }

        y += 10; // Spacing between days
    });

    return doc;
};

export const exportPlanToPDF = (currentPlan: Plan, redactSensitive: boolean) => {
    const doc = generatePlanDocument(currentPlan, redactSensitive);
    const selections = currentPlan.selections;
    const userName = redactSensitive ? '' : `${selections.firstName || ''} ${selections.lastName || ''}`.trim();

    // Generate filename with user's name if available
    const filename = userName && !redactSensitive
        ? `${userName.replace(/\s+/g, '_')}_FitWizard_Plan.pdf`
        : 'FitWizard_Plan.pdf';

    doc.save(filename);
};
