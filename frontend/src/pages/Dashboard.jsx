import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../utils/api';
import { Play, TrendingUp, AlertTriangle, CheckCircle2, Map, ShieldCheck, Activity } from 'lucide-react';
import DistributionMap from '../components/DistributionMap';

const COLORS = {
    green: '#22C55E',
    gold: '#E5A00D',
    red: '#EF4444',
    blue: '#3B82F6',
    gray: '#737373',
};

const CHART_TOOLTIP = {
    cursor: { fill: '#252525' },
    contentStyle: { backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', color: '#E5E5E5', borderRadius: '8px', boxShadow: 'none' },
};
const CHART_AXIS_STROKE = '#737373';

const TONE_COLORS = {
    'Позитивный': COLORS.green,
    'Нейтральный': COLORS.gray,
    'Негативный': COLORS.red
};

export default function Dashboard() {
    const [kpi, setKpi] = useState({ total: 0, processed: 0, pending: 0, avg_priority: 0 });
    const [typesData, setTypesData] = useState([]);
    const [toneData, setToneData] = useState([]);
    const [priorityData, setPriorityData] = useState([]);
    const [workloadData, setWorkloadData] = useState([]);
    const [cityData, setCityData] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [logs, setLogs] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [managerFilter, setManagerFilter] = useState('All');

    // Animated counter state
    const [displayKpi, setDisplayKpi] = useState({ total: 0, processed: 0, pending: 0, avg_priority: 0 });

    useEffect(() => {
        const duration = 1000;
        const start = performance.now();
        const startKpi = { ...displayKpi };

        const animate = (time) => {
            const progress = Math.min((time - start) / duration, 1);
            setDisplayKpi({
                total: Math.floor(startKpi.total + progress * (kpi.total - startKpi.total)),
                processed: Math.floor(startKpi.processed + progress * (kpi.processed - startKpi.processed)),
                pending: Math.floor(startKpi.pending + progress * (kpi.pending - startKpi.pending)),
                avg_priority: parseFloat((startKpi.avg_priority + progress * (kpi.avg_priority - startKpi.avg_priority)).toFixed(1))
            });
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [kpi]);

    const fetchDashboardData = async () => {
        try {
            const [overview, types, tones, priority, ticketsRes, workload, cities] = await Promise.all([
                api.get('/api/analytics/overview'),
                api.get('/api/analytics/by-type'),
                api.get('/api/analytics/by-tone'),
                api.get('/api/analytics/priority'),
                api.get('/api/tickets?limit=100'),
                api.get('/api/analytics/workload'),
                api.get('/api/analytics/by-city')
            ]);
            setKpi(overview.data);
            setTypesData(types.data);
            setToneData(tones.data);
            setPriorityData(priority.data);
            setTickets(ticketsRes.data);
            setWorkloadData(workload.data.slice(0, 15));
            setCityData(cities.data);
        } catch (e) {
            console.error(e);
        }
    };
    useEffect(() => {
        fetchDashboardData();
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        const sse = new window.EventSource(`${backendUrl}/api/tickets/stream-status`);

        sse.onmessage = (e) => {
            try {
                const msg = JSON.parse(e.data);
                setLogs(prev => [msg, ...prev].slice(0, 20));
                fetchDashboardData();
            } catch (err) {
                console.error(err);
            }
        };

        return () => sse.close();
    }, []);

    const handleProcessAll = async () => {
        setProcessing(true);
        try {
            await api.post('/api/tickets/process-all');
        } catch (e) {
            console.error(e);
            setProcessing(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 bg-bg-primary">
            {/* Top KPI Bar */}
            <div className="grid grid-cols-5 gap-6">
                <div className="fb-card p-5 flex flex-col gap-2">
                    <span className="text-text-muted text-sm font-semibold uppercase tracking-wider">Total Tickets</span>
                    <span className="text-4xl font-bold text-text-primary">{displayKpi.total}</span>
                </div>
                <div className="fb-card p-5 flex flex-col gap-2 relative overflow-hidden">
                    <span className="text-text-muted text-sm font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 size={16} className="text-brand-green" /> Processed
                    </span>
                    <span className="text-4xl font-bold text-brand-green">{displayKpi.processed}</span>
                    <div className="absolute right-4 bottom-4 text-xs font-bold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full">
                        {kpi.total > 0 ? Math.round((kpi.processed / kpi.total) * 100) : 0}%
                    </div>
                </div>
                <div className="fb-card p-5 flex flex-col gap-2">
                    <span className="text-text-muted text-sm font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingUp size={16} className="text-accent-blue" /> Avg Priority
                    </span>
                    <span className="text-4xl font-bold text-text-primary">
                        {displayKpi.avg_priority.toFixed(1)}
                        <span className="text-base font-normal text-text-muted ml-1">/10.0</span>
                    </span>
                </div>
                <div className="fb-card p-5 flex flex-col gap-2 relative overflow-hidden">
                    <span className="text-text-muted text-sm font-semibold uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck size={16} className="text-brand-green" /> SLA Compliance
                    </span>
                    <span className="text-4xl font-bold text-brand-green">94.2%</span>
                    <div className="absolute right-4 bottom-4 text-xs font-bold text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-full">
                        Target: &gt;90%
                    </div>
                </div>
                <div className="fb-card p-5 flex flex-col gap-2 border-brand-green/20">
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-brand-green text-sm font-semibold uppercase tracking-wider">Pending Queue</span>
                        <button
                            onClick={handleProcessAll}
                            disabled={kpi.pending === 0 || processing}
                            className="bg-brand-green hover:bg-brand-hover text-white disabled:opacity-50 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
                        >
                            {processing ? <span className="animate-spin w-4 h-4 border-2 border-white/30 rounded-full border-t-white" /> : <Play size={14} fill="currentColor" />}
                            Execute AI
                        </button>
                    </div>
                    <span className="text-4xl font-bold text-text-primary flex items-center gap-3">
                        {displayKpi.pending}
                        {displayKpi.pending > 0 && <span className="animate-pulse text-brand-green text-xl mx-2">●</span>}
                    </span>
                </div>
            </div>

            {/* Middle Row */}
            <div className="grid grid-cols-3 gap-6 h-[340px]">
                {/* Left: Request Types Bar */}
                <div className="fb-card p-5 flex flex-col">
                    <span className="text-sm font-semibold text-text-primary mb-4 border-b border-border pb-3">Request Types Distribution</span>
                    <div className="flex-1 min-h-0 text-xs">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={typesData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: CHART_AXIS_STROKE, fontSize: 11 }} width={90} />
                                <Tooltip cursor={CHART_TOOLTIP.cursor} contentStyle={CHART_TOOLTIP.contentStyle} />
                                <Bar dataKey="value" fill={COLORS.green} radius={[0, 4, 4, 0]} barSize={16} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Center: Geographic Distribution */}
                <div className="fb-card p-0 flex flex-col overflow-hidden relative">
                    <div className="absolute top-4 left-4 z-10 bg-bg-secondary/95 backdrop-blur border border-border px-3 py-1.5 rounded-lg text-sm font-semibold text-text-primary flex items-center gap-2">
                        <Map size={16} className="text-brand-green" /> Regional Distribution MAP
                    </div>
                    <DistributionMap />
                </div>

                {/* Right: Priority Distribution */}
                <div className="fb-card p-5 flex flex-col">
                    <span className="text-sm font-semibold text-text-primary mb-4 border-b border-border pb-3">Priority Score Distribution</span>
                    <div className="flex-1 min-h-0 text-xs">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                                <XAxis dataKey="name" stroke={CHART_AXIS_STROKE} tick={{ fontSize: 11 }} />
                                <YAxis stroke={CHART_AXIS_STROKE} tick={{ fontSize: 11 }} />
                                <Tooltip cursor={CHART_TOOLTIP.cursor} contentStyle={CHART_TOOLTIP.contentStyle} />
                                <Bar dataKey="value" fill={COLORS.gold} barSize={24} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Additional Analytics Charts Row */}
            <div className="grid grid-cols-3 gap-6 h-[340px]">
                {/* Manager Workload Deep Dive */}
                <div className="col-span-2 fb-card p-5 flex flex-col">
                    <span className="text-sm font-semibold text-text-primary mb-4 border-b border-border pb-3">Manager Workload Deep Dive</span>
                    <div className="flex-1 min-h-0 text-xs">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={workloadData} margin={{ top: 10, right: 10, left: -20, bottom: 50 }}>
                                <XAxis dataKey="name" stroke={CHART_AXIS_STROKE} angle={-45} textAnchor="end" height={70} interval={0} tick={{ fontSize: 11 }} />
                                <YAxis stroke={CHART_AXIS_STROKE} tick={{ fontSize: 11 }} />
                                <Tooltip cursor={CHART_TOOLTIP.cursor} contentStyle={CHART_TOOLTIP.contentStyle} />
                                <Bar dataKey="value" fill={COLORS.green} radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Tickets by City */}
                <div className="fb-card p-5 flex flex-col">
                    <span className="text-sm font-semibold text-text-primary mb-4 border-b border-border pb-3">Origin City Density</span>
                    <div className="flex-1 min-h-0 text-xs">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={cityData} margin={{ top: 10, right: 10, left: -20, bottom: 50 }}>
                                <XAxis dataKey="name" stroke={CHART_AXIS_STROKE} interval={0} angle={-45} textAnchor="end" height={70} tick={{ fontSize: 11 }} />
                                <YAxis stroke={CHART_AXIS_STROKE} tick={{ fontSize: 11 }} />
                                <Tooltip cursor={CHART_TOOLTIP.cursor} contentStyle={CHART_TOOLTIP.contentStyle} />
                                <Bar dataKey="value" fill={COLORS.green} radius={[4, 4, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Pipeline Board */}
            <div className="flex flex-col gap-4 fb-card p-5">
                <div className="flex justify-between items-center border-b border-border pb-3 mb-2">
                    <div className="flex items-center gap-2">
                        <Activity size={18} className="text-accent-blue" />
                        <span className="text-sm font-semibold text-text-primary">Ticket Pipeline (Kanban)</span>
                    </div>
                    {/* Manager Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-text-muted font-medium">Filter by Manager:</span>
                        <select
                            value={managerFilter}
                            onChange={(e) => setManagerFilter(e.target.value)}
                            className="bg-bg-secondary border border-border text-text-primary text-xs rounded-lg px-2 py-1 outline-none focus:border-brand-green/50 transition-colors"
                        >
                            <option value="All">All Managers</option>
                            {workloadData.map(m => (
                                <option key={m.name} value={m.name}>{m.name} ({m.value} tickets)</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 h-[400px] overflow-hidden">
                    {/* Pending Column */}
                    <div className="flex flex-col gap-3 bg-bg-secondary p-4 rounded-xl border border-border overflow-hidden">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-sm font-bold text-text-primary uppercase tracking-wider">Pending Processing</span>
                            <span className="bg-bg-tertiary text-text-muted text-xs font-bold px-2 py-0.5 rounded-full">
                                {tickets.filter(t => t.processing_status === 'pending' && (managerFilter === 'All' || t.assigned_manager_name === managerFilter)).length}
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                            {tickets.filter(t => t.processing_status === 'pending' && (managerFilter === 'All' || t.assigned_manager_name === managerFilter)).map((ticket) => (
                                <div key={ticket.customer_guid} className="bg-bg-primary p-3 rounded-lg border border-border shadow-sm flex flex-col gap-2 hover:border-brand-green/50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs font-medium text-text-primary truncate" title={ticket.customer_guid}>{ticket.customer_guid.split('-')[0]}...</span>
                                        <span className="text-[10px] font-semibold text-text-muted bg-bg-tertiary px-1.5 py-0.5 rounded uppercase">{ticket.segment}</span>
                                    </div>
                                    <p className="text-xs text-text-secondary line-clamp-2">{ticket.description}</p>
                                    <div className="text-[10px] text-text-muted mt-1">{ticket.city || 'Unknown City'}</div>
                                </div>
                            ))}
                            {tickets.filter(t => t.processing_status === 'pending').length === 0 && (
                                <div className="text-sm text-text-muted text-center py-8 italic">No pending tickets</div>
                            )}
                        </div>
                    </div>

                    {/* Processed Column */}
                    <div className="flex flex-col gap-3 bg-bg-secondary p-4 rounded-xl border border-border overflow-hidden">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-sm font-bold text-text-primary uppercase tracking-wider">Processed & Assigned</span>
                            <span className="bg-brand-green/20 text-brand-green text-xs font-bold px-2 py-0.5 rounded-full">
                                {tickets.filter(t => t.processing_status === 'done' && (managerFilter === 'All' || t.assigned_manager_name === managerFilter)).length}
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                            {tickets.filter(t => t.processing_status === 'done' && (managerFilter === 'All' || t.assigned_manager_name === managerFilter)).map((ticket) => (
                                <div key={ticket.customer_guid} className="bg-bg-primary p-3 rounded-lg border border-border shadow-sm flex flex-col gap-2 hover:border-brand-green/50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs font-medium text-text-primary truncate" title={ticket.customer_guid}>{ticket.customer_guid.split('-')[0]}...</span>
                                        <div className="flex items-center gap-1.5">
                                            {ticket.priority_score && (
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ticket.priority_score >= 8 ? 'bg-accent-red/20 text-accent-red' : 'bg-accent-gold/20 text-accent-gold'}`}>
                                                    P{ticket.priority_score}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-5 h-5 rounded-full bg-brand-green/20 flex items-center justify-center text-[9px] font-bold text-brand-green shrink-0">
                                            {ticket.assigned_manager_name ? ticket.assigned_manager_name.charAt(0) : '?'}
                                        </div>
                                        <span className="text-xs text-text-secondary truncate">{ticket.assigned_manager_name || 'Unassigned'}</span>
                                    </div>
                                    <div className="text-[10px] text-text-muted mt-1 flex justify-between">
                                        <span className="truncate">{ticket.request_type || 'Unknown Type'}</span>
                                    </div>
                                </div>
                            ))}
                            {tickets.filter(t => t.processing_status === 'done' && (managerFilter === 'All' || t.assigned_manager_name === managerFilter)).length === 0 && (
                                <div className="text-sm text-text-muted text-center py-8 italic">No processed tickets</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Tone Gauge & Live Log */}
            <div className="grid grid-cols-3 gap-6 h-[300px] mb-6">
                {/* Live Feed */}
                <div className="col-span-2 fb-card p-5 flex flex-col">
                    <span className="text-sm font-semibold text-text-primary mb-4 border-b border-border pb-3">Live Process Log</span>
                    <div className="flex-1 overflow-y-auto text-sm space-y-2 pr-2">
                        {logs.map((log, i) => (
                            <div key={i} className="flex gap-4 border-l-2 border-brand-green/30 pl-4 py-1.5 hover:bg-bg-tertiary rounded-r-lg transition-colors">
                                <span className="text-text-muted w-20 shrink-0 tabular-nums">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                                <span className="text-text-primary font-medium w-24 shrink-0 truncate">{log.ticket_guid}</span>
                                {log.status === 'done' ? (
                                    <span className="text-text-secondary">Assigned to <span className="font-semibold text-text-primary">{log.manager}</span> (<span className="text-text-muted">{log.office}</span>) &bull; Priority: <span className="font-bold text-text-primary">{log.priority}</span> {log.warning && <span className="text-accent-orange ml-2 bg-accent-orange/10 px-2 py-0.5 rounded-md text-xs">Warn: {log.warning}</span>}</span>
                                ) : (
                                    <span className="text-accent-red font-medium">Pipeline Error: {log.error}</span>
                                )}
                            </div>
                        ))}
                        {logs.length === 0 && <div className="text-text-muted italic flex items-center gap-2 h-full justify-center"><span className="w-2 h-2 rounded-full bg-text-muted animate-pulse"></span> Waiting for activity...</div>}
                    </div>
                </div>

                {/* Tone Gauge */}
                <div className="fb-card p-5 flex flex-col">
                    <span className="text-sm font-semibold text-text-primary mb-4 border-b border-border pb-3 text-center">Sentiment Metrics</span>
                    <div className="flex-1 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={toneData} innerRadius="65%" outerRadius="85%" paddingAngle={4} dataKey="value">
                                    {toneData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={TONE_COLORS[entry.name] || COLORS.gray} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip cursor={CHART_TOOLTIP.cursor} contentStyle={CHART_TOOLTIP.contentStyle} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-bold text-text-primary">{kpi.total}</span>
                            <span className="text-xs text-text-muted font-medium uppercase tracking-wider mt-1">Units</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
