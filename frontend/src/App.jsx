import { useEffect, useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import KpiCard from "./components/KpiCard";
import AnalyticsChart from "./components/AnalyticsChart";
import OrdersTable from "./components/OrdersTable";
import OrderForm from "./components/OrderForm";

const API_URL = "http://localhost:3001";

const ORDER_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "preparing", label: "Preparing" },
  { value: "completed", label: "Completed" },
];

const STATUS_LABELS = ORDER_STATUSES.reduce((acc, status) => {
  acc[status.value] = status.label;
  return acc;
}, {});

const parseStoredUser = () => {
  try {
    const rawUser = localStorage.getItem("restaurantUser");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
};

const getOrderStatus = (value) =>
  ORDER_STATUSES.some((status) => status.value === value) ? value : "pending";

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

const formatAxisCurrency = (value) => {
  const numericValue = Number(value || 0);

  if (numericValue >= 1000) {
    return `$${(numericValue / 1000).toFixed(1)}k`;
  }

  return `$${numericValue}`;
};

const formatDate = (value) => {
  if (!value) return "--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

function App() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [currentUser, setCurrentUser] = useState(parseStoredUser);
  const [orders, setOrders] = useState([]);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState(null);
  const [ordersError, setOrdersError] = useState("");

  const [email, setEmail] = useState("mohab@test.com");
  const [password, setPassword] = useState("123456");

  const [customerName, setCustomerName] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [orderStatus, setOrderStatus] = useState("pending");
  const [editingOrderId, setEditingOrderId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchOrders = async () => {
    if (!token) return null;

    setIsOrdersLoading(true);
    setOrdersError("");

    try {
      const res = await fetch(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load orders");
      }

      setOrders(data);
      return data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load orders";
      setOrdersError(message);
      return null;
    } finally {
      setIsOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
      return;
    }

    setOrders([]);
  }, [token]);

  const resetForm = () => {
    setCustomerName("");
    setTotalPrice("");
    setOrderStatus("pending");
    setEditingOrderId(null);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
  };

  const handleAuth = async (e) => {
    e.preventDefault();

    const url = isRegister
      ? `${API_URL}/auth/register`
      : `${API_URL}/auth/login`;
    const body = isRegister
      ? { name, email, password }
      : { email, password };

    setIsAuthLoading(true);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      if (isRegister) {
        alert("Account created successfully. Please login.");
        setIsRegister(false);
        setName("");
        setPassword("");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("restaurantUser", JSON.stringify(data.user || null));
      setCurrentUser(data.user || null);
      setToken(data.token);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Authentication failed";
      alert(message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("restaurantUser");
    setToken("");
    setCurrentUser(null);
    setOrders([]);
    setOrdersError("");
    resetForm();
    clearFilters();
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    const trimmedCustomerName = customerName.trim();
    if (!trimmedCustomerName) return;

    const isEditing = Boolean(editingOrderId);
    const url = isEditing
      ? `${API_URL}/orders/${editingOrderId}`
      : `${API_URL}/orders`;
    const method = isEditing ? "PUT" : "POST";

    setIsSavingOrder(true);

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customer_name: trimmedCustomerName,
          total_price: Number(totalPrice),
          status: getOrderStatus(orderStatus),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save order");
      }

      resetForm();
      await fetchOrders();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save order";
      alert(message);
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleEditOrder = (order) => {
    setEditingOrderId(order.id);
    setCustomerName(order.customer_name);
    setTotalPrice(String(order.total_price));
    setOrderStatus(getOrderStatus(order.status));
  };

  const handleDeleteOrder = async (id) => {
    const confirmDelete = window.confirm("Delete this order?");
    if (!confirmDelete) return;

    setDeletingOrderId(id);

    try {
      const res = await fetch(`${API_URL}/orders/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete order");
      }

      if (editingOrderId === id) {
        resetForm();
      }

      await fetchOrders();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete order";
      alert(message);
    } finally {
      setDeletingOrderId(null);
    }
  };

  const handleExportSnapshot = () => {
    if (filteredOrders.length === 0) return;

    const header = ["Order ID", "Customer", "Status", "Amount", "Created At"];
    const rows = filteredOrders.map((order) => [
      order.id,
      `"${String(order.customer_name || "").replace(/"/g, '""')}"`,
      STATUS_LABELS[getOrderStatus(order.status)],
      Number(order.total_price).toFixed(2),
      order.created_at || "",
    ]);

    const csv = [header, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `restaurant-snapshot-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const hasActiveFilters =
    normalizedSearchTerm !== "" || statusFilter !== "all";

  const filteredOrders = orders.filter((order) => {
    const orderName = String(order.customer_name || "").toLowerCase();
    const orderStatusValue = getOrderStatus(order.status);
    const matchesSearch = orderName.includes(normalizedSearchTerm);
    const matchesStatus =
      statusFilter === "all" || orderStatusValue === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const groupedRevenueData = Object.values(
    filteredOrders.reduce((acc, order) => {
      const key = order.customer_name;

      if (!acc[key]) {
        acc[key] = { name: key, total: 0 };
      }

      acc[key].total += Number(order.total_price);
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total);

  const totalRevenue = filteredOrders.reduce(
    (sum, order) => sum + Number(order.total_price),
    0
  );
  const totalOrders = filteredOrders.length;
  const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const completedOrders = filteredOrders.filter(
    (order) => getOrderStatus(order.status) === "completed"
  ).length;
  const pendingOrders = filteredOrders.filter(
    (order) => getOrderStatus(order.status) === "pending"
  ).length;
  const preparingOrders = filteredOrders.filter(
    (order) => getOrderStatus(order.status) === "preparing"
  ).length;
  const uniqueCustomers = new Set(
    filteredOrders.map((order) => String(order.customer_name || "").trim())
  ).size;
  const highestOrder =
    totalOrders > 0
      ? Math.max(...filteredOrders.map((order) => Number(order.total_price)))
      : 0;
  const completionRate =
    totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
  const topCustomer = groupedRevenueData[0] || null;
  const topCustomers = groupedRevenueData.slice(0, 3);
  const recentActivity = filteredOrders.slice(0, 3);
  const liveAttentionCount = pendingOrders + preparingOrders;

  const primaryKpis = [
    {
      icon: "💰",
      label: "Total Revenue",
      value: formatCurrency(totalRevenue),
      badge: `${uniqueCustomers} guests`,
      tone: "warm",
      description: "Revenue in the current view.",
    },
    {
      icon: "🧾",
      label: "Total Orders",
      value: totalOrders,
      badge: hasActiveFilters ? "Filtered" : "Live",
      tone: "neutral",
      description: "Protected orders in scope.",
    },
    {
      icon: "🍽️",
      label: "Average Order",
      value: formatCurrency(averageOrder),
      badge: `${uniqueCustomers || 0} customers`,
      tone: "info",
      description: "Average ticket value.",
    },
    {
      icon: "✅",
      label: "Completed Orders",
      value: completedOrders,
      badge: `${completionRate}% closed`,
      tone: "success",
      description: "Closed by the kitchen team.",
    },
  ];

  const secondaryKpis = [
    {
      icon: "⏳",
      label: "Pending Orders",
      value: pendingOrders,
      badge: totalOrders ? `${Math.round((pendingOrders / totalOrders) * 100)}%` : "0%",
      tone: "warm",
      description: "Waiting for kitchen action.",
    },
    {
      icon: "👨‍🍳",
      label: "Preparing Orders",
      value: preparingOrders,
      badge: totalOrders
        ? `${Math.round((preparingOrders / totalOrders) * 100)}%`
        : "0%",
      tone: "info",
      description: "In active preparation.",
    },
    {
      icon: "👥",
      label: "Active Customers",
      value: uniqueCustomers,
      badge: topCustomer ? "Top guest live" : "Awaiting data",
      tone: "neutral",
      description: "Unique customers in view.",
    },
    {
      icon: "⭐",
      label: "Highest Order",
      value: formatCurrency(highestOrder),
      badge: topCustomer ? topCustomer.name : "No leader yet",
      tone: "success",
      description: "Highest order in scope.",
    },
  ];

  const isBusy = isSavingOrder || deletingOrderId !== null;
  const displayUser = currentUser || {
    name: "Restaurant Manager",
    email: "manager@dashboard.local",
  };

  if (!token) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="auth-brand">
            <div className="brand-mark">RD</div>
            <div>
              <strong>Restaurant Dashboard</strong>
              <span>Dashboard Lite</span>
            </div>
          </div>

          <h1>{isRegister ? "Create Account" : "Welcome Back"}</h1>
          <p>
            {isRegister
              ? "Create your account to start managing service, revenue, and guest flow."
              : "Login to access your restaurant operations workspace."}
          </p>

          <form onSubmit={handleAuth} className="auth-form">
            {isRegister && (
              <input
                type="text"
                value={name}
                placeholder="Full name"
                onChange={(e) => setName(e.target.value)}
                disabled={isAuthLoading}
                required
              />
            )}

            <input
              type="email"
              value={email}
              placeholder="Email address"
              onChange={(e) => setEmail(e.target.value)}
              disabled={isAuthLoading}
              required
            />

            <input
              type="password"
              value={password}
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
              disabled={isAuthLoading}
              required
            />

            <button type="submit" disabled={isAuthLoading}>
              {isAuthLoading
                ? isRegister
                  ? "Creating Account..."
                  : "Logging in..."
                : isRegister
                  ? "Create Account"
                  : "Login"}
            </button>
          </form>

          <p
            className="auth-switch"
            onClick={() => !isAuthLoading && setIsRegister(!isRegister)}
          >
            {isRegister
              ? "Already have an account? Login"
              : "Don't have an account? Register"}
          </p>
        </section>
      </main>
    );
  }

  return (
    <div className="dashboard-shell">
      <Sidebar currentUser={displayUser} />

      <main className="dashboard-main">
        <div className="dashboard-content">
          <Topbar
            currentUser={displayUser}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onExport={handleExportSnapshot}
            onLogout={handleLogout}
            notificationCount={liveAttentionCount}
            isBusy={isBusy}
            canExport={filteredOrders.length > 0}
          />

          {ordersError && <p className="status-message error">{ordersError}</p>}

          <section className="overview-hero">
            <div>
              <span className="hero-eyebrow">Overview</span>
              <h1>Overview</h1>
              <p>
                Welcome back. Here&apos;s what&apos;s happening in your restaurant
                today.
              </p>
            </div>

            <div className="overview-actions">
              <div className="overview-note-card">
                <span className="note-label">Live kitchen queue</span>
                <strong>{liveAttentionCount} orders need attention</strong>
                <small>
                  Pending and preparing orders update in real time from your
                  protected account data.
                </small>
              </div>
            </div>
          </section>

          <section className="kpi-grid">
            {primaryKpis.map((card) => (
              <KpiCard key={card.label} {...card} />
            ))}
          </section>

          <section className="secondary-kpi-grid">
            {secondaryKpis.map((card) => (
              <KpiCard key={card.label} compact {...card} />
            ))}
          </section>

          <section className="filters-panel">
            <div>
              <h2>Search & Filters</h2>
              <p>
                The topbar search filters customer names. Status filters also
                update the chart, KPIs, and orders table.
              </p>
            </div>

            <div className="filters-controls">
              <label className="filter-field">
                <span>Status</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  {ORDER_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                className="secondary-button"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
              >
                Clear Filters
              </button>
            </div>

            <div className="active-filters">
              <span className="filter-chip">
                Search: {searchTerm.trim() ? searchTerm.trim() : "All customers"}
              </span>
              <span className="filter-chip">
                Status:{" "}
                {statusFilter === "all"
                  ? "All statuses"
                  : STATUS_LABELS[getOrderStatus(statusFilter)]}
              </span>
            </div>
          </section>

          <section className="dashboard-grid">
            <div className="dashboard-column-left">
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <h2>Revenue Performance</h2>
                    <p>
                      Grouped customer revenue using live order data from the
                      current account.
                    </p>
                  </div>
                  <span className="panel-chip">Revenue by customer</span>
                </div>

                <AnalyticsChart
                  data={groupedRevenueData}
                  isLoading={isOrdersLoading}
                  hasActiveFilters={hasActiveFilters}
                  formatCurrency={formatCurrency}
                  formatAxisCurrency={formatAxisCurrency}
                />
              </div>
            </div>

            <div className="dashboard-column-right">
              <div className="widget-card premium-card">
                <div className="widget-header">
                  <span className="widget-icon">⚙️</span>
                  <span className="widget-chip">Premium</span>
                </div>
                <h3>Smart Inventory</h3>
                <p>
                  Inventory forecasting is ready for the next phase. Right now,
                  {` `}
                  <strong>{liveAttentionCount}</strong> live orders are shaping
                  kitchen demand.
                </p>
                <div className="widget-metrics">
                  <div>
                    <span>Pending</span>
                    <strong>{pendingOrders}</strong>
                  </div>
                  <div>
                    <span>Preparing</span>
                    <strong>{preparingOrders}</strong>
                  </div>
                </div>
              </div>

              <div className="widget-card">
                <div className="widget-header">
                  <span className="widget-icon">🥇</span>
                  <span className="widget-chip neutral">Favorites</span>
                </div>
                <h3>Signature Favorites</h3>
                <p>
                  Top customers ranked by revenue contribution in the current
                  filtered view.
                </p>
                <div className="mini-list">
                  {topCustomers.length === 0 ? (
                    <p className="mini-empty">No customer revenue data available.</p>
                  ) : (
                    topCustomers.map((customer) => (
                      <div className="mini-list-row" key={customer.name}>
                        <span>{customer.name}</span>
                        <strong>{formatCurrency(customer.total)}</strong>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="widget-card">
                <div className="widget-header">
                  <span className="widget-icon">📝</span>
                  <span className="widget-chip info">Activity</span>
                </div>
                <h3>Customer Feedback</h3>
                <p>
                  Recent account activity built from real protected orders while
                  richer feedback modules remain a future upgrade.
                </p>
                <div className="activity-list">
                  {recentActivity.length === 0 ? (
                    <p className="mini-empty">No recent order activity yet.</p>
                  ) : (
                    recentActivity.map((order) => (
                      <div className="activity-row" key={order.id}>
                        <div>
                          <strong>{order.customer_name}</strong>
                          <small>{formatDate(order.created_at)}</small>
                        </div>
                        <span
                          className={`status-badge status-${getOrderStatus(
                            order.status
                          )}`}
                        >
                          {STATUS_LABELS[getOrderStatus(order.status)]}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="operations-grid">
            <div className="panel-card table-panel">
              <div className="panel-header">
                <div>
                  <h2>Orders</h2>
                  <p>
                    A polished operational table backed by the same protected CRUD
                    flow.
                  </p>
                </div>
                <span className="panel-chip">
                  {hasActiveFilters
                    ? `${filteredOrders.length} matching`
                    : `${orders.length} total`}
                </span>
              </div>

              <OrdersTable
                orders={filteredOrders}
                totalOrders={orders.length}
                hasActiveFilters={hasActiveFilters}
                editingOrderId={editingOrderId}
                deletingOrderId={deletingOrderId}
                isBusy={isBusy}
                isLoading={isOrdersLoading}
                onEdit={handleEditOrder}
                onDelete={handleDeleteOrder}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                getOrderStatus={getOrderStatus}
                statusLabels={STATUS_LABELS}
              />
            </div>

            <div className="form-column">
              <OrderForm
                editingOrderId={editingOrderId}
                customerName={customerName}
                totalPrice={totalPrice}
                orderStatus={orderStatus}
                onCustomerNameChange={setCustomerName}
                onTotalPriceChange={setTotalPrice}
                onOrderStatusChange={setOrderStatus}
                onSubmit={handleSubmitOrder}
                onCancel={resetForm}
                isSavingOrder={isSavingOrder}
                orderStatuses={ORDER_STATUSES}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
