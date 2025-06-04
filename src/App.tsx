import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import 'antd/dist/reset.css';
import './index.css';
import Auth from './pages/AuthPage';
import Dashboard from './pages/DashboardPage';

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Navigate to='/auth' replace />} />
                <Route path='/auth' element={<Auth />} />
                <Route path='/dashboard' element={<Dashboard />} />
                <Route path='*' element={<Navigate to='/auth' replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;