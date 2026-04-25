import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader, Eye, TrendingUp, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/common/Modal';
import ConfirmDelete from '../components/common/ConfirmDelete';
import { getAccounts, getCustomers, getDepositoTypes, createAccount, updateAccount, deleteAccount } from '../api';
import { formatRupiah, formatDate } from '../utils/format';

const EMPTY = { packet: '', customer_id: '', deposito_type_id: '', balance: '' };

const tierBadge = (name = '') => {
  const n   = name.toLowerCase();
  const lbl = name.replace(/deposito /i, '').toUpperCase();
  if (n.includes('gold'))   return { bg: '#FDF6E7', color: '#A07828', label: lbl };
  if (n.includes('silver')) return { bg: '#F0F4F8', color: '#4A6580', label: lbl };
  if (n.includes('bronze')) return { bg: '#F5F0E8', color: '#7A6040', label: lbl };
  return { bg: '#F3F4F6', color: '#4B5563', label: lbl };
};

const initials = (name = '') =>
  name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

const avatarColor = (name = '') => {
  const colors = ['#0B1F3A', '#2E9E6B', '#A07828', '#4A6580', '#7A6040'];
  let i = 0;
  for (const c of name) i = (i + c.charCodeAt(0)) % colors.length;
  return colors[i];
};

