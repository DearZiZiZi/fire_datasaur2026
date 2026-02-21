import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import Managers from './pages/Managers';
import Analytics from './pages/Analytics';
import Assistant from './pages/Assistant';
import Synthetic from './pages/Synthetic';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="managers" element={<Managers />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="assistant" element={<Assistant />} />
          <Route path="synthetic" element={<Synthetic />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
