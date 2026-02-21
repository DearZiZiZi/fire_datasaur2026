import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../utils/api';
import { Play, TrendingUp, AlertTriangle, CheckCircle2, Map } from 'lucide-react';
import DistributionMap from '../components/DistributionMap';

const COLORS = {
    blue: '#3B82F6',
    gold: '#F59E0B',
    red: '#EF4444',
    green: '#10B981',
    orange: '#F97316',
};

const TONE_COLORS = {
    'Позитивный': COLORS.green,
    'Нейтральный': COLORS.gold,
    'Негативный': COLORS.red
};

export default function Dashboard() {
    const [kpi, setKpi] = useState({ total: 0, processed: 0, pending: 0, avg_priority: 0 });
    const [typesData, setTypesData] = useState([]);
    const [toneData, setToneData] = useState([]);
    const [workloadData, setWorkloadData] = useState([]);
    const [topUrgent, setTopUrgent] = useState([]);
    const [logs, setLogs] = useState([]);
    const [processing, setProcessing] = useState(false);

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
    }, [kpi]);

    const fetchDashboardData = async () => {
        try {
            const [overview, types, tones, workloads, ticketsRes] = await Promise.all([
                api.get('/api/analytics/overview'),
                api.get('/api/analytics/by-type'),
                api.get('/api/analytics/by-tone'),
                api.get('/api/analytics/workload'),
                api.get('/api/tickets?limit=5')
            ]);
            setKpi(overview.data);
            setTypesData(types.data);
            setToneData(tones.data);
            setWorkloadData(workloads.data);

            const sorted = ticketsRes.data
                .filter(t => t.priority_score)
                .sort((a, b) => b.priority_score - a.priority_score)
                .slice(0, 5);
            setTopUrgent(sorted);
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
        <div className="flex flex-col gap-6">
            {/* Top KPI Bar */}
            <div className="grid grid-cols-4 gap-6">
                <div className="terminal-card p-4 flex flex-col gap-1">
                    <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest font-mono">TOTAL_TICKETS</span>
                    <span className="text-3xl font-bold text-text-primary tracking-tighter font-mono">{displayKpi.total}</span>
                </div>
                <div className="terminal-card p-4 flex flex-col gap-1 relative overflow-hidden">
                    <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 font-mono">
                        <CheckCircle2 size={12} className="text-accent-gold" /> PROCESSED
                    </span>
                    <span className="text-3xl font-bold text-accent-gold tracking-tighter font-mono">{displayKpi.processed}</span>
                    <div className="absolute right-4 bottom-4 text-[11px] font-bold text-accent-gold bg-accent-gold/10 px-1 border border-accent-gold/20 font-mono">
                        {kpi.total > 0 ? Math.round((kpi.processed / kpi.total) * 100) : 0}%
                    </div>
                </div>
                <div className="terminal-card p-4 flex flex-col gap-1">
                    <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 font-mono">
                        <TrendingUp size={12} className="text-accent-blue" /> AVG_PRIORITY
                    </span>
                    <span className="text-3xl font-bold text-text-primary tracking-tighter font-mono">
                        {displayKpi.avg_priority.toFixed(1)}
                        <span className="text-sm text-text-muted ml-1">/10.0</span>
                    </span>
                </div>
                <div className="terminal-card p-4 flex flex-col gap-1 border-accent-gold/50">
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-accent-gold text-[10px] font-bold uppercase tracking-widest font-mono">PENDING_QUEUE</span>
                        <button
                            onClick={handleProcessAll}
                            disabled={kpi.pending === 0 || processing}
                            className="bg-accent-gold hover:brightness-110 disabled:opacity-50 text-bg-primary px-2 py-1 text-[10px] font-bold flex items-center gap-1.5 transition-all active:scale-95 font-mono"
                        >
                            {processing ? <span className="animate-spin w-3 h-3 border-2 border-bg-primary rounded-full border-t-transparent" /> : <Play size={10} fill="currentColor" />}
                            EXEC_FIRE
                        </button>
                    </div>
                    <span className="text-3xl font-bold text-text-primary tracking-tighter flex items-center gap-2 font-mono">
                        {displayKpi.pending}
                        {displayKpi.pending > 0 && <span className="animate-pulse text-accent-gold text-xl mx-2">▶</span>}
                    </span>
                </div>
            </div>

            {/* Middle Row */}
            <div className="grid grid-cols-3 gap-6 h-[340px]">
                {/* Left: Request Types Bar */}
                <div className="terminal-card p-4 flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-text-muted mb-4 tracking-widest border-b border-border pb-2 font-mono">REQUEST_TYPES_DIST</span>
                    <div className="flex-1 min-h-0 text-[10px] font-mono">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={typesData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10 }} width={80} />
                                <Tooltip cursor={{ fill: '#1C222D' }} contentStyle={{ backgroundColor: '#151921', border: '1px solid #1F2937', color: '#E2E8F0', fontSize: '10px' }} />
                                <Bar dataKey="value" fill={COLORS.gold} radius={[0, 0, 0, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Center: Geographic Distribution */}
                <div className="col-span-2 terminal-card p-0 flex flex-col overflow-hidden relative">
                    <div className="absolute top-4 left-4 z-10 bg-bg-secondary/90 border border-border px-3 py-1 text-[10px] font-bold flex items-center gap-2 font-mono">
                        <Map size={12} className="text-accent-gold" /> REGIONAL_DISTRIBUTION_MAP
                    </div>
                    <DistributionMap />
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-3 gap-6 h-[300px]">
                {/* Live Feed */}
                <div className="col-span-2 terminal-card p-4 flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-text-muted mb-4 tracking-widest border-b border-border pb-2 font-mono">LIVE_PROCESS_PIPELINE</span>
                    <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1 pr-2 scrollbar-terminal">
                        {logs.map((log, i) => (
                            <div key={i} className="flex gap-4 border-l border-accent-gold/20 pl-3 py-0.5 hover:bg-bg-tertiary transition-colors">
                                <span className="text-text-muted w-16 shrink-0">[{new Date().toLocaleTimeString('en-US', { hour12: false })}]</span>
                                <span className="text-accent-blue font-bold w-24 shrink-0 truncate">{log.ticket_guid}</span>
                                {log.status === 'done' ? (
                                    <span className="text-text-primary">ASSIGNED_TO <span className="text-accent-gold">{log.manager}</span> (<span className="text-text-secondary">{log.office}</span>) PRI:<span className="text-accent-gold font-bold">{log.priority}</span> {log.warning && <span className="text-accent-orange ml-2 underline">WARN: {log.warning}</span>}</span>
                                ) : (
                                    <span className="text-accent-red font-bold">ERR_PIPELINE: {log.error}</span>
                                )}
                            </div>
                        ))}
                        {logs.length === 0 && <div className="text-text-muted italic flex items-center gap-2 font-mono"><span className="w-1 h-1 bg-text-muted animate-pulse"></span> WAITING_FOR_ACTIVITY...</div>}
                    </div>
                </div>

                {/* Tone Gauge */}
                <div className="terminal-card p-4 flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-text-muted mb-4 tracking-widest border-b border-border pb-2 text-center font-mono">SENTIMENT_METRICS</span>
                    <div className="flex-1 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={toneData} innerRadius="65%" outerRadius="85%" paddingAngle={2} dataKey="value">
                                    {toneData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={TONE_COLORS[entry.name] || COLORS.gold} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip cursor={{ fill: '#1C222D' }} contentStyle={{ backgroundColor: '#151921', border: '1px solid #1F2937', fontSize: '10px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none font-mono">
                            <span className="text-2xl font-bold tracking-tighter text-text-primary">{kpi.total}</span>
                            <span className="text-[10px] text-text-muted font-bold uppercase">UNITS</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
