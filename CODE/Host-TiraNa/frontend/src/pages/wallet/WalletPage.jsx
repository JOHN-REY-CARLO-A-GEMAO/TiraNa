import { useState, useEffect, useMemo } from 'react'
import '../../styles/wallet.css'
import { IconWallet, IconDownload, IconArrowUp, IconArrowDown } from '../../components/icons'
import axiosInstance from '../../api/axiosInstance'

const fmt = (n) =>
  '₱' + Number(n || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

export default function WalletPage() {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await axiosInstance.get('/api/host/revenue/wallet')
        setBalance(data.balance || 0)
        setTransactions(data.transactions || [])
      } catch (err) {
        console.error('Failed to load wallet:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totals = useMemo(() => {
    let income = 0
    let payouts = 0
    transactions.forEach((t) => {
      if (t.type === 'payout') payouts += Math.abs(t.amount)
      else income += t.amount
    })
    return { income, payouts }
  }, [transactions])

  if (loading) {
    return (
      <div className="wallet-page">
        <div className="wallet-loading">Loading wallet…</div>
      </div>
    )
  }

  return (
    <div className="wallet-page">
      <div className="wallet-header">
        <div className="wallet-balance-card">
          <div className="wallet-balance-icon"><IconWallet /></div>
          <div>
            <div className="wallet-balance-label">Available Balance</div>
            <div className="wallet-balance-amount">{fmt(balance)}</div>
          </div>
          <button className="wallet-payout-btn" disabled={balance <= 0}>
            <IconDownload /> Request Payout
          </button>
        </div>
      </div>

      <div className="wallet-stats">
        <div className="wallet-stat-card">
          <IconArrowUp className="wallet-stat-icon income" />
          <div>
            <div className="wallet-stat-label">Total Income</div>
            <div className="wallet-stat-value">{fmt(totals.income)}</div>
          </div>
        </div>
        <div className="wallet-stat-card">
          <IconArrowDown className="wallet-stat-icon payout" />
          <div>
            <div className="wallet-stat-label">Total Payouts</div>
            <div className="wallet-stat-value">{fmt(totals.payouts)}</div>
          </div>
        </div>
      </div>

      <div className="wallet-transactions">
        <h3>Transaction History</h3>
        {transactions.length === 0 ? (
          <div className="wallet-empty">No transactions yet.</div>
        ) : (
          <table className="wallet-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, i) => (
                <tr key={i}>
                  <td>{new Date(t.date).toLocaleDateString()}</td>
                  <td>{t.description}</td>
                  <td>
                    <span className={`wallet-type wallet-type-${t.type}`}>
                      {t.type === 'payout' ? 'Payout' : 'Income'}
                    </span>
                  </td>
                  <td className={t.type === 'payout' ? 'wallet-amount-neg' : 'wallet-amount-pos'}>
                    {t.type === 'payout' ? '-' : '+'}{fmt(Math.abs(t.amount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
