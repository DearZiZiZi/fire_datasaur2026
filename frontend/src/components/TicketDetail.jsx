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
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const officeIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
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
        <div className="absolute top-0 right-0 bottom-0 w-[550px] bg-bg-secondary border-l border-border z-50 p-6 shadow-xl flex items-center justify-center">
            <div className="text-text-muted font-medium animate-pulse text-sm">Loading Ticket Details...</div>
        </div>
    );
    if (!ticket) return null;

    const isDone = ticket.processing_status === 'done';

    return (
        <div className="absolute top-0 right-0 bottom-0 w-[550px] bg-bg-primary border-l border-border z-50 shadow-2xl flex flex-col pt-[64px] animate-in slide-in-from-right duration-300 font-sans" style={{ top: '-64px' }}>

            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 bg-[#111827] border-b border-gray-700 h-[64px] shrink-0">
                <div className="flex items-center gap-4">
                    <span className="font-bold text-text-primary text-xl tracking-tight">{ticket.customer_guid?.substring(0, 12)}</span>
                    <span className={`badge ${ticket.segment === 'VIP' ? 'bg-accent-gold/10 text-accent-gold border-accent-gold/20' : ticket.segment === 'Priority' ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/20' : 'bg-bg-tertiary text-text-secondary border-border'}`}>{ticket.segment}</span>
                </div>
                <button onClick={onClose} className="text-text-muted hover:text-text-primary hover:bg-bg-tertiary p-2 rounded-lg transition-all">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* Section 1 - Customer info */}
                <div className="grid grid-cols-2 gap-4 bg-[#1F2937] p-5 rounded-xl border border-gray-700 shadow-sm">
                    <div>
                        <div className="text-text-muted text-xs font-semibold uppercase mb-1 tracking-wider">Target Profile</div>
                        <div className="font-semibold text-text-primary text-base capitalize">{ticket.gender || 'Private Client'}</div>
                        <div className="text-text-secondary text-sm mt-0.5">Born: {ticket.date_of_birth || 'Unknown'}</div>
                    </div>
                    <div>
                        <div className="text-text-muted text-xs font-semibold uppercase mb-1 tracking-wider">Location</div>
                        <div className="font-semibold text-text-primary text-[15px] truncate">{[ticket.country, ticket.region, ticket.city].filter(Boolean).join(', ') || 'Unlisted'}</div>
                        <div className="text-text-secondary mt-0.5 text-sm">{[ticket.street, ticket.house].filter(Boolean).join(', ')}</div>
                    </div>
                </div>

                {/* Section 2 - AI Analysis */}
                {isDone && (
                    <div className="border border-brand-green/20 bg-brand-green/5 p-5 rounded-xl">
                        <h3 className="text-brand-green font-bold text-sm uppercase mb-4 flex gap-2 items-center tracking-wider"><Bot size={18} /> AI Strategy Synthesis</h3>

                        <div className="flex flex-wrap gap-2 mb-5">
                            <span className="px-3 py-1 bg-[#111827] border border-brand-green/20 text-brand-green rounded-md text-xs font-semibold">{ticket.request_type}</span>
                            <span className="px-3 py-1 bg-[#111827] border border-brand-green/20 text-brand-green rounded-md text-xs font-semibold">{ticket.tone}</span>
                            <span className={`px-3 py-1 rounded-md border text-xs font-semibold ${ticket.priority_score >= 8 ? 'bg-accent-red/10 text-accent-red border-accent-red/20' : 'bg-[#111827] border-brand-green/20 text-brand-green'}`}>Priority: {ticket.priority_score}/10</span>
                        </div>

                        <div className="mb-5">
                            <div className="text-text-muted text-xs font-semibold uppercase mb-2 tracking-wider">Strategic Summary</div>
                            <p className="text-sm leading-relaxed text-gray-300 font-medium border-l-[3px] border-brand-green pl-3.5 bg-[#111827]/50 py-1">{ticket.ai_summary}</p>
                        </div>

                        <div>
                            <div className="text-text-muted text-xs font-semibold uppercase mb-2 flex items-center justify-between tracking-wider">
                                Proposed Output Response
                                <button onClick={handleCopy} className="text-brand-green hover:text-brand-hover hover:underline flex items-center gap-1.5 font-semibold capitalize text-sm transition-colors">
                                    {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy Text'}
                                </button>
                            </div>
                            <div className="bg-[#111827] border border-gray-700 rounded-lg p-4 text-sm font-medium text-gray-300 italic leading-relaxed shadow-sm whitespace-pre-line">
                                {ticket.ai_prepared_response}
                            </div>
                        </div>
                    </div>
                )}

                {/* Section 3 - Assignment Chain */}
                {isDone && (
                    <div className="fb-card p-5">
                        <h3 className="text-text-muted text-xs font-semibold uppercase mb-4 tracking-wider">Assignment Pipeline</h3>

                        <div className="flex items-center justify-between bg-bg-primary p-4 rounded-lg border border-border">
                            <div className="flex flex-col items-center flex-1 text-center">
                                <div className="p-2.5 bg-[#1F2937] rounded-full border border-gray-700 shadow-sm mb-2">
                                    <MapPin size={18} className="text-brand-green" />
                                </div>
                                <span className="text-xs font-semibold text-text-primary">{ticket.city || 'Origin'}</span>
                            </div>
                            <ArrowRight size={14} className="text-text-muted/50 mx-2" />
                            <div className="flex flex-col items-center flex-1 text-center">
                                <div className="p-2.5 bg-[#1F2937] rounded-full border border-gray-700 shadow-sm mb-2">
                                    <Bot size={18} className="text-brand-green" />
                                </div>
                                <span className="text-xs font-semibold text-text-primary truncate max-w-[80px]" title={ticket.request_type}>{ticket.request_type?.substring(0, 12)}</span>
                            </div>
                            <ArrowRight size={14} className="text-text-muted/50 mx-2" />
                            <div className="flex flex-col items-center flex-1 text-center">
                                <div className="p-2.5 bg-[#1F2937] rounded-full border border-gray-700 shadow-sm mb-2">
                                    <Building size={18} className="text-brand-green" />
                                </div>
                                <span className="text-xs font-semibold text-text-primary truncate max-w-[80px]" title={ticket.assigned_office}>{ticket.assigned_office?.substring(0, 10)}</span>
                            </div>
                            <ArrowRight size={14} className="text-text-muted/50 mx-2" />
                            <div className="flex flex-col items-center flex-1 text-center">
                                <div className="p-2.5 bg-brand-green rounded-full shadow-sm mb-2 text-white">
                                    <Users size={18} />
                                </div>
                                <span className="text-xs font-bold text-brand-green truncate max-w-[80px]">{managerData?.full_name?.split(' ')[0] || 'Handler'}</span>
                            </div>
                        </div>

                        {ticket.assignment_warning && (
                            <div className="mt-4 bg-accent-orange/10 text-accent-orange border border-accent-orange/20 rounded-lg text-sm font-medium p-3 flex gap-3 items-start">
                                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                <span className="leading-snug">{ticket.assignment_warning}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Section 4 - Map */}
                {ticket.lat && ticket.lng && (
                    <div className="fb-card overflow-hidden h-[220px] relative p-0 border border-border z-0">
                        <MapContainer center={[ticket.lat, ticket.lng]} zoom={5} scrollWheelZoom={false} className="w-full h-full" style={{ zIndex: 0 }}>
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                            />
                            <Marker position={[ticket.lat, ticket.lng]} icon={customerIcon}>
                                <Popup>Customer Location</Popup>
                            </Marker>
                            {officeData?.lat && officeData?.lng && (
                                <>
                                    <Marker position={[officeData.lat, officeData.lng]} icon={officeIcon}>
                                        <Popup>{officeData.office}</Popup>
                                    </Marker>
                                    <Polyline positions={[[ticket.lat, ticket.lng], [officeData.lat, officeData.lng]]} color="#00B25B" weight={2} dashArray="5, 5" opacity={0.8} />
                                </>
                            )}
                        </MapContainer>
                    </div>
                )}

                {/* Section 5 - Description */}
                <div className="pb-6">
                    <h3 className="text-text-muted text-xs font-semibold uppercase mb-3 tracking-wider">Raw Request Content</h3>
                    <div className="bg-[#1F2937] border border-gray-700 rounded-xl p-5 text-sm font-medium text-gray-300 leading-relaxed shadow-sm">
                        {ticket.description || <span className="text-text-muted italic">No Description Provided</span>}
                    </div>
                    {ticket.attachments && (
                        <div className="mt-3 text-sm font-medium bg-[#1F2937] rounded-lg border border-gray-700 p-3 flex items-center justify-between shadow-sm">
                            <span className="text-text-muted tracking-wide flex items-center gap-2">Attachment:</span>
                            <span className="text-brand-green hover:text-brand-hover underline cursor-pointer">{ticket.attachments}</span>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
