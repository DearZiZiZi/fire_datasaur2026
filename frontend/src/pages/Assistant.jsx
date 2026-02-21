import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#F97316', '#8B5CF6', '#EC4899'];

export default function Assistant() {
    const [messages, setMessages] = useState([
        { role: 'system', text: 'Financial Intelligence Core Online. Data synced with Neon DB. How may I assist with your asset analysis today?' }
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
            setMessages(prev => [...prev, { role: 'system', text: 'Connection to Freedom Intelligence Core interrupted.' }]);
        } finally {
            setLoading(false);
        }
    };

    const renderChart = (data) => {
        if (!data.data || data.data.length === 0) return null;

        if (data.chart_type === 'bar' || data.chart_type === 'horizontal_bar') {
            const isHoriz = data.chart_type === 'horizontal_bar';
            return (
                <div className="h-[280px] w-full mt-4 bg-bg-tertiary border border-border p-4 shadow-terminal">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.data} layout={isHoriz ? "vertical" : "horizontal"} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                            {isHoriz ? <XAxis type="number" stroke="#64748B" fontSize={9} fontStyle="monospace" /> : <XAxis dataKey="name" stroke="#64748B" angle={-45} textAnchor="end" fontSize={9} fontStyle="monospace" />}
                            {isHoriz ? <YAxis dataKey="name" type="category" stroke="#64748B" width={80} fontSize={9} fontStyle="monospace" /> : <YAxis stroke="#64748B" fontSize={9} fontStyle="monospace" />}
                            <Tooltip cursor={{ fill: '#151921' }} contentStyle={{ backgroundColor: '#0B0E14', border: '1px solid #1F2937', color: '#F59E0B', fontSize: '10px', fontStyle: 'monospace' }} />
                            <Bar dataKey="value" fill="#F59E0B" radius={[0, 0, 0, 0]} barSize={14} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            );
        }

        if (data.chart_type === 'pie' || data.chart_type === 'donut') {
            return (
                <div className="h-[280px] w-full mt-4 bg-bg-tertiary border border-border p-4 shadow-terminal">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={data.data} innerRadius={data.chart_type === 'donut' ? "60%" : 0} outerRadius="85%" dataKey="value" stroke="#0B0E14" strokeWidth={1}>
                                {data.data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#0B0E14', border: '1px solid #1F2937', color: '#E2E8F0', fontSize: '10px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            );
        }

        if (data.chart_type === 'line') {
            return (
                <div className="h-[280px] w-full mt-4 bg-bg-tertiary border border-border p-4 shadow-terminal">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.data} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                            <XAxis dataKey="name" stroke="#64748B" fontSize={10} fontStyle="monospace" />
                            <YAxis stroke="#64748B" fontSize={10} fontStyle="monospace" />
                            <Tooltip contentStyle={{ backgroundColor: '#0B0E14', border: '1px solid #1F2937', color: '#F59E0B', fontSize: '10px' }} />
                            <Line type="monotone" dataKey="value" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3, fill: '#F59E0B', strokeWidth: 1, stroke: '#0B0E14' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            );
        }

        // Default to table if unknown or 'table'
        return (
            <div className="mt-4 border border-border bg-bg-tertiary w-full overflow-hidden shadow-terminal font-mono">
                <table className="w-full text-left">
                    <thead className="bg-bg-secondary text-text-muted">
                        <tr>
                            <th className="p-3 border-b border-border text-[9px] font-bold uppercase tracking-widest">{data.x_axis_label || 'CATEGORY'}</th>
                            <th className="p-3 border-b border-border text-[9px] font-bold uppercase tracking-widest text-right">{data.y_axis_label || 'VALUE'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.data.map((row, i) => (
                            <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-bg-primary transition-colors">
                                <td className="p-3 truncate max-w-[240px] text-[10px] font-bold text-text-primary uppercase tracking-tight">{row.name}</td>
                                <td className="p-3 text-[10px] font-bold text-accent-gold text-right">{row.value}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-bg-primary overflow-hidden border border-border shadow-terminal">

            {/* Header */}
            <div className="p-4 border-b border-border bg-bg-secondary flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-accent-gold/10 text-accent-gold p-2 border border-accent-gold/20">
                        <Bot size={20} />
                    </div>
                    <div>
                        <h2 className="font-bold text-accent-gold text-lg tracking-tight font-mono uppercase">FIRE_INTEL_CORE</h2>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest font-mono">GEMINI_1.5_PRO // NEON_DB_ACTIVE</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-accent-gold animate-pulse"></div>
                    <span className="text-[10px] font-bold text-accent-gold uppercase tracking-widest font-mono">CONNECTION_SECURE</span>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-bg-primary scrollbar-terminal">

                {/* Sample queries */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-2">
                    {["Distribution of regional portfolios", "Analyze negative sentiment trends", "Manager load vs asset allocation"].map((q, i) => (
                        <button key={i} onClick={() => setInput(q)} className="terminal-card p-3 text-left text-[10px] font-bold text-text-secondary hover:border-accent-gold hover:text-accent-gold font-mono uppercase tracking-tight">
                            {'> ' + q}
                        </button>
                    ))}
                </div>

                {messages.map((m, i) => (
                    <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`shrink-0 w-8 h-8 flex items-center justify-center border ${m.role === 'user' ? 'bg-bg-tertiary border-border text-text-secondary' :
                            m.role === 'system' ? 'bg-accent-red/5 text-accent-red border-accent-red/20' :
                                'bg-bg-tertiary text-accent-gold border-accent-gold/30'}`}>
                            {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                        </div>

                        <div className={`max-w-[85%] font-mono ${m.role === 'user' ? 'bg-bg-tertiary border border-border text-text-primary p-3 text-[11px]' : 'terminal-card p-4'} ${m.role === 'system' ? 'text-text-muted font-bold uppercase tracking-widest text-[9px]' : ''}`}>
                            {m.text && <div className={m.role === 'ai' ? 'text-text-primary text-[12px] leading-relaxed' : ''}>{m.text}</div>}

                            {m.data && (
                                <div className="flex flex-col gap-3 w-full max-w-[700px]">
                                    {m.data.title && <h3 className="text-sm font-bold text-accent-gold tracking-tight mt-2 uppercase border-b border-border/50 pb-1">{m.data.title}</h3>}
                                    {m.data.insight && <p className="text-[11px] font-medium text-text-primary leading-relaxed bg-bg-tertiary p-3 border border-border">{m.data.insight}</p>}

                                    {m.data.error ? (
                                        <div className="text-accent-red text-[10px] font-bold border border-accent-red/20 bg-accent-red/5 p-3 uppercase tracking-wider">{m.data.error}</div>
                                    ) : (
                                        renderChart(m.data)
                                    )}

                                    <details className="mt-4 text-[9px] font-bold text-text-muted group">
                                        <summary className="cursor-pointer list-none flex items-center gap-2 hover:text-accent-gold transition-colors uppercase tracking-[0.2em]">
                                            <ChevronDown size={12} className="group-open:hidden" />
                                            <ChevronUp size={12} className="hidden group-open:block" />
                                            INSPECT_RAW_PROTOCOL
                                        </summary>
                                        <pre className="mt-2 p-3 bg-black border border-border overflow-x-auto text-[9px] text-accent-gold/70">
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
                        <div className="shrink-0 w-8 h-8 flex items-center justify-center bg-bg-tertiary border border-accent-gold/20 text-accent-gold">
                            <Bot size={14} className="animate-spin" />
                        </div>
                        <div className="flex flex-col gap-1 items-start justify-center text-accent-gold text-[9px] font-bold uppercase tracking-[0.3em] font-mono">
                            SYNTHESIZING_CORE_DATA...
                        </div>
                    </div>
                )}
                <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-bg-secondary shadow-terminal">
                <form onSubmit={handleSubmit} className="flex gap-4 items-center bg-bg-tertiary p-1 border border-border focus-within:border-accent-gold/50 transition-all">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="INPUT_QUERY_COMMAND..."
                        className="flex-1 bg-transparent border-none text-text-primary px-4 py-2 focus:outline-none font-mono text-[11px] placeholder:text-text-muted/30 uppercase"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="w-10 h-10 bg-accent-gold text-bg-primary hover:brightness-110 disabled:opacity-30 transition-all flex items-center justify-center shadow-terminal"
                    >
                        <Send size={16} />
                    </button>
                </form>
            </div>

        </div>
    );
}
