import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader, Shield, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';
import ConfirmDelete from '../components/common/ConfirmDelete';
import { getDepositoTypes, getAccounts, createDepositoType, updateDepositoType, deleteDepositoType } from '../api';

const EMPTY = { name: '', yearly_return: '' };

const tierStyle = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('gold'))   return { badge: 'GOLD TIER',   badgeBg: '#FDF6E7', badgeColor: '#A07828', rateColor: 'var(--gold)',  border: '#E8D5A0' };
  if (n.includes('silver')) return { badge: 'SILVER TIER', badgeBg: '#F0F4F8', badgeColor: '#4A6580', rateColor: '#4A6580',      border: '#B8CDD9' };
  if (n.includes('bronze')) return { badge: 'BRONZE TIER', badgeBg: '#F5F0E8', badgeColor: '#7A6040', rateColor: '#C4A87A',      border: '#D4B896' };
  return                           { badge: 'CUSTOM',      badgeBg: '#F3F4F6', badgeColor: '#4B5563', rateColor: 'var(--navy)',  border: '#D1D5DB' };
};

export default function DepositoTypes() {
  const [types, setTypes]       = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [modal, setModal]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [errors, setErrors]     = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, a] = await Promise.all([getDepositoTypes(), getAccounts()]);
      setTypes(t.data.data || []);
      setAccounts(a.data.data || []);
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
      const payload = { name: form.name.trim(), yearly_return: parseFloat(form.yearly_return) };
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

  const accountCount = (typeId) => accounts.filter(a => a.deposito_type_id === typeId).length;

  return (
    <div>
      {/* Header */}
      <div className="page-header flex-between">
        <div>
          <p className="text-sm text-gray" style={{ marginBottom: 4 }}>Management / Deposito Types</p>
          <h1>Deposito Types</h1>
          <p>Manage interest rates and deposito packages</p>
        </div>
        <button className="btn btn-gold" onClick={openCreate}>
          <Plus size={15} /> Add Deposito Type
        </button>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="empty-state card"><Loader size={28} className="spin" /></div>
      ) : types.length === 0 ? (
        <div className="empty-state card"><p>No deposito types yet.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
          {types.map(t => {
            const style  = tierStyle(t.name);
            const yr     = parseFloat(t.yearly_return);
            const mo     = (yr / 12).toFixed(2);
            const count  = accountCount(t.id);
            return (
              <div key={t.id} className="card" style={{ border: `1.5px solid ${style.border}`, position: 'relative', overflow: 'hidden' }}>
                {/* Top accent line */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: style.rateColor }} />

                <div className="card-body" style={{ paddingTop: 28 }}>
                  {/* Tier badge */}
                  <div style={{ marginBottom: 12 }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: 4,
                      fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em',
                      background: style.badgeBg, color: style.badgeColor,
                    }}>
                      {style.badge}
                    </span>
                  </div>

                  {/* Name */}
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--navy)', marginBottom: 4 }}>
                    {t.name}
                  </div>
                  <div className="text-sm text-gray" style={{ marginBottom: 20 }}>
                    {t.name.toLowerCase().includes('bronze') && 'Baseline fixed income plan'}
                    {t.name.toLowerCase().includes('silver') && 'Enhanced returns for loyal savers'}
                    {t.name.toLowerCase().includes('gold')   && 'Premium wealth management tier'}
                    {!['bronze','silver','gold'].some(x => t.name.toLowerCase().includes(x)) && 'Custom deposito plan'}
                  </div>

                  {/* Rate — large */}
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 700, color: style.rateColor, marginBottom: 16, lineHeight: 1 }}>
                    {yr.toFixed(2)}%
                    <span className="text-sm text-gray" style={{ fontFamily: 'var(--font-body)', fontWeight: 400, marginLeft: 4 }}>/yr</span>
                  </div>

                  {/* Monthly + Accounts */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                    <div style={{ background: 'var(--cream)', borderRadius: 8, padding: '10px 14px' }}>
                      <div className="text-sm text-gray" style={{ fontSize: '0.68rem', letterSpacing: '0.06em', marginBottom: 2 }}>MONTHLY</div>
                      <div className="fw-600" style={{ color: 'var(--navy)' }}>{mo}%</div>
                    </div>
                    <div style={{ background: 'var(--cream)', borderRadius: 8, padding: '10px 14px' }}>
                      <div className="text-sm text-gray" style={{ fontSize: '0.68rem', letterSpacing: '0.06em', marginBottom: 2 }}>ACCOUNTS</div>
                      <div className="fw-600" style={{ color: 'var(--navy)' }}>{count} account{count !== 1 ? 's' : ''}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ flex: 1, justifyContent: 'center' }}
                      onClick={() => openEdit(t)}
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ flex: 1, justifyContent: 'center', color: 'var(--red)', borderColor: 'var(--red)' }}
                      onClick={() => openDelete(t)}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: '#FDF6E7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} color="var(--gold)" />
            </div>
            <div>
              <div className="fw-600" style={{ marginBottom: 4 }}>Yield Projection</div>
              <div className="text-sm text-gray">
                Interest is calculated monthly based on the yearly return divided by 12, multiplied by the number of months the balance is held.
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={18} color="var(--gray)" />
            </div>
            <div>
              <div className="fw-600" style={{ marginBottom: 4 }}>Guaranteed Safety</div>
              <div className="text-sm text-gray">
                A deposito type cannot be deleted while it is actively used by existing accounts. Remove linked accounts first.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
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
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Deposito Gold" autoFocus />
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
              <div className="text-sm text-gray" style={{ marginTop: 6 }}>
                Monthly rate: <strong>{(parseFloat(form.yearly_return) / 12).toFixed(4)}%</strong>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {modal === 'delete' && (
        <ConfirmDelete
          title={`Delete "${selected?.name}"?`}
          message="Cannot delete if accounts are currently using this deposito type."
          onConfirm={handleDelete} onClose={closeModal} loading={saving}
        />
      )}
    </div>
  );
}