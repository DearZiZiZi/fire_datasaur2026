import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#00B25B', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#10B981', '#EC4899'];

export default function Assistant() {
    const [messages, setMessages] = useState([
        { role: 'system', text: 'FreedomBroker Intelligence Assistant is online. Connected to Neon DB. How may I assist with your asset analysis today?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const endRef = useRef(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        try {
            const res = await api.post('/api/assistant/query', { query: userMsg });
            setMessages(prev => [...prev, { role: 'ai', data: res.data }]);
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { role: 'system', text: 'Connection to Freedom Intelligence Core interrupted. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    const renderChart = (data) => {
        if (!data.data || data.data.length === 0) return null;

        if (data.chart_type === 'bar' || data.chart_type === 'horizontal_bar') {
            const isHoriz = data.chart_type === 'horizontal_bar';
            return (
                <div className="h-[300px] w-full mt-4 bg-[#1F2937] border border-gray-700 rounded-xl p-5 shadow-sm">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.data} layout={isHoriz ? "vertical" : "horizontal"} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                            {isHoriz ? <XAxis type="number" stroke="#6B7280" fontSize={11} /> : <XAxis dataKey="name" stroke="#6B7280" angle={-45} textAnchor="end" fontSize={11} />}
                            {isHoriz ? <YAxis dataKey="name" type="category" stroke="#6B7280" width={100} fontSize={11} /> : <YAxis stroke="#6B7280" fontSize={11} />}
                            <Tooltip cursor={{ fill: '#111827' }} contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', color: '#F3F4F6', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }} />
                            <Bar dataKey="value" fill="#00B25B" radius={[4, 4, 4, 4]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            );
        }

        if (data.chart_type === 'pie' || data.chart_type === 'donut') {
            return (
                <div className="h-[300px] w-full mt-4 bg-[#1F2937] border border-gray-700 rounded-xl p-5 shadow-sm">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={data.data} innerRadius={data.chart_type === 'donut' ? "60%" : 0} outerRadius="85%" dataKey="value" stroke="none" paddingAngle={2}>
                                {data.data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', color: '#F3F4F6', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            );
        }

        if (data.chart_type === 'line') {
            return (
                <div className="h-[300px] w-full mt-4 bg-[#1F2937] border border-gray-700 rounded-xl p-5 shadow-sm">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                            <XAxis dataKey="name" stroke="#6B7280" fontSize={11} />
                            <YAxis stroke="#6B7280" fontSize={11} />
                            <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', color: '#F3F4F6', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }} />
                            <Line type="monotone" dataKey="value" stroke="#00B25B" strokeWidth={3} dot={{ r: 4, fill: '#00B25B', strokeWidth: 2, stroke: '#ffffff' }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            );
        }

        // Default to table if unknown or 'table'
        return (
            <div className="mt-4 border border-gray-700 bg-[#1F2937] w-full rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-[#111827] text-text-muted">
                        <tr>
                            <th className="p-3 border-b border-gray-700 text-xs font-semibold uppercase tracking-wider">{data.x_axis_label || 'Category'}</th>
                            <th className="p-3 border-b border-gray-700 text-xs font-semibold uppercase tracking-wider text-right">{data.y_axis_label || 'Value'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.data.map((row, i) => (
                            <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-bg-tertiary transition-colors">
                                <td className="p-3 truncate max-w-[240px] text-sm font-medium text-text-primary capitalize">{row.name.toLowerCase()}</td>
                                <td className="p-3 text-sm font-semibold text-brand-green text-right">{row.value}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-bg-primary overflow-hidden border border-border rounded-xl shadow-sm font-sans mx-2 my-2">

            {/* Header */}
            <div className="p-4 border-b border-gray-700 bg-[#111827] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="bg-brand-green/10 text-brand-green p-2.5 rounded-lg">
                        <Bot size={22} />
                    </div>
                    <div>
                        <h2 className="font-bold text-text-primary text-lg tracking-tight">Intelligence Assistant</h2>
                        <p className="text-xs text-text-secondary font-medium mt-0.5">Powered by Gemini 1.5 Pro</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-green rounded-full animate-pulse shadow-[0_0_8px_rgba(0,178,91,0.6)]"></div>
                    <span className="text-xs font-semibold text-brand-green uppercase tracking-wider">System Online</span>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-bg-primary">

                {/* Sample queries */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    {["Distribution of regional portfolios", "Analyze negative sentiment trends", "Manager load vs asset allocation"].map((q, i) => (
                        <button key={i} onClick={() => setInput(q)} className="fb-card py-3 px-4 text-left text-sm font-medium text-text-secondary hover:border-brand-green hover:text-brand-green transition-all shadow-sm">
                            {q}
                        </button>
                    ))}
                </div>

                {messages.map((m, i) => (
                    <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-full border shadow-sm ${m.role === 'user' ? 'bg-[#1F2937] border-gray-700 text-gray-200' :
                            m.role === 'system' ? 'bg-accent-red/10 text-accent-red border-accent-red/20' :
                                'bg-brand-green/10 text-brand-green border-brand-green/20'}`}>
                            {m.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                        </div>

                        <div className={`max-w-[85%] ${m.role === 'user' ? 'bg-[#1F2937] border border-gray-700 text-gray-200 p-4 rounded-2xl rounded-tr-sm shadow-sm text-sm' : 'fb-card p-5 !rounded-tl-sm'} ${m.role === 'system' ? '!bg-bg-tertiary text-text-muted font-medium text-sm border border-border shadow-none' : ''}`}>
                            {m.text && <div className={m.role === 'ai' || m.role === 'user' ? 'text-gray-200 text-sm leading-relaxed whitespace-pre-line' : ''}>{m.text}</div>}

                            {m.data && (
                                <div className="flex flex-col gap-3 w-full max-w-[700px]">
                                    {m.data.title && <h3 className="text-lg font-bold text-gray-200 tracking-tight mt-1">{m.data.title}</h3>}
                                    {m.data.insight && <p className="text-sm text-gray-300 leading-relaxed bg-[#111827] p-4 rounded-xl border border-gray-700 shadow-sm">{m.data.insight}</p>}

                                    {m.data.error ? (
                                        <div className="text-accent-red border border-accent-red/20 bg-accent-red/5 p-4 rounded-xl text-sm font-medium">{m.data.error}</div>
                                    ) : (
                                        renderChart(m.data)
                                    )}

                                    <details className="mt-4 text-xs font-semibold text-text-muted group">
                                        <summary className="cursor-pointer list-none flex items-center gap-1.5 hover:text-brand-green transition-colors w-fit select-none">
                                            <ChevronDown size={14} className="group-open:hidden" />
                                            <ChevronUp size={14} className="hidden group-open:block" />
                                            View Raw Data
                                        </summary>
                                        <pre className="mt-3 p-4 bg-text-primary text-bg-primary rounded-xl overflow-x-auto text-[11px] font-mono shadow-inner">
                                            {JSON.stringify(m.data, null, 2)}
                                        </pre>
                                    </details>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-4">
                        <div className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-brand-green/10 border border-brand-green/20 text-brand-green shadow-sm">
                            <Bot size={18} className="animate-spin" />
                        </div>
                        <div className="flex flex-col gap-1 items-start justify-center text-text-muted text-sm font-medium italic">
                            Generating response...
                        </div>
                    </div>
                )}
                <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-700 bg-[#111827] shrink-0">
                <form onSubmit={handleSubmit} className="flex gap-3 items-center max-w-4xl mx-auto w-full relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask the intelligence assistant..."
                        className="flex-1 bg-bg-primary border border-border text-text-primary px-5 py-3.5 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all shadow-sm placeholder:text-text-muted text-sm"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand-green text-white rounded-full hover:bg-brand-hover disabled:opacity-50 disabled:hover:bg-brand-green transition-colors flex items-center justify-center shadow-md"
                    >
                        <Send size={16} className="-ml-0.5" />
                    </button>
                </form>
            </div>

        </div>
    );
}
