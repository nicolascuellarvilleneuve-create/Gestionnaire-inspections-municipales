
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, WMSTileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { CITY_CONFIG } from '../config/cityConfig';

// Fix Leaflet's default icon path issues in React
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper: Click Handler Component
const MapClickHandler = ({ onLocationFound }) => {
    useMapEvents({
        click: async (e) => {
            const { lat, lng } = e.latlng;
            // console.log("Clicked:", lat, lng);

            // We want to fetch WMS GetFeatureInfo here
            // This is complex because we need to build the URL based on the map bounds/size.
            // For now, we will just return the Lat/Lng to the parent.
            // Ideally, we would fetch the WMS info *here* or in the parent.

            // Let's try to fetch Matricule via a simplified geometric query if possible, 
            // OR just simulate it for this prototype if WMS parsing is too heavy.
            // Real WMS GetFeatureInfo requires BBOX, WIDTH, HEIGHT, I, J.
            // It's easier to implement if we had a dedicated backend proxy.

            // However, we can use the `Nominatim` reverse geocoding to get the address at least.
            // The Matricule (Lot) usually requires the proprietary MRNF query.

            onLocationFound({ lat, lng });
        }
    });
    return null;
};

// Custom Ghost Icon
const GhostIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const InspectionMap = ({ onSelectLocation, ghostLayer }) => {
    const [inspections, setInspections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPos, setSelectedPos] = useState(null);
    const [foundInfo, setFoundInfo] = useState(null);

    useEffect(() => {
        const fetchInspections = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/inspections');
                if (!response.ok) throw new Error("Failed to fetch map data");
                const data = await response.json();
                setInspections(data);
            } catch {
                // console.error("Map Error");
            } finally {
                setLoading(false);
            }
        };

        fetchInspections();
    }, []);

    const handleMapClick = async (pos) => {
        setSelectedPos(pos);
        setFoundInfo({ loading: true });

        // 1. Reverse Geocode (Address)
        let address = "Adresse inconnue";
        let street = "";
        let number = "";

        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.lat}&lon=${pos.lng}`);
            const data = await res.json();
            if (data && data.address) {
                number = data.address.house_number || "";
                street = data.address.road || "";
                address = `${number} ${street}`.trim();
            }
        } catch (e) {
            console.error("Geocode error", e);
        }

        // 2. WMS GetFeatureInfo (Matricule) - SIMULATED for reliability without full Proxy
        // Since we can't easily parse the specific MRNF XML response in frontend without CORS issues usually.
        // We will make a placeholder for the Matricule.
        // If the user wants *exact* matricule, we would need a backend helper.
        // For 'Keep it light', we will rely on visual inspection via the WMS layer 
        // and allow the user to type the seen Matricule or use a placeholder.
        const matricule = "À vérifier sur plan";

        setFoundInfo({
            address,
            number,
            street,
            matricule,
            lat: pos.lat,
            lng: pos.lng
        });
    };

    if (loading) return <div className="p-4 text-center">Chargement de la carte {CITY_CONFIG.name}...</div>;

    // Use Configured City Center
    const center = [CITY_CONFIG.coordinates.lat, CITY_CONFIG.coordinates.lng];

    return (
        <div className="h-[600px] w-full border rounded-lg overflow-hidden shadow-lg relative z-0">
            <MapContainer center={center} zoom={CITY_CONFIG.zoom} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
                <LayersControl position="topright">

                    {/* Base Layers */}
                    <LayersControl.BaseLayer checked name="OpenStreetMap">
                        <TileLayer
                            attribution='&copy; OpenStreetMap'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Satellite">
                        <TileLayer
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            attribution='&copy; Esri'
                        />
                    </LayersControl.BaseLayer>

                    {/* OVERLAYS - The "Matrice Graphique" */}
                    <LayersControl.Overlay checked name="🏛️ Cadastre (Infolot)">
                        <WMSTileLayer
                            url={CITY_CONFIG.layers.cadastre.url}
                            layers={CITY_CONFIG.layers.cadastre.layers}
                            format="image/png"
                            transparent={true}
                            version="1.3.0"
                            opacity={0.7}
                        />
                    </LayersControl.Overlay>

                    {/* Addresses Overlay */}
                    {/* Note: Adresses Quebec WMS might need specific layer names or API keys if public endpoint changes. */}
                    <LayersControl.Overlay name="📍 Adresses">
                        <WMSTileLayer
                            url={CITY_CONFIG.layers.adresses.url}
                            layers={CITY_CONFIG.layers.adresses.layers}
                            format="image/png"
                            transparent={true}
                            opacity={0.8}
                        />
                    </LayersControl.Overlay>

                </LayersControl>

                <MapClickHandler onLocationFound={handleMapClick} />

                {/* Markers for Existing Inspections */}
                {inspections.map((insp) => (
                    insp.lat && insp.lng ? (
                        <Marker key={insp.id} position={[insp.lat, insp.lng]}>
                            <Popup>
                                <div className="p-2">
                                    <h3 className="font-bold text-lg">{insp.adresse_civique}</h3>
                                    <p className={`font-bold ${insp.status_conformite === 'Non-conforme' ? 'text-red-500' : 'text-green-600'}`}>
                                        {insp.status_conformite}
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    ) : null
                ))}

                {/* Selection Marker & Popup */}
                {selectedPos && (
                    <Marker position={[selectedPos.lat, selectedPos.lng]}>
                        <Popup>
                            {foundInfo && foundInfo.loading ? (
                                <div>Recherche...</div>
                            ) : (
                                <div className="min-w-[200px] text-center">
                                    <h4 className="font-bold text-lg mb-1">{foundInfo?.address}</h4>
                                    <p className="text-gray-500 text-xs mb-2">
                                        Matricule (Visuel): <br />
                                        <span className="font-mono bg-yellow-100 px-1">{foundInfo?.matricule}</span>
                                    </p>

                                    {onSelectLocation && (
                                        <button
                                            onClick={() => onSelectLocation(foundInfo)}
                                            className="bg-blue-600 text-white w-full py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition"
                                        >
                                            🔍 Inspecter ce lot
                                        </button>
                                    )}
                                </div>
                            )}
                        </Popup>
                    </Marker>
                )}

                {/* GHOST LAYER (Projected Plan) */}
                {ghostLayer && (
                    <Marker position={[ghostLayer.lat, ghostLayer.lng]} icon={GhostIcon} opacity={0.9}>
                        <Popup autoClose={false} closeOnClick={false}>
                            <div className="text-center">
                                <h4 className="font-bold text-amber-600 uppercase text-xs tracking-wider mb-1">Plan Projeté (Fantôme)</h4>
                                <p className="text-sm font-bold">Emplacement calculé</p>
                                <p className="text-xs text-gray-500 mt-1">Vérifiez l'alignement avec le cadastre.</p>
                            </div>
                        </Popup>
                    </Marker>
                )}

            </MapContainer>
        </div>
    );
};

export default InspectionMap;
