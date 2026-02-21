import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Eye, Search, Filter } from 'lucide-react';
import TicketDetail from '../components/TicketDetail';

const TONE_COLORS = {
    'Позитивный': 'text-brand-green',
    'Нейтральный': 'text-text-muted',
    'Негативный': 'text-accent-red'
};

const STATUS_COLORS = {
    'pending': 'border-border text-text-secondary bg-bg-tertiary',
    'processing': 'border-accent-blue/30 text-accent-blue bg-accent-blue/10',
    'done': 'border-brand-green/30 text-brand-green bg-brand-green/10',
    'error': 'border-accent-red/30 text-accent-red bg-accent-red/10'
};

// Map languages to flags
const LANG_FLAGS = {
    'KZ': '🇰🇿',
    'ENG': '🇬🇧',
    'RU': '🇷🇺'
};

export default function Tickets() {
    const [tickets, setTickets] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);

    // Drawer state
    const [selectedTicketId, setSelectedTicketId] = useState(null);

    // Filters
    const [search, setSearch] = useState('');
    const [segment, setSegment] = useState('All');
    const [status, setStatus] = useState('All');

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/tickets?limit=100');
            setTickets(res.data);
            setFiltered(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Apply basic frontend filters
    useEffect(() => {
        let f = tickets;
        if (search) {
            const lower = search.toLowerCase();
            f = f.filter(t => t.customer_guid?.toLowerCase().includes(lower) || t.description?.toLowerCase().includes(lower));
        }
        if (segment !== 'All') {
            f = f.filter(t => t.segment === segment);
        }
        if (status !== 'All') {
            f = f.filter(t => t.processing_status === status);
        }
        setFiltered(f);
    }, [search, segment, status, tickets]);

    const getPriorityColor = (p) => {
        if (!p) return 'bg-transparent';
        if (p <= 3) return 'bg-brand-green';
        if (p <= 6) return 'bg-accent-gold';
        if (p <= 8) return 'bg-accent-orange';
        return 'bg-accent-red';
    };

    return (
        <div className="flex flex-col h-full relative font-sans">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-text-primary">Tickets</h1>

                {/* Filters Bar */}
                <div className="flex items-center gap-4 bg-[#1F2937] px-3 py-2 rounded-lg border border-gray-700 shadow-sm">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search by GUID..."
                            className="bg-transparent border-none pl-9 pr-4 py-1 w-[240px] text-sm text-text-primary focus:outline-none placeholder:text-text-muted focus:ring-0"
                            value={search} onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="h-5 w-px bg-border mx-1"></div>
                    <select className="bg-transparent border-none text-sm font-medium text-text-secondary cursor-pointer focus:outline-none px-2 focus:ring-0" value={segment} onChange={(e) => setSegment(e.target.value)}>
                        <option value="All">All Segments</option>
                        <option value="Mass">Retail</option>
                        <option value="VIP">Private Wealth</option>
                        <option value="Priority">Priority</option>
                    </select>
                    <button onClick={() => { setSearch(''); setSegment('All'); setStatus('All'); }} className="fb-btn-primary py-1.5 px-4 text-xs">
                        Refesh
                    </button>
                </div>
            </div>

            <div className="flex-1 fb-card overflow-auto relative">
                <table className="fb-table whitespace-nowrap">
                    <thead>
                        <tr>
                            <th className="fb-th w-10">#</th>
                            <th className="fb-th">GUID</th>
                            <th className="fb-th">Segment</th>
                            <th className="fb-th">Type</th>
                            <th className="fb-th">Tone</th>
                            <th className="fb-th">Priority</th>
                            <th className="fb-th">Lang</th>
                            <th className="fb-th">Office</th>
                            <th className="fb-th text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="9" className="text-center py-12 text-text-muted text-sm">Loading tickets...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="9" className="text-center py-12 text-text-muted text-sm">No tickets found.</td></tr>
                        ) : (
                            filtered.map((t, idx) => (
                                <tr key={t.customer_guid} className="fb-tr group" onClick={() => setSelectedTicketId(t.customer_guid)}>
                                    <td className="fb-td text-text-muted">{idx + 1}</td>
                                    <td className="fb-td font-medium text-text-primary group-hover:text-brand-green transition-colors" title={t.customer_guid}>{t.customer_guid?.substring(0, 8) || 'N/A'}</td>
                                    <td className="fb-td">
                                        <span className={`badge ${t.segment === 'VIP' ? 'bg-accent-gold/10 text-accent-gold border-accent-gold/20' : t.segment === 'Priority' ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/20' : 'bg-bg-tertiary text-text-secondary border-border'}`}>{t.segment || '-'}</span>
                                    </td>
                                    <td className="fb-td text-text-secondary text-sm">{t.request_type || '-'}</td>
                                    <td className="fb-td">
                                        {t.tone ? (
                                            <span className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${t.tone === 'Позитивный' ? 'bg-brand-green' : t.tone === 'Негативный' ? 'bg-accent-red' : 'bg-text-muted'}`}></span>
                                                <span className={`text-sm ${t.tone === 'Позитивный' ? 'text-brand-green' : t.tone === 'Негативный' ? 'text-accent-red' : 'text-text-muted'}`}>{t.tone}</span>
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="fb-td">
                                        {t.priority_score ? (
                                            <div className="flex items-center gap-2.5">
                                                <span className="font-semibold w-5 text-text-primary text-sm">{t.priority_score}</span>
                                                <div className="w-16 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${getPriorityColor(t.priority_score)}`} style={{ width: `${t.priority_score * 10}%` }}></div>
                                                </div>
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="fb-td text-text-secondary text-sm">{t.language ? <span className="flex items-center gap-2">{LANG_FLAGS[t.language] || ''} {t.language}</span> : '-'}</td>
                                    <td className="fb-td text-text-secondary text-sm">{t.assigned_office || '-'}</td>
                                    <td className="fb-td text-center">
                                        <span className={`px-2.5 py-1 text-xs font-semibold capitalize tracking-wide rounded-md border ${STATUS_COLORS[t.processing_status] || ''}`}>
                                            {t.processing_status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Drawer */}
            {selectedTicketId && (
                <TicketDetail ticketId={selectedTicketId} onClose={() => setSelectedTicketId(null)} />
            )}
        </div>
    );
}
