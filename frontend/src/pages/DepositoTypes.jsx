import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';
import ConfirmDelete from '../components/common/ConfirmDelete';
import { getDepositoTypes, createDepositoType, updateDepositoType, deleteDepositoType } from '../api';

const EMPTY = { name: '', yearly_return: '' };

export default function DepositoTypes() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDepositoTypes();
      setTypes(res.data.data || []);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setForm(EMPTY); setErrors({}); setModal('create'); };
  const openEdit   = (t) => { setSelected(t); setForm({ name: t.name, yearly_return: t.yearly_return }); setErrors({}); setModal('edit'); };
  const openDelete = (t) => { setSelected(t); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    const yr = parseFloat(form.yearly_return);
    if (isNaN(yr) || yr <= 0 || yr > 100) e.yearly_return = 'Yearly return must be between 0.01 and 100';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { name: form.name, yearly_return: parseFloat(form.yearly_return) };
      if (modal === 'create') {
        await createDepositoType(payload);
        toast.success('Deposito type created!');
      } else {
        await updateDepositoType(selected.id, payload);
        toast.success('Deposito type updated!');
      }
      closeModal(); load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteDepositoType(selected.id);
      toast.success('Deposito type deleted!');
      closeModal(); load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const tierColor = (rate) => {
    if (rate >= 7) return 'badge-gold';
    if (rate >= 5) return 'badge-green';
    return 'badge-navy';
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>Deposito Types</h1>
          <p>Manage interest rates and deposito packages</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add Type
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="empty-state"><Loader size={28} className="spin" /></div>
          ) : types.length === 0 ? (
            <div className="empty-state"><p>No deposito types yet.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Name</th><th>Yearly Return</th><th>Monthly Return</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {types.map(t => {
                    const monthly = (parseFloat(t.yearly_return) / 12).toFixed(4);
                    return (
                      <tr key={t.id}>
                        <td className="text-gray text-sm">{t.id}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <TrendingUp size={14} style={{ color: 'var(--gold)' }} />
                            <span className="fw-600">{t.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${tierColor(parseFloat(t.yearly_return))}`}>
                            {parseFloat(t.yearly_return).toFixed(2)}% / year
                          </span>
                        </td>
                        <td className="text-sm text-gray">{monthly}% / month</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn-icon" onClick={() => openEdit(t)}><Pencil size={14} /></button>
                            <button className="btn-icon danger" onClick={() => openDelete(t)}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <Modal
          title={modal === 'create' ? 'Add Deposito Type' : 'Edit Deposito Type'}
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
            <label>Type Name</label>
            <input type="text" className={errors.name ? 'input-error' : ''} value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Deposito Gold" />
            {errors.name && <div className="error-msg">{errors.name}</div>}
          </div>
          <div className="form-group">
            <label>Yearly Return (%)</label>
            <input type="number" step="0.01" min="0.01" max="100"
              className={errors.yearly_return ? 'input-error' : ''}
              value={form.yearly_return}
              onChange={e => setForm(f => ({ ...f, yearly_return: e.target.value }))}
              placeholder="e.g. 7.00" />
            {errors.yearly_return && <div className="error-msg">{errors.yearly_return}</div>}
            {form.yearly_return && !isNaN(parseFloat(form.yearly_return)) && (
              <div className="text-sm text-gray" style={{ marginTop: 4 }}>
                Monthly: {(parseFloat(form.yearly_return) / 12).toFixed(4)}%
              </div>
            )}
          </div>
        </Modal>
      )}

      {modal === 'delete' && (
        <ConfirmDelete
          title={`Delete "${selected?.name}"?`}
          message="Cannot delete if accounts are using this type."
          onConfirm={handleDelete} onClose={closeModal} loading={saving}
        />
      )}
    </div>
  );
}
