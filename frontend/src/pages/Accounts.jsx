import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader, ArrowDownCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/common/Modal';
import ConfirmDelete from '../components/common/ConfirmDelete';
import { getAccounts, getCustomers, getDepositoTypes, createAccount, updateAccount, deleteAccount } from '../api';
import { formatRupiah, formatDate } from '../utils/format';

const EMPTY = { packet: '', customer_id: '', deposito_type_id: '', balance: '' };

export default function Accounts() {
  const navigate = useNavigate();
  const [accounts, setAccounts]     = useState([]);
  const [customers, setCustomers]   = useState([]);
  const [depTypes, setDepTypes]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [modal, setModal]           = useState(null);
  const [selected, setSelected]     = useState(null);
  const [form, setForm]             = useState(EMPTY);
  const [errors, setErrors]         = useState({});

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

  return (
    <div>
      <div className="page-header flex-between">
        <div><h1>Accounts</h1><p>Manage savings accounts</p></div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Account</button>
      </div>

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="empty-state"><Loader size={28} className="spin" /></div>
          ) : accounts.length === 0 ? (
            <div className="empty-state"><p>No accounts yet.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Packet</th><th>Customer</th><th>Deposito Type</th><th>Balance</th><th>Created</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {accounts.map(a => (
                    <tr key={a.id}>
                      <td className="text-gray text-sm">{a.id}</td>
                      <td className="fw-600">{a.packet}</td>
                      <td>{a.customer?.name || '—'}</td>
                      <td><span className="badge badge-gold">{a.deposito_type?.name || '—'}</span></td>
                      <td className="fw-600 text-green">{formatRupiah(a.balance)}</td>
                      <td className="text-sm text-gray">{formatDate(a.created_at)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-icon" title="Transactions"
                            onClick={() => navigate(`/transactions?accountId=${a.id}`)}>
                            <ArrowDownCircle size={14} />
                          </button>
                          <button className="btn-icon" onClick={() => openEdit(a)}><Pencil size={14} /></button>
                          <button className="btn-icon danger" onClick={() => openDelete(a)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

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
