import React, { useState, useEffect } from 'react';
import { UserCircle } from 'lucide-react';

export default function Header() {
    const [timeStr, setTimeStr] = useState('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
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
        <header className="h-[64px] bg-bg-secondary border-b border-border flex items-center justify-between px-8 fixed top-0 left-0 right-0 z-50 shadow-sm">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 pr-6 border-r border-border h-8">
                    <img src="/logo.png" alt="FreedomBroker Logo" className="h-6 w-auto object-contain" />
                    <span className="font-bold text-text-primary text-xl">FreedomBroker</span>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-text-secondary pr-6 border-r border-border h-8">
                    <span className="text-sm">{timeStr}</span>
                </div>

                <div className="flex items-center gap-3 cursor-pointer group">
                    <UserCircle size={28} className="text-text-muted group-hover:text-brand-green transition-colors" />
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-text-primary">Zhasullan Z.</span>
                        <span className="text-xs text-brand-green font-medium">Online</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
