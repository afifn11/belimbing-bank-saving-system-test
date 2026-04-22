import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';
import ConfirmDelete from '../components/common/ConfirmDelete';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../api';
import { formatDate } from '../utils/format';

const EMPTY = { name: '' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null); // null | 'create' | 'edit' | 'delete'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

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
      closeModal();
      load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteCustomer(selected.id);
      toast.success('Customer deleted!');
      closeModal();
      load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>Customers</h1>
          <p>Manage bank customers</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add Customer
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="empty-state"><Loader size={28} className="spin" /></div>
          ) : customers.length === 0 ? (
            <div className="empty-state"><p>No customers yet. Create one to get started.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Name</th><th>Accounts</th><th>Joined</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id}>
                      <td className="text-gray text-sm">{c.id}</td>
                      <td className="fw-600">{c.name}</td>
                      <td>
                        <span className="badge badge-navy">{c.accounts?.length || 0} account(s)</span>
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {(modal === 'create' || modal === 'edit') && (
        <Modal
          title={modal === 'create' ? 'Add Customer' : 'Edit Customer'}
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
            <label>Full Name</label>
            <input
              type="text"
              className={errors.name ? 'input-error' : ''}
              value={form.name}
              onChange={e => setForm({ name: e.target.value })}
              placeholder="e.g. Budi Santoso"
            />
            {errors.name && <div className="error-msg">{errors.name}</div>}
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {modal === 'delete' && (
        <ConfirmDelete
          title={`Delete "${selected?.name}"?`}
          message="This action cannot be undone. Ensure the customer has no accounts before deleting."
          onConfirm={handleDelete}
          onClose={closeModal}
          loading={saving}
        />
      )}
    </div>
  );
}
