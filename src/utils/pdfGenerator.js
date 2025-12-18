
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FORM_SECTIONS } from '../data/formStructure';

export const generateInspectionPDF = (inspection) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // --- Header ---
    doc.setFillColor(30, 41, 59); // Slate 900
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text("Rapport d'Inspection", 20, 20);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${inspection.date}`, 20, 30);
    doc.text(`ID: #${inspection.id}`, pageWidth - 50, 20);

    // --- Status Banner ---
    const isConforme = inspection.status === 'Conforme';
    doc.setFillColor(isConforme ? 220 : 254, isConforme ? 252 : 226, isConforme ? 231 : 226); // Green-50 vs Red-50
    doc.rect(15, 45, pageWidth - 30, 15, 'F');

    doc.setTextColor(isConforme ? 21 : 185, isConforme ? 128 : 28, isConforme ? 61 : 28); // Green-700 vs Red-700
    doc.setFont('helvetica', 'bold');
    doc.text(`STATUT GLOBAL : ${inspection.status.toUpperCase()}`, pageWidth / 2, 55, { align: 'center' });

    let yPos = 75;

    // --- Dynamic Sections ---
    FORM_SECTIONS.forEach(section => {

        // Skip hidden sections if necessary, but request was "show all fields"
        // For repeatable sections (e.g. Locataires), we check if there are items.
        // If empty, we might skip or show "None". 

        if (section.repeatable) {
            const items = inspection.formData[section.id] || [];

            if (items.length === 0) {
                // Option: Show section title and "Aucun élément"
                return;
            }

            items.forEach((item, index) => {
                // Check if page break needed
                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }

                // Section Header
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(30, 41, 59);
                doc.text(`${section.title} #${index + 1}`, 20, yPos);
                yPos += 8;

                const rows = section.fields.map(field => {
                    let val = item[field.id];
                    if (val === true) val = "Oui / Confirmé";
                    if (val === false) val = "Non";
                    if (val === undefined || val === null || val === '') val = "-";
                    return [field.label, val];
                });

                autoTable(doc, {
                    startY: yPos,
                    head: [['Champ', 'Valeur']],
                    body: rows,
                    theme: 'grid',
                    headStyles: { fillColor: [59, 130, 246] },
                    styles: { fontSize: 10, cellPadding: 3 },
                    columnStyles: { 0: { fontStyle: 'bold', width: 80 } }
                });

                yPos = doc.lastAutoTable.finalY + 10;
            });

        } else {
            // Standard Section
            // Check if page break needed
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59);
            doc.text(section.title, 20, yPos);
            yPos += 8;

            const rows = section.fields.map(field => {
                // Special handling to show Conformance logic if available?
                // For now, just show the value as requested "all fields"
                let val = inspection.formData[field.id];

                if (field.type === 'checkbox') {
                    val = val ? "Oui / Confirmé" : "Non";
                }

                if (val === undefined || val === null || val === '') {
                    val = "-";
                }

                return [field.label, val];
            });

            autoTable(doc, {
                startY: yPos,
                head: [['Champ', 'Valeur']],
                body: rows,
                theme: 'grid',
                headStyles: { fillColor: [71, 85, 105] }, // Slate 600 for standard headers
                styles: { fontSize: 10, cellPadding: 3 },
                columnStyles: { 0: { fontStyle: 'bold', width: 80 } } // Fixed width for labels
            });

            yPos = doc.lastAutoTable.finalY + 10;
        }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text('Généré par GIM Urbanisme', pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        doc.text(`Page ${i} sur ${pageCount}`, pageWidth - 20, doc.internal.pageSize.height - 10);
    }

    doc.save(`Rapport_Inspection_${inspection.id}_${inspection.date}.pdf`);
};
