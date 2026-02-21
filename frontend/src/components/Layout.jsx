import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function Layout() {
    return (
        <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col">
            <Header />
            <div className="flex flex-1 pt-[56px]">
                <Sidebar />
                <main className="flex-1 ml-[240px] p-8 h-[calc(100vh-56px)] overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
