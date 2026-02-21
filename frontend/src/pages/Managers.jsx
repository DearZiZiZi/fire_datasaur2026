import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Building2, Search, Star, ArrowRightLeft, Users, TrendingUp } from 'lucide-react';

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

            // Enrich simulated data for the terminal aesthetic
            const enriched = res.data.map((m, idx) => {
                const load = m.requests_in_progress;
                // Generate a consistent pseudo-random CSAT based on load/name length to simulate real data
                const csatBase = 90 + (m.full_name.length % 10);
                const csat = Math.max(70, Math.min(100, csatBase - (load * 0.5))).toFixed(1);

                // Simulate Mass vs VIP ticket distribution based on load
                const vipLoad = Math.floor(load * 0.3);
                const massLoad = load - vipLoad;

                // Determine Availability Status
                let status = 'Available';
                let statusColor = 'bg-emerald-500';
                if (load >= 8) {
                    status = 'At Capacity';
                    statusColor = 'bg-amber-500';
                } else if (load > 12) {
                    status = 'Away';
                    statusColor = 'bg-red-500';
                }

                return {
                    ...m,
                    csat,
                    vipLoad,
                    massLoad,
                    totalTarget: 15,
                    status,
                    statusColor
                };
            });

            setManagers(enriched);
            setFiltered(enriched);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
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

    // Kpi Calculations
    const totalCapacity = managers.reduce((acc, m) => acc + (m.totalTarget - m.requests_in_progress), 0);
    const overloadedCount = managers.filter(m => m.requests_in_progress >= 8).length;

    // Skill coverage: just counting how many managers have 'VIP' skill (or similar)
    const vipManagersCount = managers.filter(m => {
        const skillsString = (typeof m.skills === 'string') ? m.skills : (m.skills?.join(',') || '');
        return skillsString.toLowerCase().includes('vip');
    }).length;


    return (
        <div className="flex flex-col h-full font-mono bg-zinc-950 text-zinc-300 p-6 overflow-hidden">

            {/* "Terminal" Header Section */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Users size={24} className="text-zinc-400" />
                        CAPACITY_MANAGEMENT //
                    </h1>
                    <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">Global Workforce Terminal</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-zinc-900 px-3 py-1.5 border border-zinc-800">
                        <select
                            className="bg-transparent border-none text-xs text-zinc-300 cursor-pointer focus:outline-none focus:ring-0 [&>option]:bg-zinc-900"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                        >
                            <option value="Load ASC">SORT: LOAD [ASC]</option>
                            <option value="Load DESC">SORT: LOAD [DESC]</option>
                            <option value="Name">SORT: NAME [A-Z]</option>
                        </select>
                        <div className="h-4 w-px bg-zinc-700 mx-1"></div>
                        <select
                            className="bg-transparent border-none text-xs text-zinc-300 cursor-pointer focus:outline-none focus:ring-0 [&>option]:bg-zinc-900"
                            value={officeFilter}
                            onChange={(e) => setOfficeFilter(e.target.value)}
                        >
                            <option value="All">OFFICE: ALL</option>
                            {uniqueOffices.map(o => <option key={o} value={o}>{o.toUpperCase()}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-zinc-900 border border-zinc-800 p-4 relative overflow-hidden">
                    <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Total Managers</div>
                    <div className="text-3xl font-light text-white">{managers.length} <span className="text-sm text-zinc-500 font-medium">Staff</span></div>
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-zinc-500"><Users size={48} /></div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-4 relative overflow-hidden">
                    <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Total Capacity</div>
                    <div className="text-3xl font-light text-white">{Math.max(0, totalCapacity)} <span className="text-sm text-zinc-500 font-medium">Slots</span></div>
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500"><TrendingUp size={48} /></div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-4 relative overflow-hidden">
                    <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Overload Risk</div>
                    <div className="text-3xl font-light text-white">{overloadedCount} <span className="text-sm text-zinc-500 font-medium">/ {managers.length} Staff</span></div>
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-500"><Users size={48} /></div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-4 relative overflow-hidden">
                    <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">VIP Skill Coverage</div>
                    <div className="text-3xl font-light text-white">{vipManagersCount} <span className="text-sm text-zinc-500 font-medium">Active</span></div>
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-blue-500"><Star size={48} /></div>
                </div>
            </div>

            {/* Data Sheet Table */}
            <div className="flex-1 overflow-auto custom-scrollbar border border-zinc-800 bg-zinc-900">
                {loading ? (
                    <div className="text-zinc-500 font-medium py-12 text-center text-sm animate-pulse uppercase tracking-widest">
                        Initializing Terminal...
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-zinc-950 border-b border-zinc-800 sticky top-0 z-10">
                            <tr>
                                <th className="p-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest w-64">Manager / Status</th>
                                <th className="p-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest w-40">Business Unit</th>
                                <th className="p-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Competencies</th>
                                <th className="p-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest text-right w-24">CSAT</th>
                                <th className="p-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest text-right w-32">Active Load</th>
                                <th className="p-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest w-48 pl-6">Intensity Heatmap</th>
                                <th className="p-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-widest text-center w-32">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {filtered.map(m => {
                                return (
                                    <tr key={m.full_name} className="transition-all duration-300 group hover:bg-zinc-800/50">
                                        <td className="p-3 align-middle border-r border-zinc-800/50">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${m.statusColor} shadow-[0_0_8px_currentColor] shrink-0`} title={m.status}></div>
                                                <div>
                                                    <div className="font-bold text-sm text-white truncate max-w-[180px]" title={m.full_name}>{m.full_name}</div>
                                                    <div className="text-[9px] uppercase tracking-wider font-semibold text-zinc-500 mt-0.5">{m.status}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3 align-middle border-r border-zinc-800/50">
                                            <div className="flex items-center gap-2 text-zinc-400 text-xs">
                                                <Building2 size={12} />
                                                <span className="truncate max-w-[120px]">{m.business_unit || 'GENERAL'}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 align-middle border-r border-zinc-800/50">
                                            <div className="flex flex-wrap gap-1.5">
                                                {m.skills && m.skills.length > 0 ? (
                                                    (typeof m.skills === 'string' ? m.skills.split(',') : m.skills).map((s, idx) => {
                                                        const skill = s.trim().toUpperCase();
                                                        let badgeColor = 'bg-zinc-800 text-zinc-300 border-zinc-700';
                                                        if (skill === 'VIP') badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                                                        if (skill === 'ENG') badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
                                                        if (skill === 'KZ') badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';

                                                        return (
                                                            <span key={idx} className={`px-1.5 py-0.5 border text-[9px] font-bold tracking-wider ${badgeColor}`}>
                                                                {skill}
                                                            </span>
                                                        );
                                                    })
                                                ) : (
                                                    <span className="text-zinc-600 text-[10px] italic">UNSPECIFIED</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 align-middle text-right border-r border-zinc-800/50">
                                            <div className={`text-sm font-semibold ${m.csat >= 90 ? 'text-emerald-400' : m.csat >= 80 ? 'text-amber-400' : 'text-red-400'}`}>
                                                {m.csat}%
                                            </div>
                                        </td>
                                        <td className="p-3 align-middle text-right border-r border-zinc-800/50">
                                            <span className="font-bold text-sm text-white">
                                                {m.requests_in_progress} <span className="text-[10px] text-zinc-500 font-normal">/ {m.totalTarget}</span>
                                            </span>
                                        </td>
                                        <td className="p-3 pl-6 align-middle border-r border-zinc-800/50">
                                            <div className="flex flex-col gap-1 w-full max-w-[160px]">
                                                <div className="h-1.5 w-full bg-zinc-800 flex overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 transition-all duration-1000"
                                                        style={{ width: `${(m.massLoad / m.totalTarget) * 100}%` }}
                                                        title={`Mass: ${m.massLoad}`}
                                                    ></div>
                                                    <div
                                                        className="h-full bg-amber-500 transition-all duration-1000"
                                                        style={{ width: `${(m.vipLoad / m.totalTarget) * 100}%` }}
                                                        title={`VIP: ${m.vipLoad}`}
                                                    ></div>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-[8px] text-blue-500 font-bold uppercase">Mass ({m.massLoad})</span>
                                                    <span className="text-[8px] text-amber-500 font-bold uppercase">VIP ({m.vipLoad})</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3 align-middle">
                                            <div className="flex items-center justify-center gap-3">
                                                <button
                                                    onClick={() => window.location.href = `/tickets?manager=${m.full_name}`}
                                                    className="px-2 py-1 text-[9px] font-semibold text-zinc-400 hover:text-white border border-transparent hover:border-zinc-700 rounded transition-colors uppercase tracking-widest"
                                                    title="View Portfolio"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    className="p-1.5 text-zinc-500 hover:text-emerald-400 transition-colors cursor-grab active:cursor-grabbing hover:bg-zinc-800 rounded"
                                                    title="Drag to reassign load"
                                                >
                                                    <ArrowRightLeft size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #3f3f46;
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #52525b;
                }
            `}} />
        </div>
    );
}
