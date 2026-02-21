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
        <aside className="w-[240px] fixed top-[64px] bottom-0 left-0 bg-bg-secondary border-r border-border flex flex-col py-6 z-40">
            <div className="px-6 text-xs font-semibold text-text-muted mb-4 uppercase tracking-wider">Menu</div>

            <nav className="flex-1 flex flex-col gap-1 px-3">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg ${isActive
                                ? 'bg-brand-green/10 text-brand-green'
                                : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <link.icon size={18} className={isActive ? 'text-brand-green' : 'text-text-muted'} />
                                {link.label}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="mt-auto px-3">
                <div className="h-px bg-border my-4 mx-2"></div>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-text-secondary hover:bg-bg-tertiary hover:text-text-primary rounded-lg transition-all">
                    <Settings size={18} className="text-text-muted" />
                    Settings
                </button>
            </div>
        </aside>
    );
}
