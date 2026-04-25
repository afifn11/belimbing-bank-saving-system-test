import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';
import ConfirmDelete from '../components/common/ConfirmDelete';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../api';
import { formatRupiah, formatDate } from '../utils/format';

const EMPTY = { name: '' };

const initials = (name = '') =>
  name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

const avatarColor = (name = '') => {
  const colors = ['#0B1F3A', '#2E9E6B', '#A07828', '#4A6580', '#7A6040'];
  let i = 0;
  for (const c of name) i = (i + c.charCodeAt(0)) % colors.length;
  return colors[i];
};

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [modal, setModal]         = useState(null);
  const [selected, setSelected]   = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [errors, setErrors]       = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCustomers();
      setCustomers(res.data.data || []);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY); setErrors({}); setModal('create'); };
  const openEdit   = (c) => { setSelected(c); setForm({ name: c.name }); setErrors({}); setModal('edit'); };
  const openDelete = (c) => { setSelected(c); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (modal === 'create') {
        await createCustomer(form);
        toast.success('Customer created!');
      } else {
        await updateCustomer(selected.id, form);
        toast.success('Customer updated!');
      }
      closeModal(); load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteCustomer(selected.id);
      toast.success('Customer deleted!');
      closeModal(); load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const totalBalance = (c) =>
    (c.accounts || []).reduce((s, a) => s + parseFloat(a.balance || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="page-header flex-between">
        <div>
          <p className="text-sm text-gray" style={{ marginBottom: 4 }}>Management / Customers</p>
          <h1>Customers</h1>
          <p>Manage your banking clientele and their associated financial profiles.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={15} /> Add Customer
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="empty-state"><Loader size={28} className="spin" /></div>
          ) : customers.length === 0 ? (
            <div className="empty-state"><p>No customers yet. Create one to get started.</p></div>
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: 24 }}>CUSTOMER ID</th>
                      <th>NAME</th>
                      <th>TOTAL ACCOUNTS</th>
                      <th>TOTAL BALANCE</th>
                      <th>CREATED AT</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map(c => {
                      const color = avatarColor(c.name);
                      const bal   = totalBalance(c);
                      return (
                        <tr key={c.id}>
                          <td style={{ paddingLeft: 24 }}>
                            <span className="text-gray fw-600">#CST-{String(c.id).padStart(4, '0')}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                background: color, color: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.72rem', fontWeight: 700,
                              }}>
                                {initials(c.name)}
                              </div>
                              <span className="fw-600">{c.name}</span>
                            </div>
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                              fontSize: '0.75rem', fontWeight: 600,
                              background: 'var(--cream)', color: 'var(--navy)',
                              border: '1px solid var(--border)',
                            }}>
                              {c.accounts?.length || 0} account{(c.accounts?.length || 0) !== 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="fw-600" style={{ color: 'var(--navy)' }}>
                            {bal > 0 ? formatRupiah(bal) : <span className="text-gray">—</span>}
                          </td>
                          <td className="text-sm text-gray">{formatDate(c.created_at)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn-icon" onClick={() => openEdit(c)} title="Edit">
                                <Pencil size={14} />
                              </button>
                              <button className="btn-icon danger" onClick={() => openDelete(c)} title="Delete">
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
              <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--gray)' }}>
                Showing {customers.length} customer{customers.length !== 1 ? 's' : ''}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {(modal === 'create' || modal === 'edit') && (
        <Modal
          title={modal === 'create' ? 'Add New Customer' : 'Edit Customer'}
          subtitle={modal === 'create' ? 'Initialize a new customer profile.' : `Editing: ${selected?.name}`}
          onClose={closeModal}
          footer={
            <>
              <button className="btn btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving…' : modal === 'create' ? 'Add Customer' : 'Update'}
              </button>
            </>
          }
        >
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              className={errors.name ? 'input-error' : ''}
              value={form.name}
              onChange={e => setForm({ name: e.target.value })}
              placeholder="e.g. Budi Santoso"
              autoFocus
            />
            {errors.name && <div className="error-msg">{errors.name}</div>}
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {modal === 'delete' && (
        <ConfirmDelete
          title={`Delete "${selected?.name}"?`}
          message="This action cannot be undone. Make sure the customer has no active accounts before deleting."
          onConfirm={handleDelete}
          onClose={closeModal}
          loading={saving}
        />
      )}
    </div>
  );
}