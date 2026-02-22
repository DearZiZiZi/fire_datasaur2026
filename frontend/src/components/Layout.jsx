import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout() {
    return (
        <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col font-sans">
            <Header />
            <div className="flex flex-1 pt-[64px]">
                <Sidebar />
                <main className="flex-1 ml-[240px] p-8 h-[calc(100vh-64px)] overflow-y-auto bg-bg-primary">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
