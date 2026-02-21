import React, { useEffect, useState } from 'react';
import { X, Copy, Check, MapPin, Building, ArrowRight, AlertCircle, Bot, Users } from 'lucide-react';
import api from '../utils/api';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom icons representing the markers
const customerIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const officeIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

export default function TicketDetail({ ticketId, onClose }) {
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [officeData, setOfficeData] = useState(null);
    const [managerData, setManagerData] = useState(null);

    useEffect(() => {
        const load = async () => {
            if (!ticketId) return;
            setLoading(true);
            try {
                const res = await api.get(`/api/tickets/${ticketId}`);
                setTicket(res.data);

                // Fetch offices to get coords of assigned office
                try {
                    const offRes = await api.get('/api/analytics/offices');
                    const matchingOffice = offRes.data.find(o => o.office === res.data.assigned_office);
                    setOfficeData(matchingOffice);
                } catch (e) { console.error("Offices fetch fail", e); }

                // Fetch manager detail
                if (res.data.assigned_manager_name) {
                    try {
                        const mgrRes = await api.get('/api/managers');
                        const mgr = mgrRes.data.find(m => m.full_name === res.data.assigned_manager_name);
                        setManagerData(mgr);
                    } catch (e) { console.error("Manager fetch fail", e); }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [ticketId]);

    const handleCopy = () => {
        if (ticket?.ai_prepared_response) {
            navigator.clipboard.writeText(ticket.ai_prepared_response);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!ticket && loading) return (
        <div className="absolute top-0 right-0 bottom-0 w-[600px] bg-bg-primary border-l border-border z-50 p-6 shadow-terminal flex items-center justify-center">
            <div className="text-accent-gold font-bold animate-pulse uppercase tracking-[0.2em] text-[10px] font-mono">SYNCHRONIZING_ASSET_TELEMETRY...</div>
        </div>
    );
    if (!ticket) return null;

    const isDone = ticket.processing_status === 'done';

    return (
        <div className="absolute top-0 right-0 bottom-0 w-[600px] bg-bg-primary border-l border-border z-50 shadow-terminal flex flex-col pt-[56px] animate-in slide-in-from-right duration-300 font-mono" style={{ top: '-56px' }}>

            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 border-b border-border bg-bg-secondary h-[56px]">
                <div className="flex items-center gap-4">
                    <span className="font-bold text-accent-gold tracking-tight text-lg uppercase">{ticket.customer_guid?.substring(0, 12)}</span>
                    <span className={`badge ${ticket.segment === 'VIP' ? 'bg-accent-gold text-bg-primary border-none shadow-terminal-focus' : ticket.segment === 'Priority' ? 'badge-priority' : 'badge-mass'}`}>{ticket.segment}</span>
                </div>
                <button onClick={onClose} className="text-text-muted hover:text-accent-gold transition-all p-2 hover:bg-bg-tertiary">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-terminal">

                {/* Section 1 - Customer info */}
                <div className="grid grid-cols-2 gap-6 bg-bg-secondary p-4 border border-border mt-2 shadow-terminal">
                    <div>
                        <div className="text-text-muted text-[9px] font-bold uppercase mb-2 tracking-[0.2em]">TARGET_SUBJECT_ID</div>
                        <div className="font-bold text-text-primary text-sm mb-1 uppercase tracking-tight">{ticket.gender || 'PRIVATE_CLIENT'}</div>
                        <div className="text-text-secondary text-[10px] uppercase">BORN: {ticket.date_of_birth || 'UNKNOWN'}</div>
                    </div>
                    <div>
                        <div className="text-text-muted text-[9px] font-bold uppercase mb-2 tracking-[0.2em]">GEOGRAPHIC_LOCALE</div>
                        <div className="font-bold text-text-primary text-[11px] truncate uppercase tracking-tight">{[ticket.country, ticket.region, ticket.city].filter(Boolean).join(' // ') || 'UNLISTED'}</div>
                        <div className="text-text-secondary mt-1 text-[10px] uppercase">{[ticket.street, ticket.house].filter(Boolean).join(', ')}</div>
                    </div>
                </div>

                {/* Section 2 - AI Analysis */}
                {isDone && (
                    <div className="border border-accent-gold/20 bg-accent-gold/5 p-5 shadow-terminal">
                        <h3 className="text-accent-gold font-bold text-[10px] uppercase mb-4 flex gap-2 items-center tracking-[0.2em]"><Bot size={16} /> CORE_INTELLIGENCE_SYNTHESIS</h3>

                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className="px-2 py-0.5 border border-accent-gold/30 text-accent-gold text-[9px] font-bold uppercase tracking-wider">{ticket.request_type}</span>
                            <span className="px-2 py-0.5 border border-accent-gold/30 text-accent-gold text-[9px] font-bold uppercase tracking-wider">{ticket.tone}</span>
                            <span className={`px-2 py-0.5 border text-[9px] font-bold uppercase tracking-wider ${ticket.priority_score >= 8 ? 'bg-accent-red text-bg-primary border-accent-red' : 'border-accent-gold/30 text-accent-gold'}`}>PRIORITY: {ticket.priority_score}/10</span>
                        </div>

                        <div className="mb-4">
                            <div className="text-text-muted text-[9px] font-bold uppercase mb-2 tracking-widest">STRATEGIC_SUMMARY</div>
                            <p className="text-[11px] leading-relaxed text-text-primary font-bold uppercase border-l-2 border-accent-gold/20 pl-3">{ticket.ai_summary}</p>
                        </div>

                        <div>
                            <div className="text-text-muted text-[9px] font-bold uppercase mb-2 flex items-center justify-between tracking-widest">
                                PROPOSED_SOLUTION_OUTPUT
                                <button onClick={handleCopy} className="text-accent-gold hover:underline flex items-center gap-1.5 font-bold uppercase">
                                    {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? 'CAPTURED' : 'COPY_BLOCK'}
                                </button>
                            </div>
                            <div className="bg-bg-tertiary border border-border p-4 text-[11px] font-bold text-text-primary italic leading-relaxed shadow-terminal">
                                {ticket.ai_prepared_response}
                            </div>
                        </div>
                    </div>
                )}

                {/* Section 3 - Assignment Chain */}
                {isDone && (
                    <div className="terminal-card p-5">
                        <h3 className="text-text-muted text-[9px] font-bold uppercase mb-4 tracking-widest">ALLOCATION_PIPELINE</h3>

                        <div className="flex items-center justify-between bg-bg-secondary p-3 border border-border shadow-terminal">
                            <div className="flex flex-col items-center flex-1 text-center">
                                <div className="p-2 bg-bg-tertiary border border-border mb-2">
                                    <MapPin size={16} className="text-accent-gold" />
                                </div>
                                <span className="text-[9px] font-bold text-text-primary uppercase tracking-tighter">{ticket.city || 'ORIGIN'}</span>
                            </div>
                            <ArrowRight size={12} className="text-text-muted/30 mx-1" />
                            <div className="flex flex-col items-center flex-1 text-center">
                                <div className="p-2 bg-bg-tertiary border border-border mb-2">
                                    <Bot size={16} className="text-accent-gold" />
                                </div>
                                <span className="text-[9px] font-bold text-text-primary uppercase tracking-tighter">{ticket.request_type?.substring(0, 10).toUpperCase()}</span>
                            </div>
                            <ArrowRight size={12} className="text-text-muted/30 mx-1" />
                            <div className="flex flex-col items-center flex-1 text-center">
                                <div className="p-2 bg-bg-tertiary border border-border mb-2">
                                    <Building size={16} className="text-accent-gold" />
                                </div>
                                <span className="text-[9px] font-bold text-text-primary uppercase tracking-tighter">{ticket.assigned_office?.substring(0, 8).toUpperCase()}</span>
                            </div>
                            <ArrowRight size={12} className="text-text-muted/30 mx-1" />
                            <div className="flex flex-col items-center flex-1 text-center">
                                <div className="p-2 bg-accent-gold border border-accent-gold mb-2">
                                    <Users size={16} className="text-bg-primary" />
                                </div>
                                <span className="text-[9px] font-bold text-accent-gold uppercase tracking-tighter truncate w-full px-1">{managerData?.full_name?.split(' ')[0].toUpperCase() || 'HANDLER'}</span>
                            </div>
                        </div>

                        {ticket.assignment_warning && (
                            <div className="mt-4 bg-accent-red/5 text-accent-red border border-accent-red/20 text-[9px] font-bold p-3 flex gap-3 items-center">
                                <AlertCircle size={14} className="shrink-0" />
                                <span className="uppercase tracking-widest leading-tight">{ticket.assignment_warning.toUpperCase()}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Section 4 - Map */}
                {ticket.lat && ticket.lng && (
                    <div className="terminal-card overflow-hidden h-[200px] relative border border-border shadow-terminal">
                        <MapContainer center={[ticket.lat, ticket.lng]} zoom={5} scrollWheelZoom={false} className="w-full h-full" style={{ background: '#0B0E14' }}>
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            />
                            <Marker position={[ticket.lat, ticket.lng]} icon={customerIcon}>
                                <Popup>CUSTOMER_LOCALE</Popup>
                            </Marker>
                            {officeData?.lat && officeData?.lng && (
                                <>
                                    <Marker position={[officeData.lat, officeData.lng]} icon={officeIcon}>
                                        <Popup>{officeData.office.toUpperCase()}</Popup>
                                    </Marker>
                                    <Polyline positions={[[ticket.lat, ticket.lng], [officeData.lat, officeData.lng]]} color="#F59E0B" weight={1} dashArray="4, 4" opacity={0.6} />
                                </>
                            )}
                        </MapContainer>
                    </div>
                )}

                {/* Section 5 - Description */}
                <div className="pb-6">
                    <h3 className="text-text-muted text-[9px] font-bold uppercase mb-3 tracking-widest">RAW_REQUEST_TELEMETRY</h3>
                    <div className="bg-bg-tertiary border border-border p-5 text-[11px] font-bold text-text-primary leading-relaxed shadow-terminal uppercase">
                        {ticket.description || <span className="text-text-muted italic">NO_DATA_FIELD_NULL</span>}
                    </div>
                    {ticket.attachments && (
                        <div className="mt-3 text-[9px] font-bold bg-bg-secondary border border-border p-3 flex items-center gap-3 shadow-terminal">
                            <span className="text-text-muted uppercase tracking-widest">DIGITAL_ASSET_GUID:</span>
                            <span className="text-accent-gold underline cursor-pointer uppercase">{ticket.attachments}</span>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
