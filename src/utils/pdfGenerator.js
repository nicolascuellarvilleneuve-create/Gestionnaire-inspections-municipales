
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

    // --- Info ---
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(11);
    doc.text(`Adresse: ${inspection.adresse}`, 20, 75);
    doc.text(`Propriétaire: ${inspection.proprietaire}`, 20, 82);
    doc.text(`Zone: ${inspection.zone}`, 20, 89);

    let yPos = 100;

    // --- Tables by Section ---
    // We need to reconstruct the sections from the saved formData
    // This is a simplified view since formData is flat (mostly)

    const addSectionTitle = (title) => {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(title, 20, yPos);
        yPos += 8;
    };

    // 1. Marges (Critical)
    addSectionTitle("Vérification des Marges");

    const marginRows = [];
    if (inspection.details) {
        Object.entries(inspection.details).forEach(([key, val]) => {
            marginRows.push([
                key,
                `${val.requis} m`,
                `${val.releve} m`,
                val.conforme ? 'Conforme' : 'NON-CONFORME'
            ]);
        });
    } else if (inspection.formData) {
        // Fallback if details structure isn't perfect, try to read raw norms
        // This part depends on how we stored the validation calculation in history
        // Ideally we should have stored the 'details' object computed during save
        marginRows.push(["Données détaillées", "Voir grille", "-", "-"]);
    }

    autoTable(doc, {
        startY: yPos,
        head: [['Marge', 'Requis', 'Relevé', 'Statut']],
        body: marginRows,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 10 },
        didParseCell: function (data) {
            if (data.section === 'body' && data.column.index === 3) {
                if (data.cell.raw === 'NON-CONFORME') {
                    data.cell.styles.textColor = [220, 38, 38];
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        }
    });

    yPos = doc.lastAutoTable.finalY + 15;

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text('Généré par GIM Urbanisme', pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    doc.save(`Rapport_Inspection_${inspection.id}_${inspection.date}.pdf`);
};
