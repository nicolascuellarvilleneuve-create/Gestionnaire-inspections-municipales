
import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_INSPECTIONS } from '../data/mockData';

const InspectionContext = createContext();

export const useInspections = () => useContext(InspectionContext);

export const InspectionProvider = ({ children }) => {
    // Initialize with mock data for MVP demo
    const [inspections, setInspections] = useState(() => {
        const saved = localStorage.getItem('gim_inspections');
        return saved ? JSON.parse(saved) : MOCK_INSPECTIONS;
    });

    useEffect(() => {
        localStorage.setItem('gim_inspections', JSON.stringify(inspections));
    }, [inspections]);

    const addInspection = (inspection) => {
        const newInspection = {
            ...inspection,
            id: Date.now(),
            date: new Date().toISOString().split('T')[0]
        };
        setInspections([newInspection, ...inspections]);
    };

    return (
        <InspectionContext.Provider value={{ inspections, addInspection }}>
            {children}
        </InspectionContext.Provider>
    );
};
