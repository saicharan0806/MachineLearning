import React, { useState, useEffect } from 'react';
import { Search, Eye, ChevronLeft, ChevronRight, Download, Users, Filter } from 'lucide-react';
import { CustomerModal } from '../components/CustomerModal';
import { api } from '../services/api';

export const CustomerRecords = ({ onSelectCustomerForPrediction }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterContract, setFilterContract] = useState('All');
  const [filterChurn, setFilterChurn] = useState('All');
  const [filterInternet, setFilterInternet] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const pageSize = 10;

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const data = await api.getSampleCustomers();
        setCustomers(Array.isArray(data) ? data : (data?.customers || []));
      } catch (err) {
        console.warn('Could not load customers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (c.CustomerID || '').toLowerCase().includes(q) ||
      (c.City || '').toLowerCase().includes(q);
    const matchContract = filterContract === 'All' || c.Contract === filterContract;
    const matchChurn = filterChurn === 'All' || c['Churn Label'] === filterChurn;
    const matchInternet = filterInternet === 'All' || c['Internet Service'] === filterInternet;
    return matchSearch && matchContract && matchChurn && matchInternet;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const resetPage = () => setCurrentPage(1);

  const handleExportCSV = () => {
    if (!filtered.length) return;
    const headers = Object.keys(filtered[0]).join(',');
    const rows = filtered.map(row => Object.values(row).map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'telco_customer_records.csv' });
    a.click();
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 className="page-title">Customer Records</h2>
          <p className="page-description">
            Searchable IBM Telco dataset — {customers.length.toLocaleString()} subscriber accounts from California.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={handleExportCSV} disabled={!filtered.length}>
          <Download size={13} />
          Export CSV ({filtered.length})
        </button>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Filter size={12} /> Filters
          </div>

          <div className="search-wrapper" style={{ maxWidth: 260, flex: '1 1 180px' }}>
            <Search size={14} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search Customer ID or City…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage(); }}
            />
          </div>

          {[
            {
              label: 'Contract', value: filterContract, setter: setFilterContract,
              options: [
                { v: 'All', l: 'All Contracts' },
                { v: 'Month-to-month', l: 'Month-to-month' },
                { v: 'One year', l: 'One year' },
                { v: 'Two year', l: 'Two year' },
              ]
            },
            {
              label: 'Internet', value: filterInternet, setter: setFilterInternet,
              options: [
                { v: 'All', l: 'All Services' },
                { v: 'Fiber optic', l: 'Fiber optic' },
                { v: 'DSL', l: 'DSL' },
                { v: 'No', l: 'No Internet' },
              ]
            },
            {
              label: 'Status', value: filterChurn, setter: setFilterChurn,
              options: [
                { v: 'All', l: 'All Statuses' },
                { v: 'Yes', l: 'Churned' },
                { v: 'No', l: 'Retained' },
              ]
            }
          ].map(({ label, value, setter, options }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{label}:</span>
              <select
                className="form-select"
                style={{ width: 'auto', padding: '5px 8px', fontSize: '0.75rem' }}
                value={value}
                onChange={(e) => { setter(e.target.value); resetPage(); }}
              >
                {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
          ))}

          {(search || filterContract !== 'All' || filterChurn !== 'All' || filterInternet !== 'All') && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { setSearch(''); setFilterContract('All'); setFilterChurn('All'); setFilterInternet('All'); resetPage(); }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Loading customer records…
        </div>
      ) : (
        <>
          <div className="table-wrapper" style={{ marginBottom: 14 }}>
            <table>
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>City</th>
                  <th>Tenure</th>
                  <th>Internet</th>
                  <th>Contract</th>
                  <th>Payment</th>
                  <th>Monthly</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginated.length > 0 ? paginated.map((c) => (
                  <tr key={c.CustomerID}>
                    <td style={{ fontWeight: 600 }}>{c.CustomerID}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{c.City || '—'}</td>
                    <td>{c['Tenure Months']} mo</td>
                    <td>{c['Internet Service']}</td>
                    <td>{c.Contract}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c['Payment Method']}</td>
                    <td style={{ fontWeight: 500 }}>${Number(c['Monthly Charges']).toFixed(2)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>${Number(c['Total Charges']).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${c['Churn Label'] === 'Yes' ? 'badge-churn' : 'badge-stay'}`}>
                        {c['Churn Label'] === 'Yes' ? 'Churned' : 'Retained'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedCustomer(c)}
                        style={{ padding: '4px 8px' }}
                      >
                        <Eye size={12} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      <Users size={28} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
                      No records matched your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="pagination-info">
              {filtered.length > 0
                ? `Showing ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filtered.length)} of ${filtered.length} records`
                : '0 records'}
            </span>
            <div className="pagination">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', padding: '0 4px' }}>
                Page {currentPage} / {totalPages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}

      {selectedCustomer && (
        <CustomerModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onPredictThisCustomer={onSelectCustomerForPrediction}
        />
      )}
    </div>
  );
};
