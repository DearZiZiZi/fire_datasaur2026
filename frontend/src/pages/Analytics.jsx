import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../utils/api';

const COLORS = {
    green: '#00B25B', gold: '#F59E0B', red: '#EF4444', blue: '#3B82F6', gray: '#9CA3AF',
}; const ChartWrapper = ({ title, children }) => (
    <div className="fb-card p-5 flex flex-col h-[380px]">
        <div className="text-sm font-semibold text-text-primary mb-4 border-b border-border pb-3">{title}</div>
        <div className="flex-1 min-h-0 text-xs">
            {children}
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-border p-3 rounded-lg shadow-sm text-sm">
                <p className="font-semibold text-text-primary mb-1">{label || payload[0].name}</p>
                <p className="text-brand-green font-medium">Count: {payload[0].value}</p>
            </div>
        );
    }
    return null;
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
        'Нейтральный': COLORS.gray,
        'Негативный': COLORS.red
    };



    return (
        <div className="flex flex-col h-full gap-6 overflow-y-auto pr-2 pb-6 font-sans">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Analytics Overview</h1>

            <div className="grid grid-cols-2 gap-6">

                {/* Request Types - Horizontal Bar */}
                <ChartWrapper title="Request Types Distribution">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.types} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" stroke="#6B7280" width={110} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F3F4F6' }} />
                            <Bar dataKey="value" fill={COLORS.green} barSize={16} radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartWrapper>

                {/* Tone Distribution - Donut */}
                <ChartWrapper title="Sentiment Breakdown">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={data.tone} innerRadius="55%" outerRadius="85%" paddingAngle={3} dataKey="value" stroke="none" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {data.tone.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={TONE_COLORS_MAP[entry.name] || COLORS.blue} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartWrapper>

                {/* Tickets by City - Vertical Bar */}
                <ChartWrapper title="Origin City Density">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.cities} margin={{ top: 10, right: 30, left: 0, bottom: 50 }}>
                            <XAxis dataKey="name" stroke="#6B7280" interval={0} angle={-45} textAnchor="end" height={70} tick={{ fontSize: 11 }} />
                            <YAxis stroke="#6B7280" tick={{ fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F3F4F6' }} />
                            <Bar dataKey="value" fill={COLORS.green} radius={[4, 4, 0, 0]} barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartWrapper>

                {/* Priority Histogram */}
                <ChartWrapper title="Priority Score Distribution">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.priority} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                            <XAxis dataKey="name" stroke="#6B7280" tick={{ fontSize: 11 }} />
                            <YAxis stroke="#6B7280" tick={{ fontSize: 11 }} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F3F4F6' }} />
                            <Bar dataKey="value" fill={COLORS.gold} barSize={36} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartWrapper>

                {/* Manager Workload - Horizontal Bar */}
                <div className="col-span-2">
                    <ChartWrapper title="Manager Workload Deep Dive">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.workload} margin={{ top: 10, right: 30, left: 0, bottom: 70 }}>
                                <XAxis dataKey="name" stroke="#6B7280" angle={-45} textAnchor="end" height={90} interval={0} tick={{ fontSize: 11 }} />
                                <YAxis stroke="#6B7280" tick={{ fontSize: 11 }} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F3F4F6' }} />
                                <Bar dataKey="value" fill={COLORS.green} radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartWrapper>
                </div>

            </div>
        </div>
    );
}
