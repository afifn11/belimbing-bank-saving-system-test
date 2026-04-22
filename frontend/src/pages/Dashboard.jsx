import { useEffect, useState } from 'react';
import { Users, CreditCard, Layers, TrendingUp, ArrowUpCircle, ArrowDownCircle, Percent } from 'lucide-react';
import { getCustomers, getAccounts, getDepositoTypes } from '../api';
import { formatRupiah } from '../utils/format';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats]               = useState(null);
  const [depositoTypes, setDepositoTypes] = useState([]);
  const [topAccounts, setTopAccounts]   = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    Promise.all([getCustomers(), getAccounts(), getDepositoTypes()])
      .then(([c, a, d]) => {
        const customers   = c.data.data || [];
        const accounts    = a.data.data || [];
        const types       = d.data.data || [];

        const totalBalance   = accounts.reduce((s, acc) => s + parseFloat(acc.balance || 0), 0);
        const avgBalance     = accounts.length > 0 ? totalBalance / accounts.length : 0;
        const activeAccounts = accounts.filter(acc => parseFloat(acc.balance) > 0).length;

        // Distribution per deposito type
        const typeMap = {};
        types.forEach(t => { typeMap[t.id] = { ...t, count: 0, totalBalance: 0 }; });
        accounts.forEach(acc => {
          const tid = acc.deposito_type_id;
          if (typeMap[tid]) {
            typeMap[tid].count++;
            typeMap[tid].totalBalance += parseFloat(acc.balance || 0);
          }
        });

        setStats({
          customerCount : customers.length,
          accountCount  : accounts.length,
          activeAccounts,
          typeCount     : types.length,
          totalBalance,
          avgBalance,
          typeDistribution: Object.values(typeMap),
        });
        setDepositoTypes(types);

        // Top 5 accounts by balance
        const sorted = [...accounts].sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));
        setTopAccounts(sorted.slice(0, 5));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ textAlign: 'center', paddingTop: 80, color: 'var(--gray)' }}>
      <div className="spin" style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: 'var(--navy)', borderRadius: '50%', margin: '0 auto 12px' }} />
      Loading dashboard…
    </div>
  );

  const { customerCount, accountCount, activeAccounts, typeCount, totalBalance, avgBalance, typeDistribution } = stats;

  // Badge color by deposito tier name
  const tierBadge = (name = '') => {
    const n = name.toLowerCase();
    if (n.includes('gold'))   return { bg: '#FDF6E7', color: '#A07828', border: 'var(--gold)' };
    if (n.includes('silver')) return { bg: '#F0F4F8', color: '#4A6580', border: '#8BA3BC' };
    return                           { bg: '#F5F0E8', color: '#7A6040', border: '#C4A87A' }; // bronze / default
  };

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of Belimbing Bank Saving System</p>
      </div>

      {/* ── Primary Stats ── */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', marginBottom: 28 }}>
        <StatCard icon={<Users size={20} />} iconClass="navy"  label="Total Customers"  value={customerCount} />
        <StatCard icon={<CreditCard size={20} />} iconClass="gold" label="Total Accounts"  value={accountCount}
          sub={`${activeAccounts} active (balance > 0)`} />
        <StatCard icon={<Layers size={20} />} iconClass="green" label="Deposito Types"   value={typeCount} />
        <StatCard icon={<TrendingUp size={20} />} iconClass="red" label="Total AUM"
          value={formatRupiah(totalBalance)} valueSmall />
      </div>

      {/* ── Secondary Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <MiniStat icon={<ArrowUpCircle size={16} />} color="var(--green)" label="Average Balance / Account" value={formatRupiah(avgBalance)} />
        <MiniStat icon={<ArrowDownCircle size={16} />} color="var(--navy)" label="Accounts per Customer"
          value={customerCount > 0 ? (accountCount / customerCount).toFixed(1) : '—'} />
        <MiniStat icon={<Percent size={16} />} color="var(--gold)" label="Active Rate"
          value={accountCount > 0 ? `${Math.round((activeAccounts / accountCount) * 100)}%` : '—'} />
      </div>

      {/* ── Two-column: Deposito Distribution + Top Accounts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 20, marginBottom: 20 }}>

        {/* Deposito Distribution */}
        <div className="card">
          <div className="card-header" style={{ paddingBottom: 16 }}>
            <span className="card-title">Deposito Distribution</span>
          </div>
          <div className="card-body" style={{ paddingTop: 0 }}>
            {typeDistribution.length === 0 ? (
              <div className="empty-state"><p>No deposito types yet</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {typeDistribution
                  .sort((a, b) => b.totalBalance - a.totalBalance)
                  .map(t => {
                    const pct = totalBalance > 0 ? (t.totalBalance / totalBalance) * 100 : 0;
                    const badge = tierBadge(t.name);
                    return (
                      <div key={t.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              display: 'inline-block', padding: '2px 10px', borderRadius: 20,
                              fontSize: '0.72rem', fontWeight: 600,
                              background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
                            }}>{t.name}</span>
                            <span className="text-sm text-gray">{t.count} akun · {t.yearly_return}%/yr</span>
                          </div>
                          <span className="text-sm fw-600">{pct.toFixed(0)}%</span>
                        </div>
                        {/* Progress bar */}
                        <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${pct}%`, borderRadius: 99,
                            background: badge.border, transition: 'width 0.6s ease',
                          }} />
                        </div>
                        <div className="text-sm text-gray" style={{ marginTop: 3 }}>
                          {formatRupiah(t.totalBalance)}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Top Accounts by Balance */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Top Accounts by Balance</span>
            <Link to="/accounts" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          <div className="card-body" style={{ paddingTop: 12 }}>
            {topAccounts.length === 0 ? (
              <div className="empty-state"><p>No accounts yet</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Account</th>
                      <th>Customer</th>
                      <th>Deposito</th>
                      <th style={{ textAlign: 'right' }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topAccounts.map((acc, i) => {
                      const badge = tierBadge(acc.deposito_type?.name || '');
                      return (
                        <tr key={acc.id}>
                          <td style={{ width: 28 }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 22, height: 22, borderRadius: '50%', fontSize: '0.72rem', fontWeight: 700,
                              background: i === 0 ? 'var(--gold)' : 'var(--cream)', color: i === 0 ? 'var(--navy)' : 'var(--gray)',
                            }}>{i + 1}</span>
                          </td>
                          <td>
                            <span className="fw-600">{acc.packet}</span>
                            <br />
                            <span className="text-sm text-gray">#{acc.id}</span>
                          </td>
                          <td className="text-sm">{acc.customer?.name || '—'}</td>
                          <td>
                            <span style={{
                              display: 'inline-block', padding: '2px 8px', borderRadius: 20,
                              fontSize: '0.70rem', fontWeight: 600,
                              background: badge.bg, color: badge.color,
                            }}>{acc.deposito_type?.name || '—'}</span>
                          </td>
                          <td className="fw-600" style={{ textAlign: 'right', color: 'var(--navy)' }}>
                            {formatRupiah(acc.balance)}
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
      </div>

      {/* ── Quick Actions ── */}
      <div className="card">
        <div className="card-header" style={{ paddingBottom: 16 }}>
          <span className="card-title">Quick Actions</span>
        </div>
        <div className="card-body" style={{ paddingTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/customers" className="btn btn-primary"><Users size={15} /> Manage Customers</Link>
          <Link to="/accounts"  className="btn btn-gold"><CreditCard size={15} /> Manage Accounts</Link>
          <Link to="/transactions" className="btn btn-ghost"><TrendingUp size={15} /> View Transactions</Link>
          <Link to="/deposito-types" className="btn btn-ghost"><Layers size={15} /> Deposito Types</Link>
        </div>
      </div>
    </div>
  );
}

/* ── Helper sub-components ── */
function StatCard({ icon, iconClass, label, value, sub, valueSmall }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconClass}`}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div className="stat-label">{label}</div>
        <div className="stat-value" style={valueSmall ? { fontSize: '1.15rem' } : {}}>{value}</div>
        {sub && <div className="text-sm text-gray" style={{ marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function MiniStat({ icon, color, label, value }) {
  return (
    <div style={{
      background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
      padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: `${color}18`, color, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div className="text-sm text-gray" style={{ marginBottom: 2 }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--navy)' }}>{value}</div>
      </div>
    </div>
  );
}