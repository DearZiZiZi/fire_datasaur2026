import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../utils/api';

// Fix for leaflet markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function DistributionMap() {
    const [offices, setOffices] = useState([]);
    const [recentTickets, setRecentTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [offRes, tickRes] = await Promise.all([
                    api.get('/api/analytics/offices'),
                    api.get('/api/tickets?limit=10')
                ]);
                setOffices(offRes.data);
                // Only take tickets that have coords and were assigned to an office we know
                setRecentTickets(tickRes.data.filter(t => t.lat && t.lng && t.assigned_office));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        // Refresh every minute to show live flow
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, []);

    const getOfficeColor = (load) => {
        if (load < 5) return '#00B25B'; // Brand Green
        if (load < 10) return '#F59E0B'; // Gold
        return '#EF4444'; // Red
    };

    if (loading) return <div className="h-full w-full flex items-center justify-center bg-bg-primary text-text-muted font-medium text-sm animate-pulse">Loading Map Telemetry...</div>;

    return (
        <div className="h-full w-full relative font-sans">
            <MapContainer
                center={[48.0196, 66.9237]}
                zoom={4}
                className="h-full w-full"
                style={{ background: '#0B0E14' }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {/* Offices as larger markers with load indicator */}
                {offices.map((office, idx) => (
                    <CircleMarker
                        key={`office-${idx}`}
                        center={[office.lat, office.lng]}
                        pathOptions={{
                            color: getOfficeColor(office.load),
                            fillColor: getOfficeColor(office.load),
                            fillOpacity: 0.25,
                            weight: 2
                        }}
                        radius={10 + (office.load * 0.5)}
                    >
                        <Popup className="rounded-xl shadow-md border-0">
                            <div className="text-xs font-sans bg-[#1F2937] text-white p-3 min-w-[160px] rounded-xl shadow-lg border border-gray-700">
                                <strong className="text-white text-sm tracking-tight">{office.office}</strong><br />
                                <span className="text-gray-400 mt-1 block">{office.address}</span>
                                <span className="font-semibold text-brand-green mt-3 block border-t border-gray-700 pt-2 text-[11px] uppercase tracking-wider">Load Balance: {office.load} Assets</span>
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}

                {/* Assignment Flow Lines (Arcs) */}
                {recentTickets.map((t) => {
                    const targetOffice = offices.find(o => o.office === t.assigned_office);
                    if (!targetOffice) return null;

                    return (
                        <React.Fragment key={`flow-${t.customer_guid}`}>
                            <Polyline
                                positions={[[t.lat, t.lng], [targetOffice.lat, targetOffice.lng]]}
                                pathOptions={{
                                    color: '#00B25B',
                                    weight: 1.5,
                                    dashArray: '4, 8',
                                    opacity: 0.6
                                }}
                            />
                            <CircleMarker
                                center={[t.lat, t.lng]}
                                pathOptions={{ color: '#00B25B', weight: 1.5, fillOpacity: 1, fillColor: '#0B0E14' }}
                                radius={3}
                            />
                        </React.Fragment>
                    );
                })}
            </MapContainer>

            {/* Legend Overlay */}
            <div className="absolute bottom-6 left-6 z-[1000] bg-[#1F2937] border border-gray-700 p-5 rounded-xl pointer-events-none shadow-lg font-sans max-w-[200px]">
                <div className="text-xs font-semibold uppercase text-gray-400 mb-4 tracking-wider border-b border-gray-700 pb-2">Load Capacity</div>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-brand-green shadow-[0_0_8px_rgba(0,178,91,0.5)]"></div>
                        <span className="text-sm font-medium text-gray-200">Optimal Level</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-accent-gold shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                        <span className="text-sm font-medium text-gray-200">Moderate Load</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-accent-red shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                        <span className="text-sm font-medium text-gray-200">Critical Saturation</span>
                    </div>
                    <div className="flex items-center gap-3 border-t border-gray-700 pt-4 mt-2">
                        <div className="w-6 h-[2px] border-t-2 border-dashed border-brand-green opacity-70"></div>
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Routing Vector</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
