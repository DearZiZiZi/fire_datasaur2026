import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';
import api from '../utils/api';

const COLORS = {
    blue: '#3B82F6', gold: '#F59E0B', red: '#EF4444', green: '#10B981', orange: '#F97316',
};

export default function Analytics() {
    const [data, setData] = useState({
        types: [], tone: [], cities: [], priority: [], workload: []
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [types, tone, cities, priority, workload] = await Promise.all([
                    api.get('/api/analytics/by-type'),
                    api.get('/api/analytics/by-tone'),
                    api.get('/api/analytics/by-city'),
                    api.get('/api/analytics/priority'),
                    api.get('/api/analytics/workload')
                ]);
                setData({
                    types: types.data,
                    tone: tone.data,
                    cities: cities.data,
                    priority: priority.data,
                    workload: workload.data.slice(0, 15) // top 15 for chart sanity
                });
            } catch (e) { console.error(e); }
        };
        fetchData();
    }, []);

    const TONE_COLORS_MAP = {
        'Позитивный': COLORS.green,
        'Нейтральный': COLORS.gold,
        'Негативный': COLORS.red
    };

    const ChartWrapper = ({ title, children }) => (
        <div className="terminal-card p-4 flex flex-col h-[350px]">
            <div className="text-[10px] font-bold uppercase text-text-muted mb-4 tracking-widest border-b border-border pb-2 font-mono">{title}</div>
            <div className="flex-1 min-h-0 font-mono">
                {children}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full gap-6 overflow-y-auto pr-2 pb-6 scrollbar-terminal">
            <h1 className="text-xl font-bold tracking-tight text-accent-gold font-mono uppercase">DEEP_ANALYTICS_TERMINAL</h1>

            <div className="grid grid-cols-2 gap-6">

                {/* Request Types - Horizontal Bar */}
                <ChartWrapper title="REQUEST_TYPES_DISTRIBUTION">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.types} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" stroke="#64748B" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 9, fontStyle: 'monospace' }} />
                            <Tooltip cursor={{ fill: '#1C222D' }} contentStyle={{ backgroundColor: '#0B0E14', border: '1px solid #1F2937', color: '#F59E0B', fontSize: '10px' }} />
                            <Bar dataKey="value" fill={COLORS.gold} barSize={12} radius={[0, 0, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartWrapper>

                {/* Tone Distribution - Donut */}
                <ChartWrapper title="TONE_SENTIMENT_BREAKDOWN">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={data.tone} innerRadius="50%" outerRadius="80%" paddingAngle={2} dataKey="value" stroke="#0B0E14" strokeWidth={1} label={({ name, percent }) => `${name.toUpperCase()} ${(percent * 100).toFixed(0)}%`}>
                                {data.tone.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={TONE_COLORS_MAP[entry.name] || COLORS.blue} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#0B0E14', border: '1px solid #1F2937', color: '#E2E8F0', fontSize: '10px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartWrapper>

                {/* Tickets by City - Vertical Bar */}
                <ChartWrapper title="ORIGIN_CITY_DENSITY">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.cities} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
                            <XAxis dataKey="name" stroke="#64748B" interval={0} angle={-45} textAnchor="end" height={60} tick={{ fontSize: 9 }} />
                            <YAxis stroke="#64748B" tick={{ fontSize: 9 }} />
                            <Tooltip cursor={{ fill: '#1C222D' }} contentStyle={{ backgroundColor: '#0B0E14', border: '1px solid #1F2937', color: '#E2E8F0', fontSize: '10px' }} />
                            <Bar dataKey="value" fill={COLORS.gold} radius={[0, 0, 0, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartWrapper>

                {/* Priority Histogram */}
                <ChartWrapper title="PRIORITY_SCORE_DISTRIBUTION">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.priority} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                            <XAxis dataKey="name" stroke="#64748B" tick={{ fontSize: 9 }} />
                            <YAxis stroke="#64748B" tick={{ fontSize: 9 }} />
                            <Tooltip cursor={{ fill: '#1C222D' }} contentStyle={{ backgroundColor: '#0B0E14', border: '1px solid #1F2937', color: '#E2E8F0', fontSize: '10px' }} />
                            <Bar dataKey="value" fill={COLORS.red} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartWrapper>

                {/* Manager Workload - Horizontal Bar */}
                <div className="col-span-2">
                    <ChartWrapper title="MANAGER_WORKLOAD_DEEP_DIVE">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.workload} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
                                <XAxis dataKey="name" stroke="#64748B" angle={-45} textAnchor="end" height={80} interval={0} tick={{ fontSize: 9 }} />
                                <YAxis stroke="#64748B" tick={{ fontSize: 9 }} />
                                <Tooltip cursor={{ fill: '#1C222D' }} contentStyle={{ backgroundColor: '#0B0E14', border: '1px solid #1F2937', color: '#F59E0B', fontSize: '10px' }} />
                                <Bar dataKey="value" fill={COLORS.green} radius={[0, 0, 0, 0]} name="ASSET_COUNT" barSize={14} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartWrapper>
                </div>

            </div>
        </div>
    );
}
