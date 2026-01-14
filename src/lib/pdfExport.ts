import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Plan } from '@/types/fitness';

export const exportPlanToPDF = (currentPlan: Plan) => {
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
    doc.setFillColor(139, 92, 246); // Primary purple
    doc.rect(0, 0, 220, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');

    // Personalized title if name is provided
    const userName = `${selections.firstName || ''} ${selections.lastName || ''}`.trim();
    if (userName) {
        doc.text(`${userName}'s Workout Plan`, 14, 18);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Powered by FitWizard', 14, 26);
    } else {
        doc.text('FitWizard', 14, 18);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Your Personalized Workout Plan', 14, 26);
    }

    // Timestamp in header
    doc.setFontSize(10);
    doc.text(`Generated: ${timestamp}`, 14, 38);

    // Personal goal note (if provided)
    let y = 55;
    if (selections.personalGoalNote) {
        doc.setTextColor(139, 92, 246);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bolditalic');
        doc.text(`"${selections.personalGoalNote}"`, 14, y);
        y += 12;
    }

    // Plan details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Split: ${currentPlan.splitType.replace('_', ' ').toUpperCase()}`, 14, y);
    doc.text(`Days/Week: ${selections.daysPerWeek}`, 14, y + 7);
    doc.text(`Session Duration: ${selections.sessionDuration} min`, 14, y + 14);
    doc.text(`Goal: ${selections.goal.charAt(0).toUpperCase() + selections.goal.slice(1)}`, 14, y + 21);

    y += 35;
    currentPlan.workoutDays.forEach((day) => {
        // Day header with pink accent
        doc.setFillColor(236, 72, 153); // Secondary pink
        doc.rect(14, y - 5, 182, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(day.name, 16, y);
        y += 10;

        doc.setTextColor(0, 0, 0);
        const rows = day.exercises.map(e => [e.exercise.name, `${e.sets}`, e.reps, `${e.rir}`, `${e.restSeconds}s`]);
        autoTable(doc, {
            startY: y,
            head: [['Exercise', 'Sets', 'Reps', 'RIR', 'Rest']],
            body: rows,
            margin: { left: 14 },
            headStyles: { fillColor: [139, 92, 246] },
            alternateRowStyles: { fillColor: [250, 245, 255] }
        });
        // @ts-ignore - lastAutoTable exists on jsPDF instance when plugin is loaded
        y = doc.lastAutoTable.finalY + 15;
        if (y > 260) { doc.addPage(); y = 20; }
    });

    // Motivational footer
    doc.setFontSize(10);
    doc.setTextColor(139, 92, 246);
    doc.setFont('helvetica', 'italic');
    doc.text("You've got this! Every rep counts. 💪", 14, 285);

    // Generate filename with user's name if available
    const filename = userName
        ? `${userName.replace(/\s+/g, '_')}_FitWizard_Plan.pdf`
        : 'FitWizard_Plan.pdf';

    doc.save(filename);
};
