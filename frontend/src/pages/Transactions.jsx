import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpCircle, ArrowDownCircle, Loader, Printer, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';
import { getAccounts, getTransactionHistory, deposit, withdraw } from '../api';
import { formatRupiah, formatDate, todayISO } from '../utils/format';

export default function Transactions() {
  const [searchParams] = useSearchParams();
  const [accounts, setAccounts]             = useState([]);
  const [selectedAccId, setSelectedAccId]   = useState(searchParams.get('accountId') || '');
  const [history, setHistory]               = useState([]);
  const [loadingAcc, setLoadingAcc]         = useState(true);
  const [loadingHist, setLoadingHist]       = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [modal, setModal]                   = useState(null);
  const [form, setForm]                     = useState({ amount: '', transaction_date: todayISO() });
  const [errors, setErrors]                 = useState({});
  const [withdrawResult, setWithdrawResult] = useState(null);

  const loadAccounts = useCallback(async () => {
    setLoadingAcc(true);
    try {
      const res = await getAccounts();
      setAccounts(res.data.data || []);
    } catch (e) { toast.error(e.message); }
    finally { setLoadingAcc(false); }
  }, []);

  const loadHistory = useCallback(async (id) => {
    if (!id) return;
    setLoadingHist(true);
    try {
      const res = await getTransactionHistory(id);
      setHistory(res.data.data || []);
    } catch (e) { toast.error(e.message); }
    finally { setLoadingHist(false); }
  }, []);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);
  useEffect(() => {
    if (selectedAccId) loadHistory(selectedAccId);
    else setHistory([]);
  }, [selectedAccId, loadHistory]);

  const selectedAccount = accounts.find(a => String(a.id) === String(selectedAccId));

  const openModal = (type) => {
    setForm({ amount: '', transaction_date: todayISO() });
    setErrors({}); setWithdrawResult(null); setModal(type);
  };
  const closeModal = () => { setModal(null); setWithdrawResult(null); };

  const validate = () => {
    const e = {};
    if (!form.amount || parseFloat(form.amount) <= 0) e.amount = 'Amount must be greater than 0';
    if (!form.transaction_date) e.transaction_date = 'Date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleDeposit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await deposit({ account_id: parseInt(selectedAccId), amount: parseFloat(form.amount), transaction_date: form.transaction_date });
      toast.success('Deposit successful!');
      closeModal(); loadHistory(selectedAccId); loadAccounts();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleWithdraw = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await withdraw({ account_id: parseInt(selectedAccId), amount: parseFloat(form.amount), transaction_date: form.transaction_date });
      setWithdrawResult(res.data.data);
      toast.success('Withdrawal successful!');
      loadHistory(selectedAccId); loadAccounts();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const tierColor = (name = '') => {
    const n = name.toLowerCase();
    if (n.includes('gold'))   return { bg: '#FDF6E7', color: '#A07828' };
    if (n.includes('silver')) return { bg: '#F0F4F8', color: '#4A6580' };
    if (n.includes('bronze')) return { bg: '#F5F0E8', color: '#7A6040' };
    return { bg: '#F3F4F6', color: '#4B5563' };
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header flex-between">
        <div>
          <h1>Transaction History</h1>
          <p>Review and manage financial movements within the Belimbing Bank system.</p>
        </div>

        {/* Active Account selector — top right */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div className="text-sm text-gray" style={{ fontWeight: 600, letterSpacing: '0.05em' }}>ACTIVE ACCOUNT</div>
          {loadingAcc ? (
            <div className="text-gray text-sm">Loading…</div>
          ) : (
            <div style={{ position: 'relative' }}>
              <select
                value={selectedAccId}
                onChange={e => setSelectedAccId(e.target.value)}
                style={{
                  appearance: 'none', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '10px 40px 10px 16px',
                  fontSize: '0.875rem', background: 'var(--white)', color: 'var(--navy)',
                  fontWeight: 600, cursor: 'pointer', minWidth: 240,
                  boxShadow: 'var(--shadow)',
                }}
              >
                <option value="">— Choose an account —</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.packet} — {a.customer?.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--gray)' }} />
            </div>
          )}
        </div>
      </div>

      {/* Account info bar + action buttons */}
      {selectedAccount && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          {/* Info bar */}
          <div className="card" style={{ flex: 1, margin: 0 }}>
            <div className="card-body" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <div className="text-sm text-gray" style={{ fontSize: '0.7rem', letterSpacing: '0.06em', marginBottom: 2 }}>PACKET NAME</div>
                <div className="fw-600" style={{ color: 'var(--navy)' }}>{selectedAccount.packet}</div>
              </div>
              <div>
                <div className="text-sm text-gray" style={{ fontSize: '0.7rem', letterSpacing: '0.06em', marginBottom: 2 }}>DEPOSITO TYPE</div>
                <span style={{
                  display: 'inline-block', padding: '2px 10px', borderRadius: 20,
                  fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em',
                  background: tierColor(selectedAccount.deposito_type?.name).bg,
                  color: tierColor(selectedAccount.deposito_type?.name).color,
                }}>
                  {selectedAccount.deposito_type?.name?.replace('Deposito ', '').toUpperCase() || '—'}
                  {selectedAccount.deposito_type?.yearly_return && ` · ${selectedAccount.deposito_type.yearly_return}%/yr`}
                </span>
              </div>
              <div>
                <div className="text-sm text-gray" style={{ fontSize: '0.7rem', letterSpacing: '0.06em', marginBottom: 2 }}>CURRENT BALANCE</div>
                <div className="fw-600" style={{ color: 'var(--green)', fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>
                  {formatRupiah(selectedAccount.balance)}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            <button
              className="btn btn-gold"
              style={{ padding: '12px 24px', fontSize: '0.9rem' }}
              onClick={() => openModal('deposit')}
            >
              <ArrowUpCircle size={17} /> Deposit
            </button>
            <button
              className="btn btn-primary"
              style={{ padding: '12px 24px', fontSize: '0.9rem' }}
              onClick={() => openModal('withdraw')}
            >
              <ArrowDownCircle size={17} /> Withdraw
            </button>
          </div>
        </div>
      )}

      {/* Transaction History Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Activity</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {!selectedAccId ? (
            <div className="empty-state" style={{ padding: '48px 24px' }}>
              <p className="text-gray">Select an account above to view transaction history.</p>
            </div>
          ) : loadingHist ? (
            <div className="empty-state"><Loader size={24} className="spin" /></div>
          ) : history.length === 0 ? (
            <div className="empty-state"><p>No transactions yet for this account.</p></div>
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: 24 }}>DATE</th>
                      <th>TYPE</th>
                      <th>AMOUNT</th>
                      <th>STARTING BALANCE</th>
                      <th>INTEREST EARNED</th>
                      <th>MONTHS</th>
                      <th>ENDING BALANCE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(tx => (
                      <tr key={tx.id}>
                        <td style={{ paddingLeft: 24 }}>
                          <div className="fw-600 text-sm">{formatDate(tx.transaction_date)}</div>
                        </td>
                        <td>
                          {tx.type === 'deposit'
                            ? <span className="badge badge-green">↑ Deposit</span>
                            : <span className="badge badge-red">↓ Withdraw</span>}
                        </td>
                        <td className={`fw-600 ${tx.type === 'deposit' ? 'text-green' : 'text-red'}`}>
                          {tx.type === 'deposit' ? '+' : '-'}{formatRupiah(tx.amount)}
                        </td>
                        <td>{formatRupiah(tx.starting_balance)}</td>
                        <td>
                          {tx.interest_earned != null
                            ? <span style={{ color: 'var(--gold)', fontWeight: 600 }}>+{formatRupiah(tx.interest_earned)}</span>
                            : <span className="text-gray">—</span>}
                        </td>
                        <td className="text-sm">
                          {tx.months_held != null ? `${tx.months_held}` : <span className="text-gray">—</span>}
                        </td>
                        <td className="fw-600">
                          {tx.ending_balance != null ? formatRupiah(tx.ending_balance) : <span className="text-gray">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--gray)' }}>
                Showing {history.length} transaction{history.length !== 1 ? 's' : ''}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Deposit Modal */}
      {modal === 'deposit' && (
        <Modal title="Deposit Funds" onClose={closeModal}
          footer={
            <>
              <button className="btn btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="btn btn-gold" onClick={handleDeposit} disabled={saving}>
                <ArrowUpCircle size={14} /> {saving ? 'Processing…' : 'Deposit'}
              </button>
            </>
          }>
          {/* Source account info */}
          <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
            <div className="text-sm text-gray" style={{ fontSize: '0.7rem', letterSpacing: '0.05em', marginBottom: 4 }}>SOURCE ACCOUNT</div>
            <div className="fw-600" style={{ color: 'var(--navy)' }}>
              {selectedAccount?.packet} — {selectedAccount?.customer?.name}
            </div>
            <div className="text-sm text-gray">Current Balance: {formatRupiah(selectedAccount?.balance)}</div>
          </div>
          <div className="form-group">
            <label>AMOUNT TO DEPOSIT (RP)</label>
            <input type="number" min="1" className={errors.amount ? 'input-error' : ''}
              value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" />
            {errors.amount && <div className="error-msg">{errors.amount}</div>}
          </div>
          <div className="form-group">
            <label>DEPOSIT DATE</label>
            <input type="date" className={errors.transaction_date ? 'input-error' : ''}
              value={form.transaction_date} onChange={e => setForm(f => ({ ...f, transaction_date: e.target.value }))} />
            {errors.transaction_date && <div className="error-msg">{errors.transaction_date}</div>}
          </div>
        </Modal>
      )}

      {/* Withdraw Modal */}
      {modal === 'withdraw' && (
        <Modal title="Withdraw Funds" onClose={closeModal}
          footer={!withdrawResult ? (
            <>
              <button className="btn btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleWithdraw} disabled={saving}>
                <ArrowDownCircle size={14} /> {saving ? 'Processing…' : 'Withdraw'}
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={closeModal}>Close</button>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => window.print()}>
                <Printer size={14} /> Print Receipt
              </button>
            </div>
          )}
        >
          {!withdrawResult ? (
            <>
              {/* Source account info */}
              <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
                <div className="text-sm text-gray" style={{ fontSize: '0.7rem', letterSpacing: '0.05em', marginBottom: 4 }}>SOURCE ACCOUNT</div>
                <div className="fw-600" style={{ color: 'var(--navy)' }}>
                  {selectedAccount?.packet} — {selectedAccount?.customer?.name} · {selectedAccount?.deposito_type?.name}
                </div>
                <div className="text-sm text-gray">Current Balance: {formatRupiah(selectedAccount?.balance)}</div>
              </div>
              <div className="form-group">
                <label>AMOUNT TO WITHDRAW (RP)</label>
                <input type="number" min="1" className={errors.amount ? 'input-error' : ''}
                  value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" />
                {errors.amount && <div className="error-msg">{errors.amount}</div>}
              </div>
              <div className="form-group">
                <label>WITHDRAWAL DATE</label>
                <input type="date" className={errors.transaction_date ? 'input-error' : ''}
                  value={form.transaction_date} onChange={e => setForm(f => ({ ...f, transaction_date: e.target.value }))} />
                {errors.transaction_date && <div className="error-msg">{errors.transaction_date}</div>}
                <div className="text-sm text-gray" style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>📅</span> Interest will be calculated automatically based on months held.
                </div>
              </div>
            </>
          ) : (
            /* Withdrawal Result */
            <div>
              <div style={{
                background: '#F0FBF4', border: '1px solid #86EFAC', borderRadius: 10,
                padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: '1.1rem' }}>✅</span>
                <span className="fw-600" style={{ color: '#166534' }}>Withdrawal Successful!</span>
              </div>

              <div style={{ background: 'var(--cream)', borderRadius: 10, padding: 20 }}>
                {[
                  ['Starting Balance',    formatRupiah(withdrawResult.starting_balance),           ''],
                  ['Months Held',         `${withdrawResult.months_held} month(s)`,                ''],
                  ['Yearly Return',       `${withdrawResult.yearly_return}%`,                      ''],
                  ['Monthly Rate',        `${withdrawResult.monthly_return_rate}%`,                ''],
                  ['Interest Earned',     `+${formatRupiah(withdrawResult.interest_earned)}`,      'text-green'],
                  ['Balance + Interest',  formatRupiah(withdrawResult.balance_before_withdrawal),  ''],
                  ['Amount Withdrawn',    `- ${formatRupiah(withdrawResult.amount_withdrawn)}`,    'text-red'],
                ].map(([label, value, cls]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span className="text-sm text-gray">{label}</span>
                    <span className={`fw-600 text-sm ${cls}`}>{value}</span>
                  </div>
                ))}

                {/* Ending Balance — highlighted */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, marginTop: 4 }}>
                  <span className="fw-600" style={{ fontSize: '0.8rem', letterSpacing: '0.06em' }}>ENDING BALANCE</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--navy)' }}>
                    {formatRupiah(withdrawResult.ending_balance)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}