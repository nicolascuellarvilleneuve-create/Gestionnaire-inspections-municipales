

// Removed static import
// import * as XLSX from 'xlsx';

export const exportFullDatabase = (inspections) => {
    const dataStr = JSON.stringify(inspections);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_inspections_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

export const exportToExcel = async (inspections) => {
    // Dynamic import to save ~300KB+ from initial bundle
    const XLSX = await import('xlsx');

    const flattenedData = inspections.map(insp => ({
        ID: insp.id,
        Date: insp.date,
        Adresse: insp.adresse,
        Propriétaire: insp.proprietaire,
        Zone: insp.zone,
        Statut: insp.status,
        ...insp.formData // This will dump all form fields naturally
    }));

    const worksheet = XLSX.utils.json_to_sheet(flattenedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inspections");
    XLSX.writeFile(workbook, `Inspections_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const importDatabase = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (Array.isArray(data)) {
                localStorage.setItem('inspections', JSON.stringify(data));
                callback(true, data);
            } else {
                callback(false, "Format invalide (doit être un tableau)");
            }
        } catch {
            callback(false, "Erreur de lecture JSON");
        }
    };
    reader.readAsText(file);
};
