import { NavLink } from 'react-router-dom';
import { Users, CreditCard, Layers, ArrowDownCircle, LayoutDashboard } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>Belimbing Bank</h2>
        <p>Saving System</p>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section-title">Menu</div>
        <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <LayoutDashboard size={17} /> Dashboard
        </NavLink>
        <NavLink to="/customers" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Users size={17} /> Customers
        </NavLink>
        <NavLink to="/deposito-types" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Layers size={17} /> Deposito Types
        </NavLink>
        <NavLink to="/accounts" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <CreditCard size={17} /> Accounts
        </NavLink>
        <NavLink to="/transactions" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <ArrowDownCircle size={17} /> Transactions
        </NavLink>
      </nav>
    </aside>
  );
}
