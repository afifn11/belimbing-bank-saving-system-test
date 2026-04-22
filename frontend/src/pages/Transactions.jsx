import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpCircle, ArrowDownCircle, Loader, Calculator } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../components/common/Modal';
import { getAccounts, getTransactionHistory, deposit, withdraw } from '../api';
import { formatRupiah, formatDate, todayISO } from '../utils/format';

export default function Transactions() {
  const [searchParams] = useSearchParams();
  const [accounts, setAccounts]         = useState([]);
  const [selectedAccId, setSelectedAccId] = useState(searchParams.get('accountId') || '');
  const [history, setHistory]           = useState([]);
  const [loadingAcc, setLoadingAcc]     = useState(true);
  const [loadingHist, setLoadingHist]   = useState(false);
  const [saving, setSaving]             = useState(false);
  const [modal, setModal]               = useState(null); // 'deposit' | 'withdraw'
  const [form, setForm]                 = useState({ amount: '', transaction_date: todayISO() });
  const [errors, setErrors]             = useState({});
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
  useEffect(() => { if (selectedAccId) loadHistory(selectedAccId); else setHistory([]); }, [selectedAccId, loadHistory]);

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
      closeModal();
      loadHistory(selectedAccId);
      loadAccounts();
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
      loadHistory(selectedAccId);
      loadAccounts();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Transactions</h1>
        <p>Deposit, withdraw, and view transaction history</p>
      </div>

      {/* Account selector */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
              <label>Select Account</label>
              {loadingAcc ? <div className="text-gray text-sm">Loading…</div> : (
                <select value={selectedAccId} onChange={e => setSelectedAccId(e.target.value)}>
                  <option value="">— Choose an account —</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      #{a.id} — {a.packet} ({a.customer?.name}) · {formatRupiah(a.balance)}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {selectedAccId && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-gold" onClick={() => openModal('deposit')}>
                  <ArrowUpCircle size={16} /> Deposit
                </button>
                <button className="btn btn-primary" onClick={() => openModal('withdraw')}>
                  <ArrowDownCircle size={16} /> Withdraw
                </button>
              </div>
            )}
          </div>

          {selectedAccount && (
            <div className="alert alert-info" style={{ marginTop: 16, marginBottom: 0 }}>
              <strong>{selectedAccount.packet}</strong> — {selectedAccount.customer?.name} &nbsp;|&nbsp;
              Deposito: <strong>{selectedAccount.deposito_type?.name}</strong> ({selectedAccount.deposito_type?.yearly_return}% / yr) &nbsp;|&nbsp;
              Balance: <strong className="text-green">{formatRupiah(selectedAccount.balance)}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Transaction History */}
      {selectedAccId && (
        <div className="card">
          <div className="card-header"><span className="card-title">Transaction History</span></div>
          <div className="card-body">
            {loadingHist ? (
              <div className="empty-state"><Loader size={24} className="spin" /></div>
            ) : history.length === 0 ? (
              <div className="empty-state"><p>No transactions yet for this account.</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Date</th><th>Type</th><th>Amount</th><th>Starting Balance</th><th>Interest</th><th>Months</th><th>Ending Balance</th></tr>
                  </thead>
                  <tbody>
                    {history.map(tx => (
                      <tr key={tx.id}>
                        <td className="text-sm">{formatDate(tx.transaction_date)}</td>
                        <td>
                          {tx.type === 'deposit'
                            ? <span className="badge badge-green">↑ Deposit</span>
                            : <span className="badge badge-red">↓ Withdraw</span>}
                        </td>
                        <td className={`fw-600 ${tx.type === 'deposit' ? 'text-green' : 'text-red'}`}>
                          {tx.type === 'deposit' ? '+' : '-'}{formatRupiah(tx.amount)}
                        </td>
                        <td>{formatRupiah(tx.starting_balance)}</td>
                        <td>{tx.interest_earned != null ? <span className="text-gold fw-600">+{formatRupiah(tx.interest_earned)}</span> : '—'}</td>
                        <td>{tx.months_held != null ? `${tx.months_held} mo` : '—'}</td>
                        <td className="fw-600">{tx.ending_balance != null ? formatRupiah(tx.ending_balance) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

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
          <div className="alert alert-gold" style={{ marginBottom: 16 }}>
            Account: <strong>{selectedAccount?.packet}</strong> — Current balance: <strong>{formatRupiah(selectedAccount?.balance)}</strong>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Amount (Rp)</label>
              <input type="number" min="1" className={errors.amount ? 'input-error' : ''}
                value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" />
              {errors.amount && <div className="error-msg">{errors.amount}</div>}
            </div>
            <div className="form-group">
              <label>Deposit Date</label>
              <input type="date" className={errors.transaction_date ? 'input-error' : ''}
                value={form.transaction_date} onChange={e => setForm(f => ({ ...f, transaction_date: e.target.value }))} />
              {errors.transaction_date && <div className="error-msg">{errors.transaction_date}</div>}
            </div>
          </div>
        </Modal>
      )}

      {/* Withdraw Modal */}
      {modal === 'withdraw' && (
        <Modal title="Withdraw Funds" onClose={closeModal} size={withdrawResult ? 'modal-lg' : ''}
          footer={!withdrawResult ? (
            <>
              <button className="btn btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleWithdraw} disabled={saving}>
                <ArrowDownCircle size={14} /> {saving ? 'Processing…' : 'Withdraw'}
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={closeModal}>Close</button>
          )}>

          {!withdrawResult ? (
            <>
              <div className="alert alert-info" style={{ marginBottom: 16 }}>
                Account: <strong>{selectedAccount?.packet}</strong> — Balance: <strong>{formatRupiah(selectedAccount?.balance)}</strong>
                <br /><span className="text-sm">Interest will be calculated automatically based on months held.</span>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Amount to Withdraw (Rp)</label>
                  <input type="number" min="1" className={errors.amount ? 'input-error' : ''}
                    value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" />
                  {errors.amount && <div className="error-msg">{errors.amount}</div>}
                </div>
                <div className="form-group">
                  <label>Withdrawal Date</label>
                  <input type="date" className={errors.transaction_date ? 'input-error' : ''}
                    value={form.transaction_date} onChange={e => setForm(f => ({ ...f, transaction_date: e.target.value }))} />
                  {errors.transaction_date && <div className="error-msg">{errors.transaction_date}</div>}
                </div>
              </div>
            </>
          ) : (
            /* Withdrawal Result Summary */
            <div>
              <div className="alert alert-success" style={{ marginBottom: 16 }}>
                <strong>✅ Withdrawal Successful!</strong>
              </div>
              <div style={{ background: 'var(--cream)', borderRadius: 10, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Calculator size={18} style={{ color: 'var(--gold)' }} />
                  <span className="fw-600">Interest Calculation Summary</span>
                </div>
                {[
                  ['Starting Balance', formatRupiah(withdrawResult.starting_balance)],
                  ['Months Held', `${withdrawResult.months_held} month(s)`],
                  ['Yearly Return', `${withdrawResult.yearly_return}%`],
                  ['Monthly Return Rate', `${withdrawResult.monthly_return_rate}%`],
                  ['Interest Earned', formatRupiah(withdrawResult.interest_earned), 'text-green'],
                  ['Balance + Interest', formatRupiah(withdrawResult.balance_before_withdrawal)],
                  ['Amount Withdrawn', `- ${formatRupiah(withdrawResult.amount_withdrawn)}`, 'text-red'],
                ].map(([label, value, cls]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span className="text-sm text-gray">{label}</span>
                    <span className={`fw-600 text-sm ${cls || ''}`}>{value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0' }}>
                  <span className="fw-600">Ending Balance</span>
                  <span className="fw-600" style={{ fontSize: '1.1rem', color: 'var(--navy)' }}>
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
