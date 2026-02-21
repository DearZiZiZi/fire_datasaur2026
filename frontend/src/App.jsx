import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import Managers from './pages/Managers';
import Assistant from './pages/Assistant';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="managers" element={<Managers />} />
          <Route path="assistant" element={<Assistant />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
