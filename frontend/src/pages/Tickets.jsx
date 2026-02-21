import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Eye, Search, Filter } from 'lucide-react';
import TicketDetail from '../components/TicketDetail';

const TONE_COLORS = {
    'Позитивный': 'text-accent-green',
    'Нейтральный': 'text-accent-gold',
    'Негативный': 'text-accent-red'
};

const STATUS_COLORS = {
    'pending': 'border-text-muted text-text-secondary',
    'processing': 'border-accent-gold text-accent-gold',
    'done': 'border-accent-green text-accent-green',
    'error': 'border-accent-red text-accent-red'
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
        if (p <= 3) return 'bg-accent-green';
        if (p <= 6) return 'bg-accent-gold';
        if (p <= 8) return 'bg-accent-orange';
        return 'bg-accent-red';
    };

    return (
        <div className="flex flex-col h-full relative">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold tracking-tight text-accent-gold font-mono uppercase">TRANSACTION_QUERY_TERMINAL</h1>

                {/* Filters Bar */}
                <div className="flex items-center gap-4 bg-bg-tertiary p-1 border border-border shadow-terminal">
                    <div className="relative">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            type="text"
                            placeholder="FIND_ASSET_BY_GUID..."
                            className="bg-transparent border-none pl-10 pr-4 py-1.5 w-[280px] text-[10px] font-bold text-text-primary focus:outline-none placeholder:text-text-muted/30 font-mono uppercase"
                            value={search} onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="h-4 w-px bg-border mx-1"></div>
                    <select className="bg-transparent border-none text-[10px] font-bold text-text-secondary cursor-pointer focus:outline-none px-2 font-mono uppercase" value={segment} onChange={(e) => setSegment(e.target.value)}>
                        <option value="All">ALL_SEGMENTS</option>
                        <option value="Mass">RETAIL_BANKING</option>
                        <option value="VIP">PRIVATE_WEALTH</option>
                        <option value="Priority">PRIORITY_BANKING</option>
                    </select>
                    <button onClick={() => { setSearch(''); setSegment('All'); setStatus('All'); }} className="terminal-btn-primary py-1.5 px-3 text-[9px]">
                        REFRESH_STREAM
                    </button>
                </div>
            </div>

            <div className="flex-1 terminal-card overflow-auto relative">
                <table className="terminal-table whitespace-nowrap">
                    <thead>
                        <tr>
                            <th className="terminal-th w-10">#</th>
                            <th className="terminal-th">ASSET_GUID</th>
                            <th className="terminal-th">SEGMENT</th>
                            <th className="terminal-th">TYPE</th>
                            <th className="terminal-th">TONE</th>
                            <th className="terminal-th">PRIORITY</th>
                            <th className="terminal-th">LANG</th>
                            <th className="terminal-th">OFFICE</th>
                            <th className="terminal-th text-center">STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="9" className="text-center py-12 text-text-muted font-mono uppercase text-[10px]">SYNCHRONIZING_TRANSACTIONS...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan="9" className="text-center py-12 text-text-muted font-mono uppercase text-[10px]">NO_DATA_MATCH_FILTER_SET</td></tr>
                        ) : (
                            filtered.map((t, idx) => (
                                <tr key={t.customer_guid} className="terminal-tr group transition-all" onClick={() => setSelectedTicketId(t.customer_guid)}>
                                    <td className="terminal-td text-text-muted font-mono">{idx + 1}</td>
                                    <td className="terminal-td font-mono font-bold text-accent-gold group-hover:underline" title={t.customer_guid}>{t.customer_guid?.substring(0, 8) || 'N/A'}</td>
                                    <td className="terminal-td">
                                        <span className={`badge ${t.segment === 'VIP' ? 'bg-accent-gold text-bg-primary border-none shadow-terminal-focus' : t.segment === 'Priority' ? 'badge-priority' : 'badge-mass'}`}>{t.segment || '-'}</span>
                                    </td>
                                    <td className="terminal-td text-text-secondary font-bold font-mono text-[9px] uppercase">{t.request_type || '-'}</td>
                                    <td className="terminal-td">
                                        {t.tone ? (
                                            <span className="flex items-center gap-2">
                                                <span className={`w-1 h-1 ${t.tone === 'Позитивный' ? 'bg-accent-green' : t.tone === 'Негативный' ? 'bg-accent-red' : 'bg-accent-gold'}`}></span>
                                                <span className={`font-bold font-mono text-[9px] uppercase ${t.tone === 'Позитивный' ? 'text-accent-green' : t.tone === 'Негативный' ? 'text-accent-red' : 'text-accent-gold'}`}>{t.tone}</span>
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="terminal-td">
                                        {t.priority_score ? (
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold w-4 text-text-primary text-[10px] font-mono">{t.priority_score}</span>
                                                <div className="w-12 h-1 bg-bg-tertiary overflow-hidden">
                                                    <div className={`h-full ${getPriorityColor(t.priority_score)}`} style={{ width: `${t.priority_score * 10}%` }}></div>
                                                </div>
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="terminal-td flex items-center gap-1.5 text-text-secondary font-bold font-mono text-[10px] uppercase">{t.language ? <>{t.language}</> : '-'}</td>
                                    <td className="terminal-td text-text-secondary font-bold font-mono text-[10px] uppercase">{t.assigned_office || '-'}</td>
                                    <td className="terminal-td text-center">
                                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${STATUS_COLORS[t.processing_status] || ''}`}>
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
