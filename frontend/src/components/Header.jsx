import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

export default function Header() {
    const [timeStr, setTimeStr] = useState('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            // '14:23:07 | Sat 21 Feb' format as requested
            const timeFmt = now.toTimeString().split(' ')[0];
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const dayName = days[now.getDay()];
            const dayNum = now.getDate();
            const monthName = months[now.getMonth()];
            setTimeStr(`${timeFmt} | ${dayName} ${dayNum} ${monthName}`);
        };

        updateTime();
        const intv = setInterval(updateTime, 1000);
        return () => clearInterval(intv);
    }, []);

    return (
        <header className="h-[56px] bg-bg-secondary border-b border-border flex items-center justify-between px-8 fixed top-0 left-0 right-0 z-50">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 pr-6 border-r border-border h-8">
                    <img src="/logo.png" alt="FIRE Logo" className="h-5 w-auto object-contain filter brightness-0 invert opacity-80" />
                    <span className="font-bold text-accent-gold tracking-tighter text-lg font-mono">FIRE</span>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-accent-gold font-bold pr-6 border-r border-border h-8 overflow-hidden max-w-[220px]">
                    <Activity size={12} className="shrink-0" />
                    <span className="font-mono text-[10px] whitespace-nowrap">{timeStr}</span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-accent-gold text-bg-primary px-3 py-1 text-[10px] font-bold tracking-widest hover:brightness-110 transition-colors cursor-pointer group">
                        <div className="w-1.5 h-1.5 bg-bg-primary animate-pulse"></div>
                        SYSTEM_TERMINAL_ONLINE
                    </div>
                </div>
            </div>
        </header>
    );
}
