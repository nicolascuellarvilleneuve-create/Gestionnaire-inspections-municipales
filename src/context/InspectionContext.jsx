import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const InspectionContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useInspections = () => useContext(InspectionContext);

export const InspectionProvider = ({ children }) => {
    const { getToken } = useAuth();
    const [inspections, setInspections] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchInspections = useCallback(async () => {
        const token = getToken();
        if (!token) return;

        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/api/inspections', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setInspections(data);
            }
        } catch (error) {
            console.error("Failed to fetch inspections", error);
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    // Initial Load
    useEffect(() => {
        fetchInspections();
    }, [fetchInspections]);

    // Added wrapper to refresh list after external save
    const addInspection = async () => {
        await fetchInspections();
    };

    // Implement server-side delete
    const deleteInspection = async (ids) => {
        const idArray = Array.isArray(ids) ? ids : [ids];
        const token = getToken();

        // Optimistic UI Update failure fallback? No, let's just refresh.
        // Actually, for bulk delete, doing it parallel is fine for now.
        for (const id of idArray) {
            try {
                await fetch(`http://localhost:3001/api/inspections/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (e) {
                console.error("Delete failed for", id, e);
            }
        }
        await fetchInspections(); // Refresh list to be sure
    };

    return (
        <InspectionContext.Provider value={{ inspections, loading, addInspection, deleteInspection, fetchInspections }}>
            {children}
        </InspectionContext.Provider>
    );
};
