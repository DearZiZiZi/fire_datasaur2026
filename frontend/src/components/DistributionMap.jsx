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

const officeIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
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
        if (load < 5) return '#10B981'; // Green
        if (load < 10) return '#F59E0B'; // Gold
        return '#EF4444'; // Red
    };

    if (loading) return <div className="h-full w-full flex items-center justify-center bg-bg-primary text-text-muted font-bold text-[10px] uppercase tracking-widest animate-pulse font-mono">LOADING_MAP_TELEMETRY...</div>;

    return (
        <div className="h-full w-full relative">
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
                            fillOpacity: 0.15,
                            weight: 2
                        }}
                        radius={10 + (office.load * 0.5)}
                    >
                        <Popup>
                            <div className="text-[10px] font-mono uppercase bg-bg-primary text-text-primary p-1">
                                <strong className="text-accent-gold">{office.office}</strong><br />
                                <span className="text-text-muted">{office.address}</span><br />
                                <span className="font-bold text-accent-green mt-1 block">LOAD_BAL: {office.load} UNITS</span>
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}

                {/* Assignment Flow Lines (Arcs) */}
                {recentTickets.map((t, idx) => {
                    const targetOffice = offices.find(o => o.office === t.assigned_office);
                    if (!targetOffice) return null;

                    return (
                        <React.Fragment key={`flow-${t.customer_guid}`}>
                            <Polyline
                                positions={[[t.lat, t.lng], [targetOffice.lat, targetOffice.lng]]}
                                pathOptions={{
                                    color: '#F59E0B',
                                    weight: 1,
                                    dashArray: '3, 6',
                                    opacity: 0.4
                                }}
                            />
                            <CircleMarker
                                center={[t.lat, t.lng]}
                                pathOptions={{ color: '#F59E0B', weight: 1, fillOpacity: 1, fillColor: '#0B0E14' }}
                                radius={2}
                            />
                        </React.Fragment>
                    );
                })}
            </MapContainer>

            {/* Legend Overlay */}
            <div className="absolute bottom-6 left-6 z-[1000] bg-bg-secondary border border-border p-4 pointer-events-none shadow-terminal font-mono">
                <div className="text-[9px] font-bold uppercase text-text-muted mb-3 tracking-widest border-b border-border pb-2">LOAD_CAPACITY_IND</div>
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-accent-green"></div>
                        <span className="text-[9px] font-bold text-text-secondary uppercase">OPTIMAL_READY</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-accent-gold"></div>
                        <span className="text-[9px] font-bold text-text-secondary uppercase">MODERATE_LOAD</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-accent-red"></div>
                        <span className="text-[9px] font-bold text-text-secondary uppercase">CRITICAL_SAT</span>
                    </div>
                    <div className="flex items-center gap-3 border-t border-border pt-3 mt-1">
                        <div className="w-6 h-[1px] border-t border-dashed border-accent-gold opacity-50"></div>
                        <span className="text-[9px] font-bold text-text-secondary uppercase tracking-tighter">ROUTING_VECTOR</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
