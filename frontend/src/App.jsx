import { useEffect, useMemo, useState } from 'react'
import {
  Activity, BarChart3, Boxes, BrainCircuit, ChevronDown, CircleHelp,
  CloudUpload, LayoutDashboard, Menu, PackageSearch, RefreshCw,
  Search, Settings2, ShoppingBag, Users, X, AlertTriangle, CheckCircle2,
  TrendingUp, UserRoundSearch
} from 'lucide-react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts'
import api from './api'

const NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'sales', label: 'Sales analytics', icon: BarChart3 },
  { id: 'forecast', label: 'Demand forecasting', icon: TrendingUp },
  { id: 'customers', label: 'Customer insights', icon: Users },
  { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'data', label: 'Data management', icon: CloudUpload },
]
const money = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0)
const short = n => new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(n || 0)

function App() {
  const [page, setPage] = useState('overview')
  const [summary, setSummary] = useState(null)
  const [trend, setTrend] = useState([])
  const [forecast, setForecast] = useState([])
  const [segments, setSegments] = useState([])
  const [churn, setChurn] = useState([])
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mobileNav, setMobileNav] = useState(false)
  const [search, setSearch] = useState('')
  const [uploadMessage, setUploadMessage] = useState('')
  const [forecastDays, setForecastDays] = useState(30)

  async function loadData() {
    setLoading(true); setError('')
    try {
      const [s, t, f, seg, ch, inv] = await Promise.all([
        api.get('/api/dashboard'), api.get('/api/sales/trend'),
        api.get(`/api/forecast?days=${forecastDays}`), api.get('/api/customers/segments'),
        api.get('/api/customers/churn'), api.get('/api/inventory/recommendations')
      ])
      setSummary(s.data); setTrend(t.data); setForecast(f.data.forecast)
      setSegments(seg.data); setChurn(ch.data); setInventory(inv.data)
    } catch (e) {
      setError('Cannot connect to the backend. Start FastAPI at http://127.0.0.1:8000 and refresh.')
    } finally { setLoading(false) }
  }
  useEffect(() => { loadData() }, [forecastDays])

  const filteredInventory = useMemo(() => inventory.filter(p =>
    `${p.product_id} ${p.category} ${p.status}`.toLowerCase().includes(search.toLowerCase())
  ), [inventory, search])

  async function handleUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const form = new FormData(); form.append('file', file)
    setUploadMessage('Uploading and validating CSV…')
    try {
      const response = await api.post('/api/data/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setUploadMessage(`Loaded ${response.data.rows_loaded} rows; rejected ${response.data.rows_rejected}.`)
      await loadData()
    } catch (e) {
      setUploadMessage(e.response?.data?.detail || 'Upload failed. Check the CSV columns and try again.')
    }
    event.target.value = ''
  }

  const title = page === 'admin'
  ? 'Administrator'
  : page === 'settings'
    ? 'Settings'
    : NAV.find(n => n.id === page)?.label || 'Overview'
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand">
        <div className="brand-mark"><Activity size={22}/></div>
        <div><strong>RetailPulse</strong><span>RETAIL INTELLIGENCE</span></div>
        <button className="icon-button mobile-close" onClick={() => setMobileNav(false)}><X size={18}/></button>
      </div>
      <div className="workspace"><div className="workspace-icon">R</div><div><b>Retail workspace</b><small>Demo environment</small></div><ChevronDown size={15}/></div>
      <div className="nav-label">WORKSPACE</div>
      <nav>{NAV.map(item => {
        const Icon = item.icon
        return <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => {setPage(item.id); setMobileNav(false)}}>
          <Icon size={18}/><span>{item.label}</span>{item.id === 'inventory' && summary?.low_stock_products > 0 && <em>{summary.low_stock_products}</em>}
        </button>
      })}</nav>
      <div className="sidebar-bottom">
        <div className="help-card"><div className="help-icon"><CircleHelp size={18}/></div><b>Need a hand?</b><p>Explore the API docs to understand how RetailPulse works.</p><a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer">Open API docs ↗</a></div>
            <button
        className={`nav-item ${page === 'settings' ? 'active' : ''}`}
        onClick={() => {
          setPage('settings');
          setMobileNav(false);
        }}
      >
        <Settings2 size={18} />
        <span>Settings</span>
      </button>

      <button
  type="button"
  className="profile"
  onClick={() => setPage('admin')}
  style={{
    width: '100%',
    border: 'none',
    background: 'transparent',
    textAlign: 'left',
    cursor: 'pointer',
    color: 'inherit',
    font: 'inherit',
  }}
