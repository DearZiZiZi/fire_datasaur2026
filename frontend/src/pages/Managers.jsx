import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Building2, Search, Star } from 'lucide-react';

export default function Managers() {
    const [managers, setManagers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [officeFilter, setOfficeFilter] = useState('All');
    const [sortOrder, setSortOrder] = useState('Load ASC');

    useEffect(() => {
        fetchManagers();
    }, []);

    const fetchManagers = async () => {
        try {
            const res = await api.get('/api/managers');
            setManagers(res.data);
            setFiltered(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        let f = [...managers];
        if (officeFilter !== 'All') {
            f = f.filter(m => m.business_unit === officeFilter);
        }

        f.sort((a, b) => {
            if (sortOrder === 'Load ASC') return a.requests_in_progress - b.requests_in_progress;
            if (sortOrder === 'Load DESC') return b.requests_in_progress - a.requests_in_progress;
            if (sortOrder === 'Name') return a.full_name.localeCompare(b.full_name);
            return 0;
        });

        setFiltered(f);
    }, [managers, officeFilter, sortOrder]);

    const uniqueOffices = [...new Set(managers.map(m => m.business_unit))].filter(Boolean);

    const getLoadColor = (val) => {
        // arbitrary scale: <3 green, <6 yellow, <8 orange, >8 red
        if (val < 3) return 'bg-accent-green';
        if (val < 6) return 'bg-accent-gold';
        if (val < 8) return 'bg-accent-orange';
        return 'bg-accent-red';
    };

    const renderStars = (rank) => {
        const r = rank || 1;
        return Array.from({ length: r }).map((_, i) => <Star key={i} size={14} fill="currentColor" />);
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold tracking-tight text-accent-gold font-mono uppercase">HUMAN_RESOURCE_INVENTORY</h1>
                <div className="flex items-center gap-3 bg-bg-tertiary p-1 border border-border shadow-terminal">
                    <select className="bg-transparent border-none text-[10px] font-bold text-text-secondary cursor-pointer focus:outline-none px-3 font-mono uppercase" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                        <option value="Load ASC">SORT: LOAD_LOW</option>
                        <option value="Load DESC">SORT: LOAD_HIGH</option>
                        <option value="Name">SORT: ALPHA_NAME</option>
                    </select>
                    <div className="h-4 w-px bg-border mx-1"></div>
                    <select className="bg-transparent border-none text-[10px] font-bold text-text-secondary cursor-pointer focus:outline-none px-3 font-mono uppercase" value={officeFilter} onChange={(e) => setOfficeFilter(e.target.value)}>
                        <option value="All">ALL_STATIONS</option>
                        {uniqueOffices.map(o => <option key={o} value={o}>{o.toUpperCase()}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                {loading ? (
                    <div className="text-text-muted font-medium py-12 text-center uppercase tracking-widest text-xs animate-pulse">Loading Asset Managers...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6 pr-2">
                        {filtered.map(m => (
                            <div key={m.full_name} className="terminal-card flex flex-col group transition-all">
                                <div className="p-4 border-b border-border bg-bg-secondary group-hover:bg-bg-tertiary transition-colors">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-sm text-text-primary tracking-tight font-mono uppercase">{m.full_name}</h3>
                                        <span className="flex text-accent-gold" title={m.position}>{renderStars(m.position_rank)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-text-muted text-[9px] font-bold uppercase tracking-widest font-mono">
                                        <Building2 size={10} className="text-accent-gold" />
                                        {m.business_unit || 'GENERAL_ASSET_MGT'}
                                    </div>
                                </div>

                                <div className="p-4 flex flex-col gap-4 flex-1 font-mono">
                                    <div>
                                        <div className="text-text-muted text-[9px] font-bold uppercase mb-2 tracking-widest">SKILLS_MATRIX</div>
                                        <div className="flex flex-wrap gap-1">
                                            {m.skills && m.skills.length > 0 ? (typeof m.skills === 'string' ? m.skills.split(',') : m.skills).map((s, idx) => (
                                                <span key={idx} className="px-1.5 py-0.5 border border-border text-text-secondary text-[9px] font-bold uppercase">{s.trim()}</span>
                                            )) : <span className="text-text-muted text-[9px] italic uppercase">GENERALIST</span>}
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-2 relative">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-text-muted text-[9px] font-bold uppercase tracking-widest">ACTIVE_LOAD_IND</span>
                                            <span className="font-bold text-xs leading-none text-text-primary">{m.requests_in_progress} <span className="text-[9px] text-text-muted uppercase">ASSETS</span></span>
                                        </div>
                                        <div className="h-1 w-full bg-border overflow-hidden">
                                            <div className={`h-full ${getLoadColor(m.requests_in_progress)} transition-all duration-1000`} style={{ width: `${Math.min(m.requests_in_progress * 10, 100)}%` }}></div>
                                        </div>
                                    </div>
                                </div>

                                <button onClick={() => window.location.href = `/tickets?manager=${m.full_name}`} className="p-3 border-t border-border bg-bg-secondary text-center text-[9px] font-bold text-text-secondary hover:text-accent-gold transition-all uppercase tracking-[0.2em] font-mono">
                                    OPEN_PORTFOLIO_ANALYSIS
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
