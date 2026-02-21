import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Ticket, Users, BarChart3, Bot, FlaskConical, Settings } from 'lucide-react';

export default function Sidebar() {
    const links = [
        { to: '/', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/tickets', label: 'Tickets', icon: Ticket },
        { to: '/managers', label: 'Managers', icon: Users },
        { to: '/analytics', label: 'Analytics', icon: BarChart3 },
        { to: '/assistant', label: 'AI Assistant', icon: Bot },
        { to: '/synthetic', label: 'Synthetic Data', icon: FlaskConical },
    ];

    return (
        <aside className="w-[240px] fixed top-[56px] bottom-0 left-0 bg-bg-secondary border-r border-border flex flex-col py-6 z-40">
            <div className="px-6 text-[10px] font-bold text-text-muted mb-4 tracking-widest uppercase font-mono">Terminal Nav</div>

            <nav className="flex-1 flex flex-col gap-1 px-3">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 text-[11px] font-bold transition-all duration-200 uppercase tracking-tighter border-l-2 ${isActive
                                ? 'bg-accent-gold/5 text-accent-gold border-accent-gold'
                                : 'text-text-secondary border-transparent hover:bg-bg-primary hover:text-text-primary'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <link.icon size={16} className={isActive ? 'text-accent-gold' : ''} />
                                {link.label}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="mt-auto px-3">
                <div className="h-px bg-border my-4 mx-2"></div>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-[11px] font-bold text-text-secondary hover:bg-bg-primary hover:text-accent-gold transition-all uppercase tracking-widest">
                    <Settings size={16} />
                    Settings
                </button>
            </div>
        </aside>
    );
}