>
  <div className="avatar">RP</div>
  <div>
    <b>RetailPulse Admin</b>
    <small>Administrator</small>
  </div>
</button>
        
      </div>
    </aside>

    {mobileNav && <button className="scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)}/>}
    <main className="main-area">
      <header className="topbar">
        <div className="top-left"><button className="icon-button mobile-menu" onClick={() => setMobileNav(true)}><Menu/></button><div className="breadcrumbs">Workspace <span>/</span> <b>{title}</b></div></div>
        <div className="top-actions"><div className="status-pill"><i/> Demo data connected</div><button className="icon-button" title="Refresh data" onClick={loadData}><RefreshCw size={17}/></button><div className="top-avatar">R</div></div>
      </header>
      <div className="page-content">
        <div className="page-heading">
          <div><div className="eyebrow">RETAIL ANALYTICS PLATFORM</div><h1>{page === 'overview' ? 'Good morning, Ravi' : title}<span className="heading-dot">.</span></h1><p>{page === 'overview' ? 'Here’s what’s happening across your retail business today.' : pageDescription(page)}</p></div>
          <div className="heading-actions"><span className="date-chip"><Activity size={15}/> Last 30 days</span><button className="primary-button" onClick={loadData}><RefreshCw size={15}/> Refresh insights</button></div>
        </div>

        {error && <div className="error-banner"><AlertTriangle size={18}/>{error}</div>}
        {loading && !summary ? <div className="loading-card"><div className="spinner"/>Connecting to RetailPulse analytics…</div> : <>
          {page === 'overview' && <Overview summary={summary} trend={trend} segments={segments} inventory={inventory} setPage={setPage}/>}
          {page === 'sales' && <SalesPage trend={trend} summary={summary}/>}
          {page === 'forecast' && <ForecastPage forecast={forecast} days={forecastDays} setDays={setForecastDays}/>}
          {page === 'customers' && <CustomersPage segments={segments} churn={churn}/>}
          {page === 'inventory' && <InventoryPage data={filteredInventory} search={search} setSearch={setSearch}/>}
          {page === 'data' && <DataPage onUpload={handleUpload} message={uploadMessage} onRefresh={loadData}/>}
          {page === 'settings' && (
  <div className="card">
    <h2>Settings</h2>
    <p>Manage your RetailPulse workspace settings here.</p>
    <div style={{ marginTop: '24px', display: 'grid', gap: '20px' }}>

  <section className="panel" style={{ padding: '24px' }}>
    <h3>General Settings</h3>
    <p style={{ color: '#718096' }}>
      Configure your RetailPulse workspace.
    </p>

    <label htmlFor="workspaceName">Workspace Name</label>
    <input
      id="workspaceName"
      type="text"
      defaultValue="RetailPulse"
      style={{
        display: 'block',
        width: '100%',
        maxWidth: '400px',
        padding: '10px',
        marginTop: '8px',
        border: '1px solid #dbe2ea',
        borderRadius: '8px'
      }}
    />
  </section>

  <section className="panel" style={{ padding: '24px' }}>
    <h3>Analytics Preferences</h3>
    <p style={{ color: '#718096' }}>
      Choose your default analytics period.
    </p>

    <label htmlFor="dateRange">Default Date Range</label>
    <select
      id="dateRange"
      defaultValue="30"
      style={{
        display: 'block',
        width: '100%',
        maxWidth: '400px',
        padding: '10px',
        marginTop: '8px',
        border: '1px solid #dbe2ea',
        borderRadius: '8px'
      }}
    >
      <option value="7">Last 7 days</option>
      <option value="30">Last 30 days</option>
      <option value="90">Last 90 days</option>
    </select>

    <label
      htmlFor="forecastPeriod"
      style={{ display: 'block', marginTop: '20px' }}
    >
      Forecast Period
    </label>
    <select
      id="forecastPeriod"
      defaultValue="30"
      style={{
        display: 'block',
        width: '100%',
        maxWidth: '400px',
        padding: '10px',
        marginTop: '8px',
        border: '1px solid #dbe2ea',
        borderRadius: '8px'
      }}
    >
      <option value="7">7 days</option>
      <option value="14">14 days</option>
      <option value="30">30 days</option>
    </select>
  </section>

  <section className="panel" style={{ padding: '24px' }}>
    <h3>Inventory Settings</h3>
    <p style={{ color: '#718096' }}>
      Configure when products should be considered low in stock.
    </p>

    <label htmlFor="lowStockThreshold">
      Low-Stock Threshold (units)
    </label>
    <input
      id="lowStockThreshold"
      type="number"
      min="1"
      defaultValue="10"
      style={{
        display: 'block',
        width: '100%',
        maxWidth: '400px',
        padding: '10px',
        marginTop: '8px',
        border: '1px solid #dbe2ea',
        borderRadius: '8px'
      }}
    />
  </section>

  <section className="panel" style={{ padding: '24px' }}>
    <h3>Notifications</h3>
    <p style={{ color: '#718096' }}>
      Choose which notification preferences you want enabled.
    </p>

    <label style={{ display: 'block', marginTop: '16px' }}>
      <input type="checkbox" defaultChecked />
      {' '}Low-stock alerts
    </label>

    <label style={{ display: 'block', marginTop: '16px' }}>
      <input type="checkbox" defaultChecked />
      {' '}Forecast alerts
    </label>

    <label style={{ display: 'block', marginTop: '16px' }}>
      <input type="checkbox" defaultChecked />
      {' '}Data upload notifications
    </label>
  </section>

</div>

  </div>
)}
        </>}
       {page === 'admin' && (
  <div style={{ display: 'grid', gap: '24px' }}>

    {/* Profile Header */}
    <section className="panel" style={{ padding: '24px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '18px',
        flexWrap: 'wrap'
      }}>
        <div style={{
          width: '76px',
          height: '76px',
          borderRadius: '50%',
          background: '#5b7cfa',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          fontWeight: '700'
        }}>
          RP
        </div>

        <div>
          <h2 style={{ margin: '0 0 8px' }}>RetailPulse Admin</h2>
          <p style={{ margin: '0 0 10px', color: '#718096' }}>
            Manage your administrator profile and workspace.
          </p>
          <span style={{
            background: '#dcfce7',
            color: '#166534',
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            ● Active Administrator
          </span>
        </div>
      </div>
    </section>

    {/* Account Information */}
    <section className="panel" style={{ padding: '24px' }}>
      <h2 style={{ marginTop: 0 }}>Account Information</h2>
      <p style={{ color: '#718096', marginBottom: '24px' }}>
        Overview of your RetailPulse account.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px'
      }}>
        <div>
          <small style={{ color: '#718096' }}>Workspace</small>
          <h3>RetailPulse</h3>
        </div>

        <div>
          <small style={{ color: '#718096' }}>Account Role</small>
          <h3>Administrator</h3>
        </div>

        <div>
          <small style={{ color: '#718096' }}>Account Status</small>
          <h3 style={{ color: '#16a34a' }}>Active</h3>
        </div>

        <div>
          <small style={{ color: '#718096' }}>Platform</small>
          <h3>Retail Intelligence</h3>
        </div>
      </div>
    </section>

    {/* Quick Actions */}
    <section>
      <h2 style={{ marginBottom: '16px' }}>Quick Actions</h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '18px'
      }}>
        <button
          className="panel"
          onClick={() => setPage('overview')}
          style={{
            padding: '22px',
            textAlign: 'left',
            cursor: 'pointer',
            color: 'inherit',
            font: 'inherit'
          }}
        >
          <h3>Dashboard Overview</h3>
          <p style={{ color: '#718096' }}>
            View revenue, sales, and business insights.
          </p>
          <strong style={{ color: '#5b7cfa' }}>
            Open Dashboard →
          </strong>
        </button>

        <button
          className="panel"
          onClick={() => setPage('data')}
          style={{
            padding: '22px',
            textAlign: 'left',
            cursor: 'pointer',
            color: 'inherit',
            font: 'inherit'
          }}
        >
          <h3>Data Management</h3>
          <p style={{ color: '#718096' }}>
            Upload sales data and refresh analytics.
          </p>
          <strong style={{ color: '#5b7cfa' }}>
            Manage Data →
          </strong>
        </button>

        <button
          className="panel"
          onClick={() => setPage('settings')}
          style={{
            padding: '22px',
            textAlign: 'left',
            cursor: 'pointer',
            color: 'inherit',
            font: 'inherit'
          }}
        >
          <h3>Workspace Settings</h3>
          <p style={{ color: '#718096' }}>
            Open your workspace settings page.
          </p>
          <strong style={{ color: '#5b7cfa' }}>
            Open Settings →
          </strong>
        </button>
      </div>
    </section>

  </div>
)}

        <footer className="footer"><span>© 2026 RetailPulse Analytics</span><span><i/> All systems operational <b>·</b> Built for smarter retail decisions</span></footer>
      </div>
    </main>
  </div>
}

