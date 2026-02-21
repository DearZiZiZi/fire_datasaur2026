import React, { useState } from 'react';
import api from '../utils/api';
import { FlaskConical, Play, CheckCircle2 } from 'lucide-react';

export default function Synthetic() {
    const [count, setCount] = useState(30);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleGenerate = async () => {
        setLoading(true);
        setResult(null);
        try {
            const res = await api.post('/api/synthetic/generate', { count });
            setResult(res.data.message);
        } catch (e) {
            setResult("Error generating data");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full items-center justify-center p-6 bg-bg-primary font-sans">
            <div className="fb-card w-full max-w-[600px] p-0 flex flex-col shadow-lg border-border">

                <div className="p-6 border-b border-border bg-white rounded-t-xl flex items-center gap-4">
                    <div className="text-brand-green bg-brand-green/10 p-3 rounded-xl border border-brand-green/20">
                        <FlaskConical size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-text-primary tracking-tight">Data Synthesis Engine</h2>
                        <p className="text-sm text-text-secondary mt-1">Generate Validation Stream for Pipeline</p>
                    </div>
                </div>

                <div className="p-6 space-y-6 bg-white rounded-b-xl">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-semibold text-text-primary w-28 shrink-0">
                            Unit Count
                        </label>
                        <input
                            type="number"
                            className="flex-1 fb-input py-2.5 shadow-sm"
                            value={count}
                            onChange={(e) => setCount(parseInt(e.target.value) || 0)}
                            min="1" max="1000"
                        />
                    </div>

                    <div className="text-sm text-text-secondary bg-bg-primary border border-border p-5 rounded-xl">
                        <p className="mb-2 text-text-primary font-semibold">Distribution Protocol:</p>
                        <ul className="space-y-1.5 mb-5 pl-1">
                            <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1.5 shrink-0"></span>Segments: Retail [60%] VIP [25%] Priority [15%]</li>
                            <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1.5 shrink-0"></span>Languages: RU [60%] KZ [25%] ENG [15%]</li>
                            <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-green mt-1.5 shrink-0"></span>Locales: KZ Cities + 5% Global Fallback</li>
                        </ul>

                        <p className="mb-2 text-text-primary font-semibold mt-4">Logic Validation:</p>
                        <ul className="space-y-1.5 pl-1 text-brand-green font-medium">
                            <li className="flex gap-2 items-center"><CheckCircle2 size={14} /> VIP + KZ Routing Rules</li>
                            <li className="flex gap-2 items-center"><CheckCircle2 size={14} /> Data Modification Restrictions</li>
                            <li className="flex gap-2 items-center"><CheckCircle2 size={14} /> Semantic Intelligence Fallback</li>
                        </ul>
                    </div>

                    {result && (
                        <div className="bg-brand-green/10 border border-brand-green/30 text-brand-green p-4 rounded-xl text-sm font-semibold flex items-center gap-3">
                            <CheckCircle2 size={18} className="shrink-0" />
                            System Ack: {result}
                        </div>
                    )}

                    <button
                        onClick={handleGenerate}
                        disabled={loading || count < 1}
                        className="fb-btn-primary w-full py-3.5 text-base flex justify-center items-center shadow-md"
                    >
                        {loading ? <span className="animate-spin w-5 h-5 border-2 border-white rounded-full border-t-transparent mr-2" /> : <Play size={18} fill="currentColor" className="mr-2" />}
                        {loading ? 'Synthesizing...' : 'Execute Data Genesis'}
                    </button>
                </div>

            </div>
        </div>
    );
}
