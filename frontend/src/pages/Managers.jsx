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
        if (val < 3) return 'bg-brand-green';
        if (val < 6) return 'bg-accent-gold';
        if (val < 8) return 'bg-accent-orange';
        return 'bg-accent-red';
    };

    const renderStars = (rank) => {
        const r = rank || 1;
        return Array.from({ length: r }).map((_, i) => <Star key={i} size={14} fill="currentColor" />);
    };

    return (
        <div className="flex flex-col h-full font-sans">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-text-primary">Asset Managers</h1>
                <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg border border-border shadow-sm">
                    <select className="bg-transparent border-none text-sm font-medium text-text-secondary cursor-pointer focus:outline-none focus:ring-0" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                        <option value="Load ASC">Sort: Load (Low to High)</option>
                        <option value="Load DESC">Sort: Load (High to Low)</option>
                        <option value="Name">Sort: Name (A-Z)</option>
                    </select>
                    <div className="h-5 w-px bg-border mx-1"></div>
                    <select className="bg-transparent border-none text-sm font-medium text-text-secondary cursor-pointer focus:outline-none focus:ring-0" value={officeFilter} onChange={(e) => setOfficeFilter(e.target.value)}>
                        <option value="All">All Offices</option>
                        {uniqueOffices.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                {loading ? (
                    <div className="text-text-muted font-medium py-12 text-center text-sm animate-pulse">Loading Asset Managers...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6 pr-2">
                        {filtered.map(m => (
                            <div key={m.full_name} className="fb-card flex flex-col group transition-all hover:shadow-md">
                                <div className="p-5 border-b border-border bg-white rounded-t-xl">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg text-text-primary tracking-tight">{m.full_name}</h3>
                                        <span className="flex text-accent-gold" title={m.position}>{renderStars(m.position_rank)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-text-secondary text-sm font-medium">
                                        <Building2 size={16} className="text-brand-green" />
                                        {m.business_unit || 'General Asset Management'}
                                    </div>
                                </div>

                                <div className="p-5 flex flex-col gap-5 flex-1 bg-bg-primary rounded-b-xl border-t-0 p-b-0">
                                    <div>
                                        <div className="text-text-muted text-xs font-semibold uppercase mb-2 tracking-wider">Skills & Expertise</div>
                                        <div className="flex flex-wrap gap-2">
                                            {m.skills && m.skills.length > 0 ? (typeof m.skills === 'string' ? m.skills.split(',') : m.skills).map((s, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-white border border-border rounded-md text-text-primary text-xs font-medium shadow-sm">{s.trim()}</span>
                                            )) : <span className="text-text-muted text-sm italic">Generalist Focus</span>}
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4 relative bg-bg-primary">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-text-muted text-xs font-semibold uppercase tracking-wider">Active Portfolio Load</span>
                                            <span className="font-bold text-lg leading-none text-text-primary">{m.requests_in_progress} <span className="text-xs text-text-muted font-medium">Assets</span></span>
                                        </div>
                                        <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                                            <div className={`h-full ${getLoadColor(m.requests_in_progress)} transition-all duration-1000 rounded-full`} style={{ width: `${Math.min(m.requests_in_progress * 10, 100)}%` }}></div>
                                        </div>
                                    </div>
                                </div>

                                <button onClick={() => window.location.href = `/tickets?manager=${m.full_name}`} className="p-4 border-t border-border bg-white rounded-b-xl text-center text-sm font-semibold text-brand-green hover:text-brand-hover transition-colors">
                                    View Portfolio Performance
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