function pageDescription(page) {
  return ({
    sales: 'Understand sales performance, revenue trends, and product demand.',
    forecast: 'Explore a baseline projection of near-term unit demand.',
    customers: 'Discover customer groups and identify customers who may need attention.',
    inventory: 'Review stock health and data-driven replenishment suggestions.',
    data: 'Upload your retail CSV and refresh the analytics pipeline.'
  })[page]
}

function MetricCard({ label, value, detail, icon: Icon, color, trendLabel }) {
  return <div className="metric-card"><div className="metric-top"><span>{label}</span><div className={`metric-icon ${color}`}><Icon size={18}/></div></div><div className="metric-value">{value}</div><div className="metric-foot"><span className="metric-detail">{detail}</span>{trendLabel && <span className="trend-tag">{trendLabel}</span>}</div></div>
}

function Overview({ summary, trend, segments, inventory, setPage }) {
  const monthly = trend.slice(-30)
  const pieData = segments.map(s => ({name:s.segment, value:s.customers}))
  const colors = ['#5b7cfa','#27b28b','#f3aa48','#9b7cf6']
  const lowStock = inventory.filter(i => i.status === 'Reorder').slice(0,4)
  return <>
    <div className="metrics-grid">
      <MetricCard label="Total revenue" value={money(summary?.total_revenue)} detail="Across recorded sales" icon={TrendingUp} color="blue" trendLabel="Sales"/>
      <MetricCard label="Sales transactions" value={short(summary?.orders)} detail={`${short(summary?.units_sold)} units sold`} icon={ShoppingBag} color="purple"/>
      <MetricCard label="Active customers" value={short(summary?.customers)} detail="Unique customer IDs" icon={Users} color="green"/>
      <MetricCard label="Products to reorder" value={summary?.low_stock_products ?? 0} detail="Review inventory levels" icon={PackageSearch} color="orange" trendLabel="Action"/>
    </div>
    <div className="content-grid overview-charts">
      <section className="panel sales-panel"><PanelHeading title="Revenue overview" subtitle="Daily revenue across the selected demo period" action={<button className="text-button" onClick={() => setPage('sales')}>View report ↗</button>}/>
        <div className="chart-summary"><strong>{money(monthly.reduce((a,b)=>a+b.revenue,0))}</strong><span>Revenue · latest {monthly.length} days</span></div>
        <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={monthly}><defs><linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5b7cfa" stopOpacity={0.22}/><stop offset="100%" stopColor="#5b7cfa" stopOpacity={0.01}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f5"/><XAxis dataKey="date" tickFormatter={v=>v.slice(5)} tickLine={false} axisLine={false} tick={{fontSize:11,fill:'#8b95a7'}} minTickGap={28}/><YAxis tickFormatter={short} tickLine={false} axisLine={false} tick={{fontSize:11,fill:'#8b95a7'}} width={48}/><Tooltip formatter={v=>money(v)} labelStyle={{color:'#202b40'}}/><Area type="monotone" dataKey="revenue" stroke="#5b7cfa" strokeWidth={2.5} fill="url(#revGradient)" activeDot={{r:5}}/></AreaChart></ResponsiveContainer></div>
      </section>
      <section className="panel segment-panel"><PanelHeading title="Customer segments" subtitle="Customers grouped by purchase behavior" action={<button className="text-button" onClick={()=>setPage('customers')}>Details ↗</button>}/>
        {pieData.length ? <div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={4} stroke="none">{pieData.map((d,i)=><Cell key={d.name} fill={colors[i%colors.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="donut-center"><strong>{short(summary?.customers)}</strong><span>customers</span></div></div> : <Empty/>}
        <div className="legend-list">{pieData.map((d,i)=><div className="legend-row" key={d.name}><span><i style={{background:colors[i%colors.length]}}/>{d.name}</span><b>{d.value}</b></div>)}</div>
      </section>
    </div>
    <div className="content-grid bottom-grid">
      <section className="panel"><PanelHeading title="Inventory alerts" subtitle="Products that may need replenishment" action={<button className="text-button" onClick={()=>setPage('inventory')}>View inventory ↗</button>}/>
        {lowStock.length ? <div className="table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Current stock</th><th>Status</th></tr></thead><tbody>{lowStock.map(p=><tr key={p.product_id}><td><div className="product-cell"><div className="product-icon"><Boxes size={15}/></div><b>{p.product_id}</b></div></td><td>{p.category}</td><td>{p.stock} units</td><td><Status value={p.status}/></td></tr>)}</tbody></table></div> : <Empty text="No products need replenishment right now."/>}
      </section>
      <section className="panel insight-panel"><PanelHeading title="AI insights" subtitle="Suggested next steps"/><div className="insight-item"><div className="insight-symbol purple"><BrainCircuit size={17}/></div><div><b>Review customer risk</b><p>Prioritize high-risk customers for retention outreach.</p><button className="text-button" onClick={()=>setPage('customers')}>Explore customers →</button></div></div><div className="insight-item"><div className="insight-symbol orange"><PackageSearch size={17}/></div><div><b>Plan replenishment</b><p>Use demand and stock levels to review suggested reorder quantities.</p><button className="text-button" onClick={()=>setPage('inventory')}>Review inventory →</button></div></div></section>
    </div>
  </>
}

function PanelHeading({title, subtitle, action}) { return <div className="panel-heading"><div><h2>{title}</h2><p>{subtitle}</p></div>{action}</div> }
function Status({value}) { return <span className={`status ${value === 'Healthy' || value === 'Low' ? 'status-good' : value === 'Medium' ? 'status-medium' : 'status-warn'}`}><i/>{value}</span> }
function Empty({text='No data available yet.'}) { return <div className="empty-state">{text}</div> }

function SalesPage({trend, summary}) {
  return <><div className="metrics-grid"><MetricCard label="Revenue" value={money(summary?.total_revenue)} detail="All imported transactions" icon={TrendingUp} color="blue"/><MetricCard label="Transactions" value={short(summary?.orders)} detail="Rows in sales dataset" icon={ShoppingBag} color="purple"/><MetricCard label="Units sold" value={short(summary?.units_sold)} detail="Quantity total" icon={Boxes} color="green"/><MetricCard label="Average sale / row" value={money(summary?.average_order_value)} detail="Revenue divided by rows" icon={BarChart3} color="orange"/></div>
    <section className="panel full-panel"><PanelHeading title="Daily sales trend" subtitle="Revenue and units for each recorded date"/><div className="large-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f5"/><XAxis dataKey="date" tickFormatter={v=>v.slice(5)} tickLine={false} axisLine={false}/><YAxis tickFormatter={short} tickLine={false} axisLine={false}/><Tooltip/><Area dataKey="revenue" name="Revenue" stroke="#5b7cfa" fill="#5b7cfa" fillOpacity={0.12}/><Area dataKey="units" name="Units" stroke="#27b28b" fill="#27b28b" fillOpacity={0.08}/></AreaChart></ResponsiveContainer></div></section>
    <section className="panel"><PanelHeading title="Recent daily totals" subtitle="Most recent 10 dates"/><div className="table-wrap"><table><thead><tr><th>Date</th><th>Revenue</th><th>Units</th></tr></thead><tbody>{trend.slice(-10).reverse().map(r=><tr key={r.date}><td>{r.date}</td><td><b>{money(r.revenue)}</b></td><td>{r.units}</td></tr>)}</tbody></table></div></section></>
}

function ForecastPage({forecast, days, setDays}) {
  return <><div className="notice"><BrainCircuit size={18}/><div><b>Baseline forecast</b><p>This demo uses recent weekday averages. It is not a trained Prophet/LSTM ensemble and should not be treated as a business guarantee.</p></div></div>
    <section className="panel full-panel"><PanelHeading title="Expected unit demand" subtitle="Projected total units across all products" action={<select className="select-control" value={days} onChange={e=>setDays(Number(e.target.value))}><option value={7}>Next 7 days</option><option value={14}>Next 14 days</option><option value={30}>Next 30 days</option><option value={60}>Next 60 days</option><option value={90}>Next 90 days</option></select>}/>
    <div className="chart-summary"><strong>{short(forecast.reduce((a,b)=>a+b.predicted_units,0))} units</strong><span>Predicted total for selected horizon</span></div>
    <div className="large-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={forecast}><defs><linearGradient id="fcGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#27b28b" stopOpacity={0.2}/><stop offset="100%" stopColor="#27b28b" stopOpacity={0.01}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f5"/><XAxis dataKey="date" tickFormatter={v=>v.slice(5)} tickLine={false} axisLine={false} minTickGap={24}/><YAxis tickLine={false} axisLine={false}/><Tooltip/><Area dataKey="predicted_units" name="Predicted units" type="monotone" stroke="#27b28b" strokeWidth={2.5} fill="url(#fcGradient)"/></AreaChart></ResponsiveContainer></div></section>
    <section className="panel"><PanelHeading title="Forecast values" subtitle="Daily baseline predictions"/><div className="table-wrap"><table><thead><tr><th>Date</th><th>Predicted units</th><th>Planning note</th></tr></thead><tbody>{forecast.map(r=><tr key={r.date}><td>{r.date}</td><td><b>{r.predicted_units}</b></td><td>Compare with stock and recent demand</td></tr>)}</tbody></table></div></section>
  </>
}

function CustomersPage({segments, churn}) {
  const pieColors = ['#5b7cfa','#27b28b','#f3aa48','#9b7cf6']
  return <><div className="metrics-grid"><MetricCard label="Segments identified" value={segments.length} detail="K-Means clusters, business-labelled" icon={Users} color="blue"/><MetricCard label="Customers in risk list" value={churn.length} detail="Top 30 by demo risk score" icon={UserRoundSearch} color="purple"/><MetricCard label="High-risk customers" value={churn.filter(c=>c.risk==='High').length} detail="Prioritize retention review" icon={AlertTriangle} color="orange"/><MetricCard label="Customer analysis" value="RFM" detail="Recency, frequency, monetary value" icon={BrainCircuit} color="green"/></div>
    <div className="content-grid"><section className="panel"><PanelHeading title="Customer segments" subtitle="Mean customer spend and recency"/><div className="table-wrap"><table><thead><tr><th>Segment</th><th>Customers</th><th>Avg. spend</th><th>Avg. recency</th></tr></thead><tbody>{segments.map(s=><tr key={s.segment}><td><b>{s.segment}</b></td><td>{s.customers}</td><td>{money(s.avg_spend)}</td><td>{s.avg_recency_days} days</td></tr>)}</tbody></table></div></section>
    <section className="panel"><PanelHeading title="Segment distribution" subtitle="Customer count by segment"/><div className="segment-bars">{segments.map((s,i)=><div className="segment-bar" key={s.segment}><div><span>{s.segment}</span><b>{s.customers}</b></div><div className="bar-track"><i style={{width:`${Math.max(5,s.customers/Math.max(...segments.map(x=>x.customers),1)*100)}%`,background:pieColors[i%pieColors.length]}}/></div></div>)}</div></section></div>
    <section className="panel"><PanelHeading title="Customer churn-risk review" subtitle="Rule-based demo scores; not a trained or validated churn model"/><div className="table-wrap"><table><thead><tr><th>Customer</th><th>Days since purchase</th><th>Transactions</th><th>Total spend</th><th>Risk score</th><th>Risk</th></tr></thead><tbody>{churn.map(c=><tr key={c.customer_id}><td><b>{c.customer_id}</b></td><td>{c.days_since_purchase}</td><td>{c.orders}</td><td>{money(c.spend)}</td><td><div className="score-cell"><div className="score-track"><i style={{width:`${c.risk_score*100}%`}}/></div>{Math.round(c.risk_score*100)}%</div></td><td><Status value={c.risk}/></td></tr>)}</tbody></table></div></section>
  </>
}

function InventoryPage({data, search, setSearch}) {
  const reorder = data.filter(p=>p.status==='Reorder')
  return <><div className="metrics-grid"><MetricCard label="Products tracked" value={data.length} detail="Demo catalog" icon={Boxes} color="blue"/><MetricCard label="Need reorder" value={reorder.length} detail="Below estimated reorder point" icon={PackageSearch} color="orange"/><MetricCard label="Healthy stock" value={data.length-reorder.length} detail="Above reorder point" icon={CheckCircle2} color="green"/><MetricCard label="Units to order" value={short(reorder.reduce((a,p)=>a+p.recommended_order,0))} detail="Sum of suggested quantities" icon={ShoppingBag} color="purple"/></div>
    <section className="panel"><div className="inventory-toolbar"><PanelHeading title="Inventory health" subtitle="Suggested quantities use recent 30-day demand and a simple safety-stock rule."/><div className="search-box"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search product or category"/></div></div>
      <div className="table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Current stock</th><th>Avg. daily demand</th><th>Reorder point</th><th>Suggested order</th><th>Status</th></tr></thead><tbody>{data.map(p=><tr key={p.product_id}><td><div className="product-cell"><div className="product-icon"><Boxes size={15}/></div><b>{p.product_id}</b></div></td><td>{p.category}</td><td><div className="stock-cell"><b>{p.stock}</b><div className="stock-track"><i style={{width:`${Math.min(100,p.stock/180*100)}%`}}/></div></div></td><td>{p.avg_daily_demand}</td><td>{p.reorder_point}</td><td><b className={p.recommended_order ? 'order-number' : ''}>{p.recommended_order}</b></td><td><Status value={p.status}/></td></tr>)}</tbody></table>{data.length===0&&<Empty text="No products match your search."/>}</div>
    </section><div className="notice"><AlertTriangle size={18}/><div><b>Planning note</b><p>Reorder points are illustrative rules. Before using them operationally, incorporate supplier lead times, minimum order quantities, service levels, seasonality, and actual forecast validation.</p></div></div></>
}

function DataPage({onUpload, message, onRefresh}) {
  return <><div className="content-grid data-grid"><section className="panel upload-panel"><div className="upload-icon"><CloudUpload size={28}/></div><h2>Import retail sales data</h2><p>Upload a CSV file to replace the in-memory demo sales dataset and refresh your analytics.</p><label className="upload-button"><CloudUpload size={17}/> Choose CSV file<input type="file" accept=".csv,text/csv" onChange={onUpload}/></label>{message&&<div className="upload-message">{message}</div>}<div className="upload-note">CSV only · Keep a backup of your demo data before uploading.</div></section>
    <section className="panel"><PanelHeading title="Required CSV columns" subtitle="Your file should contain these fields"/><div className="column-list">{[['date','Sale date; for example 2026-09-01'],['product_id','Unique product identifier'],['quantity','Units sold in this transaction'],['unit_price','Price per unit']].map(([k,v])=><div key={k}><code>{k}</code><span>{v}</span><CheckCircle2 size={16}/></div>)}</div><div className="optional-fields"><b>Optional fields</b><p><code>customer_id</code> · <code>category</code> · <code>stock</code></p></div><button className="secondary-button" onClick={onRefresh}><RefreshCw size={15}/> Refresh analytics</button></section></div>
    <section className="panel"><PanelHeading title="Data handling checklist" subtitle="Before connecting real business data"/><div className="checklist"><div><CheckCircle2 size={18}/><span>Validate column names, types, missing values and duplicates.</span></div><div><CheckCircle2 size={18}/><span>Anonymize customer identifiers and avoid uploading personal information.</span></div><div><CheckCircle2 size={18}/><span>Store production data in a database; this demo keeps uploaded data in memory.</span></div><div><CheckCircle2 size={18}/><span>Add access control, audit logging and backup policies before production use.</span></div></div></section></>
}

export default App
