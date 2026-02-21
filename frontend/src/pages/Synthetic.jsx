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
        <div className="flex flex-col h-full items-center justify-center">
            <div className="terminal-card w-full max-w-[600px] p-0 flex flex-col">

                <div className="p-4 border-b border-border bg-bg-secondary flex items-center gap-3">
                    <div className="text-accent-gold bg-accent-gold/10 p-2 border border-accent-gold/20 transition-colors">
                        <FlaskConical size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-accent-gold font-mono uppercase tracking-tighter">DATA_SYNTHESIS_ENGINE</h2>
                        <p className="text-[10px] text-text-muted font-mono uppercase tracking-widest">GENERATE_VALIDATION_STREAM_FOR_PIPELINE</p>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex border border-border">
                        <div className="bg-bg-tertiary px-4 py-2 text-text-muted font-mono text-[11px] border-r border-border flex items-center uppercase font-bold">
                            UNITS_COUNT:
                        </div>
                        <input
                            type="number"
                            className="flex-1 bg-transparent border-none text-text-primary px-4 py-2 font-mono text-[11px] focus:outline-none"
                            value={count}
                            onChange={(e) => setCount(parseInt(e.target.value) || 0)}
                            min="1" max="1000"
                        />
                    </div>

                    <div className="text-[10px] font-mono text-text-secondary bg-bg-tertiary border border-border p-4">
                        <p className="mb-2 text-accent-gold font-bold uppercase tracking-widest">Distribution Protocol:</p>
                        <ul className="space-y-1 mb-4">
                            <li>SEGMENTS: Mass [60%] VIP [25%] Priority [15%]</li>
                            <li>LANGUAGES: RU [60%] KZ [25%] ENG [15%]</li>
                            <li>LOCALES: KZ Cities + 5% Global Fallback</li>
                        </ul>

                        <p className="mb-2 text-accent-gold font-bold mt-4 uppercase tracking-widest">Logic Validation:</p>
                        <ul className="space-y-1 text-accent-green">
                            <li>[OK] VIP + KZ Routing Rules</li>
                            <li>[OK] Data Modification Restrictions</li>
                            <li>[OK] Semantic Intelligence Fallback</li>
                        </ul>
                    </div>

                    {result && (
                        <div className="bg-accent-green/10 border border-accent-green text-accent-green p-3 text-[10px] font-mono flex items-center gap-2 uppercase font-bold">
                            <CheckCircle2 size={14} />
                            SYSTEM_ACK: {result}
                        </div>
                    )}

                    <button
                        onClick={handleGenerate}
                        disabled={loading || count < 1}
                        className="w-full bg-accent-gold hover:brightness-110 disabled:opacity-30 text-bg-primary font-bold py-3 px-4 flex items-center justify-center gap-2 transition-all uppercase tracking-[0.2em] shadow-terminal"
                    >
                        {loading ? <span className="animate-spin w-4 h-4 border-2 border-bg-primary rounded-full border-t-transparent" /> : <Play size={16} fill="currentColor" />}
                        EXECUTE_GENESIS
                    </button>
                </div>

            </div>
        </div>
    );
}
