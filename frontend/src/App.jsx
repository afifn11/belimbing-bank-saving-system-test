import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';
import Sidebar from './components/common/Sidebar';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import DepositoTypes from './pages/DepositoTypes';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <div className="layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/"                element={<Dashboard />} />
            <Route path="/customers"       element={<Customers />} />
            <Route path="/deposito-types"  element={<DepositoTypes />} />
            <Route path="/accounts"        element={<Accounts />} />
            <Route path="/transactions"    element={<Transactions />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