export default function Accounts() {
  const navigate = useNavigate();
  const [accounts, setAccounts]       = useState([]);
  const [customers, setCustomers]     = useState([]);
  const [depTypes, setDepTypes]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [modal, setModal]             = useState(null);
  const [selected, setSelected]       = useState(null);
  const [form, setForm]               = useState(EMPTY);
  const [errors, setErrors]           = useState({});
  const [filterCustomer, setFilterCustomer] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, c, d] = await Promise.all([getAccounts(), getCustomers(), getDepositoTypes()]);
      setAccounts(a.data.data || []);
      setCustomers(c.data.data || []);
      setDepTypes(d.data.data || []);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY); setErrors({}); setModal('create'); };
  const openEdit   = (a) => {
    setSelected(a);
    setForm({ packet: a.packet, customer_id: a.customer_id, deposito_type_id: a.deposito_type_id, balance: a.balance });
    setErrors({}); setModal('edit');
  };
  const openDelete = (a) => { setSelected(a); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const validate = () => {
    const e = {};
    if (!form.packet.trim()) e.packet = 'Packet name is required';
    if (!form.customer_id) e.customer_id = 'Customer is required';
    if (!form.deposito_type_id) e.deposito_type_id = 'Deposito type is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        packet: form.packet,
        customer_id: parseInt(form.customer_id),
        deposito_type_id: parseInt(form.deposito_type_id),
        balance: parseFloat(form.balance) || 0,
      };
      if (modal === 'create') {
        await createAccount(payload);
        toast.success('Account created!');
      } else {
        await updateAccount(selected.id, { packet: form.packet, customer_id: payload.customer_id, deposito_type_id: payload.deposito_type_id });
        toast.success('Account updated!');
      }
      closeModal(); load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteAccount(selected.id);
      toast.success('Account deleted!');
      closeModal(); load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const filtered = filterCustomer
    ? accounts.filter(a => String(a.customer_id) === filterCustomer)
    : accounts;

  const totalManaged = filtered.reduce((s, a) => s + parseFloat(a.balance || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="page-header flex-between">
        <div>
          <p className="text-sm text-gray" style={{ marginBottom: 4 }}>Management / Accounts</p>
          <h1>Manage Customer Accounts</h1>
        </div>
        <button className="btn btn-gold" onClick={openCreate}>
          <Plus size={15} /> Add Account
        </button>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label className="text-sm text-gray" style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>CUSTOMER FILTER</label>
            <select
              value={filterCustomer}
              onChange={e => setFilterCustomer(e.target.value)}
              style={{
                border: '1px solid var(--border)', borderRadius: 8, padding: '6px 32px 6px 12px',
                fontSize: '0.875rem', background: 'var(--white)', color: 'var(--navy)',
                fontWeight: 500, cursor: 'pointer', minWidth: 160,
              }}
            >
              <option value="">All Customers</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="empty-state"><Loader size={28} className="spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><p>No accounts found.</p></div>
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: 24 }}>ID</th>
                      <th>PACKET NAME</th>
                      <th>CUSTOMER</th>
                      <th>DEPOSITO TYPE</th>
                      <th>BALANCE</th>
                      <th>CREATED AT</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(a => {
                      const badge  = tierBadge(a.deposito_type?.name || '');
                      const name   = a.customer?.name || '';
                      const color  = avatarColor(name);
                      // no fake code
                      return (
                        <tr key={a.id}>
                          <td style={{ paddingLeft: 24 }}>
                            <span className="text-gray fw-600">#{a.id}</span>
                          </td>
                          <td>
                            <div className="fw-600" style={{ color: 'var(--navy)' }}>{a.packet}</div>
                            <div className="text-sm text-gray">ID-{String(a.id).padStart(4, '0')}</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{
                                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                                background: color, color: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.03em',
                              }}>
                                {initials(name)}
                              </div>
                              <span className="text-sm fw-600">{name || '—'}</span>
                            </div>
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                              fontSize: '0.70rem', fontWeight: 700, letterSpacing: '0.05em',
                              background: badge.bg, color: badge.color,
                            }}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="fw-600" style={{ color: 'var(--navy)' }}>
                            {formatRupiah(a.balance)}
                          </td>
                          <td className="text-sm text-gray">{formatDate(a.created_at)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn-icon" title="View Transactions"
                                onClick={() => navigate(`/transactions?accountId=${a.id}`)}>
                                <Eye size={14} />
                              </button>
                              <button className="btn-icon" title="Edit" onClick={() => openEdit(a)}>
                                <Pencil size={14} />
                              </button>
                              <button className="btn-icon danger" title="Delete" onClick={() => openDelete(a)}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Row count */}
              <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--gray)' }}>
                Showing {filtered.length} of {accounts.length} active accounts
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 8 }}>
        {/* Portfolio Health */}
        <div className="card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: '#FDF6E7', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TrendingUp size={18} color="var(--gold)" />
            </div>
            <div style={{ flex: 1 }}>
              <div className="fw-600" style={{ marginBottom: 4 }}>Portfolio Health</div>
              <div className="text-sm text-gray" style={{ marginBottom: 10 }}>
                Distribution of managed accounts across all deposito tiers.
              </div>
              <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '72%', background: 'var(--gold)', borderRadius: 99 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Total Managed */}
        <div className="card" style={{ background: 'var(--navy)' }}>
          <div className="card-body">
            <div className="text-sm" style={{ color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em', marginBottom: 8 }}>
              TOTAL MANAGED
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--gold)', fontWeight: 700, marginBottom: 4 }}>
              {formatRupiah(totalManaged)}
            </div>
            <div className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              ACTIVE DEPOSITS
            </div>
          </div>
        </div>

        {/* Need Assistance */}
        <div className="card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <HelpCircle size={18} color="var(--gray)" />
            </div>
            <div>
              <div className="fw-600" style={{ marginBottom: 4 }}>Need Assistance?</div>
              <div className="text-sm text-gray" style={{ marginBottom: 12 }}>
                Contact your account manager for corporate deposits.
              </div>
              <button
                onClick={() => navigate('/transactions')}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.75rem', fontWeight: 600 }}
              >
                Go to Transactions
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {(modal === 'create' || modal === 'edit') && (
        <Modal
          title={modal === 'create' ? 'Add Account' : 'Edit Account'}
          onClose={closeModal}
          footer={
            <>
              <button className="btn btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving…' : modal === 'create' ? 'Create' : 'Update'}
              </button>
            </>
          }
        >
          <div className="form-group">
            <label>Packet Name</label>
            <input type="text" className={errors.packet ? 'input-error' : ''} value={form.packet}
              onChange={e => setForm(f => ({ ...f, packet: e.target.value }))} placeholder="e.g. Tabungan Reguler" />
            {errors.packet && <div className="error-msg">{errors.packet}</div>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Customer</label>
              <select className={errors.customer_id ? 'input-error' : ''} value={form.customer_id}
                onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}>
                <option value="">— Select Customer —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.customer_id && <div className="error-msg">{errors.customer_id}</div>}
            </div>
            <div className="form-group">
              <label>Deposito Type</label>
              <select className={errors.deposito_type_id ? 'input-error' : ''} value={form.deposito_type_id}
                onChange={e => setForm(f => ({ ...f, deposito_type_id: e.target.value }))}>
                <option value="">— Select Type —</option>
                {depTypes.map(d => <option key={d.id} value={d.id}>{d.name} ({d.yearly_return}%)</option>)}
              </select>
              {errors.deposito_type_id && <div className="error-msg">{errors.deposito_type_id}</div>}
            </div>
          </div>
          {modal === 'create' && (
            <div className="form-group">
              <label>Initial Balance (Rp)</label>
              <input type="number" min="0" value={form.balance}
                onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} placeholder="0" />
            </div>
          )}
        </Modal>
      )}

      {modal === 'delete' && (
        <ConfirmDelete
          title={`Delete account "${selected?.packet}"?`}
          message="All transaction history for this account will also be deleted."
          onConfirm={handleDelete} onClose={closeModal} loading={saving}
        />
      )}
    </div>
  );
}