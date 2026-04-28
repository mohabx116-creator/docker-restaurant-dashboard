import { useEffect, useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import KpiCard from "./components/KpiCard";
import AnalyticsChart from "./components/AnalyticsChart";
import OrdersTable from "./components/OrdersTable";
import OrderForm from "./components/OrderForm";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const ORDER_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "preparing", label: "Preparing" },
  { value: "completed", label: "Completed" },
];

const STATUS_LABELS = ORDER_STATUSES.reduce((acc, status) => {
  acc[status.value] = status.label;
  return acc;
}, {});

const PAGE_META = {
  overview: {
    title: "Overview",
    subtitle:
      "Welcome back. Here is what is happening in your restaurant today.",
  },
  orders: {
    title: "Orders",
    subtitle:
      "Manage live orders, update service status, and keep the kitchen workflow moving.",
  },
  analytics: {
    title: "Analytics",
    subtitle:
      "Track revenue, service completion, and customer performance from protected account data.",
  },
  customers: {
    title: "Customers",
    subtitle:
      "Review customer value, order frequency, and revenue contribution from live orders.",
  },
  settings: {
    title: "Settings",
    subtitle:
      "Check account details, workspace information, and local environment configuration.",
  },
};

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

const getCustomerLabel = (value) => {
  const customer = String(value || "").trim();
  return customer || "Walk-in Guest";
};

const getDateValue = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

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
  const [activePage, setActivePage] = useState("overview");
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
      setActivePage("overview");
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
    setActivePage("overview");
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
      setActivePage("orders");
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
    setActivePage("orders");
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

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const hasActiveFilters =
    normalizedSearchTerm !== "" || statusFilter !== "all";

  const filteredOrders = orders.filter((order) => {
    const orderName = getCustomerLabel(order.customer_name).toLowerCase();
    const orderStatusValue = getOrderStatus(order.status);
    const matchesSearch = orderName.includes(normalizedSearchTerm);
    const matchesStatus =
      statusFilter === "all" || orderStatusValue === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const sortedFilteredOrders = [...filteredOrders].sort((a, b) => {
    const dateDifference = getDateValue(b.created_at) - getDateValue(a.created_at);

    if (dateDifference !== 0) {
      return dateDifference;
    }

    return Number(b.id || 0) - Number(a.id || 0);
  });

  const groupedRevenueData = Object.values(
    sortedFilteredOrders.reduce((acc, order) => {
      const key = getCustomerLabel(order.customer_name);

      if (!acc[key]) {
        acc[key] = { name: key, total: 0 };
      }

      acc[key].total += Number(order.total_price);
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total);

  const customersData = Object.values(
    sortedFilteredOrders.reduce((acc, order) => {
      const key = getCustomerLabel(order.customer_name);
      const amount = Number(order.total_price);

      if (!acc[key]) {
        acc[key] = {
          name: key,
          totalOrders: 0,
          totalRevenue: 0,
          averageOrder: 0,
          highestOrder: 0,
          lastOrder: order.created_at,
        };
      }

      acc[key].totalOrders += 1;
      acc[key].totalRevenue += amount;
      acc[key].highestOrder = Math.max(acc[key].highestOrder, amount);

      if (getDateValue(order.created_at) > getDateValue(acc[key].lastOrder)) {
        acc[key].lastOrder = order.created_at;
      }

      return acc;
    }, {})
  )
    .map((customer) => ({
      ...customer,
      averageOrder: customer.totalOrders
        ? customer.totalRevenue / customer.totalOrders
        : 0,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  const totalRevenue = sortedFilteredOrders.reduce(
    (sum, order) => sum + Number(order.total_price),
    0
  );
  const totalOrders = sortedFilteredOrders.length;
  const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const completedOrders = sortedFilteredOrders.filter(
    (order) => getOrderStatus(order.status) === "completed"
  ).length;
  const pendingOrders = sortedFilteredOrders.filter(
    (order) => getOrderStatus(order.status) === "pending"
  ).length;
  const preparingOrders = sortedFilteredOrders.filter(
    (order) => getOrderStatus(order.status) === "preparing"
  ).length;
  const uniqueCustomers = customersData.length;
  const highestOrderValue =
    totalOrders > 0
      ? Math.max(
          ...sortedFilteredOrders.map((order) => Number(order.total_price || 0))
        )
      : 0;
  const completionRate =
    totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
  const liveAttentionCount = pendingOrders + preparingOrders;
  const topCustomer = groupedRevenueData[0] || null;
  const topCustomers = customersData.slice(0, 5);
  const recentOrders = sortedFilteredOrders.slice(0, 5);
  const highestOrders = [...sortedFilteredOrders]
    .sort((a, b) => Number(b.total_price) - Number(a.total_price))
    .slice(0, 5);
  const repeatLeader = [...customersData].sort(
    (a, b) => b.totalOrders - a.totalOrders || b.totalRevenue - a.totalRevenue
  )[0] || null;
  const averageCustomerRevenue =
    uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0;

  const statusBreakdown = ORDER_STATUSES.map((status) => {
    const count = sortedFilteredOrders.filter(
      (order) => getOrderStatus(order.status) === status.value
    ).length;

    return {
      ...status,
      count,
      percentage: totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0,
    };
  });

  const primaryKpis = [
    {
      icon: "RV",
      label: "Total Revenue",
      value: formatCurrency(totalRevenue),
      badge: `${uniqueCustomers} guests`,
      tone: "warm",
      description: "Revenue in the current view.",
    },
    {
      icon: "OR",
      label: "Total Orders",
      value: totalOrders,
      badge: hasActiveFilters ? "Filtered" : "Live",
      tone: "neutral",
      description: "Protected orders in scope.",
    },
    {
      icon: "AV",
      label: "Average Order",
      value: formatCurrency(averageOrder),
      badge: `${uniqueCustomers || 0} customers`,
      tone: "info",
      description: "Average ticket value.",
    },
    {
      icon: "CM",
      label: "Completed Orders",
      value: completedOrders,
      badge: `${completionRate}% closed`,
      tone: "success",
      description: "Closed by the kitchen team.",
    },
  ];

  const secondaryKpis = [
    {
      icon: "PN",
      label: "Pending Orders",
      value: pendingOrders,
      badge: totalOrders ? `${Math.round((pendingOrders / totalOrders) * 100)}%` : "0%",
      tone: "warm",
      description: "Waiting for kitchen action.",
    },
    {
      icon: "PR",
      label: "Preparing Orders",
      value: preparingOrders,
      badge: totalOrders
        ? `${Math.round((preparingOrders / totalOrders) * 100)}%`
        : "0%",
      tone: "info",
      description: "In active preparation.",
    },
    {
      icon: "CU",
      label: "Active Customers",
      value: uniqueCustomers,
      badge: topCustomer ? "Top guest live" : "Awaiting data",
      tone: "neutral",
      description: "Unique customers in view.",
    },
    {
      icon: "MX",
      label: "Highest Order",
      value: formatCurrency(highestOrderValue),
      badge: topCustomer ? topCustomer.name : "No leader yet",
      tone: "success",
      description: "Highest order in scope.",
    },
  ];

  const customerKpis = [
    {
      icon: "CU",
      label: "Unique Customers",
      value: uniqueCustomers,
      badge: hasActiveFilters ? "Filtered view" : "Live base",
      tone: "neutral",
      description: "Customers derived from protected orders.",
    },
    {
      icon: "TP",
      label: "Top Customer",
      value: topCustomer ? formatCurrency(topCustomer.total) : formatCurrency(0),
      badge: topCustomer ? topCustomer.name : "No customer yet",
      tone: "warm",
      description: "Highest customer revenue contribution.",
    },
    {
      icon: "AV",
      label: "Average Customer Value",
      value: formatCurrency(averageCustomerRevenue),
      badge: repeatLeader ? repeatLeader.name : "No repeat guest",
      tone: "info",
      description: "Revenue per customer in the current view.",
    },
    {
      icon: "RT",
      label: "Most Frequent Customer",
      value: repeatLeader ? repeatLeader.totalOrders : 0,
      badge: repeatLeader ? repeatLeader.name : "No visits yet",
      tone: "success",
      description: "Highest order count among current customers.",
    },
  ];

  const handleExportSnapshot = () => {
    if (sortedFilteredOrders.length === 0) return;

    const header = ["Order ID", "Customer", "Status", "Amount", "Created At"];
    const rows = sortedFilteredOrders.map((order) => [
      order.id,
      `"${String(getCustomerLabel(order.customer_name)).replace(/"/g, '""')}"`,
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

  const isBusy = isSavingOrder || deletingOrderId !== null;
  const displayUser = currentUser || {
    name: "Restaurant Manager",
    email: "manager@dashboard.local",
  };
  const currentPage = PAGE_META[activePage];

  const renderFiltersPanel = (description) => (
    <section className="filters-panel">
      <div>
        <h2>Search & Filters</h2>
        <p>{description}</p>
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
  );

  const renderPageHeroAside = () => {
    if (activePage === "orders") {
      return (
        <div className="overview-note-card">
          <span className="note-label">Active order workflow</span>
          <strong>
            {editingOrderId
              ? `Editing order #${editingOrderId}`
              : `${sortedFilteredOrders.length} visible orders`}
          </strong>
          <small>
            Search from the topbar and apply status filters without interrupting
            CRUD actions.
          </small>
        </div>
      );
    }

    if (activePage === "analytics") {
      return (
        <div className="overview-note-card">
          <span className="note-label">Revenue highlight</span>
          <strong>
            {topCustomer
              ? `${topCustomer.name} leads with ${formatCurrency(topCustomer.total)}`
              : "Revenue insights will appear once orders are added."}
          </strong>
          <small>
            All charts and breakdowns update from the same filtered user-specific
            orders.
          </small>
        </div>
      );
    }

    if (activePage === "customers") {
      return (
        <div className="overview-note-card">
          <span className="note-label">Customer pulse</span>
          <strong>
            {uniqueCustomers
              ? `${uniqueCustomers} customers in view`
              : "No customers match the current filters."}
          </strong>
          <small>
            Customer rollups are derived directly from protected order history.
          </small>
        </div>
      );
    }

    if (activePage === "settings") {
      return (
        <div className="overview-note-card">
          <span className="note-label">Workspace status</span>
          <strong>Local Docker profile ready</strong>
          <small>
            Frontend 5173, backend 3001, PostgreSQL 5432. Auth and CSV export
            remain active.
          </small>
        </div>
      );
    }

    return (
      <div className="overview-note-card">
        <span className="note-label">Live kitchen queue</span>
        <strong>{liveAttentionCount} orders need attention</strong>
        <small>
          Pending and preparing orders update in real time from your protected
          account data.
        </small>
      </div>
    );
  };

  const renderPageHero = () => (
    <section className={`overview-hero page-hero page-${activePage}-hero`}>
      <div className="page-hero-copy">
        <span className="hero-eyebrow">{currentPage.title}</span>
        <h1>{currentPage.title}</h1>
        <p>{currentPage.subtitle}</p>
      </div>

      <div className="overview-actions page-hero-aside">{renderPageHeroAside()}</div>
    </section>
  );

  const renderOverviewPage = () => (
    <>
      {renderPageHero()}

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

      {renderFiltersPanel(
        "Topbar search and status filters update the service snapshot, KPI cards, chart, and recent order summary."
      )}

      <section className="dashboard-grid">
        <div className="dashboard-column-left">
          <div className="panel-card">
            <div className="panel-header">
              <div>
                <h2>Revenue Performance</h2>
                <p>
                  Grouped customer revenue using live order data from the current
                  account.
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
              <span className="widget-icon">INV</span>
              <span className="widget-chip">Premium</span>
            </div>
            <h3>Smart Inventory</h3>
            <p>
              Inventory forecasting is ready for the next phase. Right now,
              <strong> {liveAttentionCount}</strong> live orders are shaping
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
              <span className="widget-icon">TOP</span>
              <span className="widget-chip">Favorites</span>
            </div>
            <h3>Signature Favorites</h3>
            <p>
              Top customers ranked by revenue contribution in the current filtered
              view.
            </p>
            <div className="mini-list">
              {topCustomers.length === 0 ? (
                <p className="mini-empty">No customer revenue data available.</p>
              ) : (
                topCustomers.slice(0, 3).map((customer) => (
                  <div className="mini-list-row" key={customer.name}>
                    <span>{customer.name}</span>
                    <strong>{formatCurrency(customer.totalRevenue)}</strong>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="widget-card">
            <div className="widget-header">
              <span className="widget-icon">ACT</span>
              <span className="widget-chip info">Activity</span>
            </div>
            <h3>Customer Feedback</h3>
            <p>
              Recent account activity built from real protected orders while richer
              feedback modules remain a future upgrade.
            </p>
            <div className="activity-list">
              {recentOrders.length === 0 ? (
                <p className="mini-empty">No recent order activity yet.</p>
              ) : (
                recentOrders.slice(0, 3).map((order) => (
                  <div className="activity-row" key={order.id}>
                    <div>
                      <strong>{getCustomerLabel(order.customer_name)}</strong>
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

      <section className="summary-grid">
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <h2>Recent Orders</h2>
              <p>Latest protected orders from the current filtered service view.</p>
            </div>
            <span className="panel-chip">
              {recentOrders.length} of {totalOrders}
            </span>
          </div>

          {recentOrders.length === 0 ? (
            <p className="status-message">
              {hasActiveFilters
                ? "No recent orders match the current filters."
                : "No orders yet. Add an order to reveal recent activity."}
            </p>
          ) : (
            <div className="summary-list">
              {recentOrders.map((order) => (
                <div className="summary-row" key={order.id}>
                  <div className="summary-row-meta">
                    <strong>{getCustomerLabel(order.customer_name)}</strong>
                    <span>
                      #{order.id} · {formatDate(order.created_at)}
                    </span>
                  </div>
                  <div className="summary-row-end">
                    <strong>{formatCurrency(order.total_price)}</strong>
                    <span
                      className={`status-badge status-${getOrderStatus(
                        order.status
                      )}`}
                    >
                      {STATUS_LABELS[getOrderStatus(order.status)]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <div>
              <h2>Service Snapshot</h2>
              <p>Status distribution for the same live order set.</p>
            </div>
            <span className="panel-chip">Kitchen mix</span>
          </div>

          <div className="metric-list">
            {statusBreakdown.map((status) => (
              <div className="metric-row" key={status.value}>
                <div>
                  <strong>{status.label}</strong>
                  <small>{status.percentage}% of active view</small>
                </div>
                <span>{status.count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );

  const renderOrdersPage = () => (
    <>
      {renderPageHero()}

      {renderFiltersPanel(
        "Filter by customer name from the topbar and narrow the order queue by service status."
      )}

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
                ? `${sortedFilteredOrders.length} matching`
                : `${orders.length} total`}
            </span>
          </div>

          <OrdersTable
            orders={sortedFilteredOrders}
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
    </>
  );

  const renderAnalyticsPage = () => (
    <>
      {renderPageHero()}

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

      {renderFiltersPanel(
        "Analytics update from the same filtered protected orders, so every KPI and chart stays consistent."
      )}

      <section className="dashboard-grid">
        <div className="dashboard-column-left">
          <div className="panel-card">
            <div className="panel-header">
              <div>
                <h2>Revenue Performance</h2>
                <p>
                  Revenue grouped by customer from the currently visible user
                  orders.
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
          <div className="widget-card">
            <div className="widget-header">
              <span className="widget-icon">STS</span>
              <span className="widget-chip info">Breakdown</span>
            </div>
            <h3>Status Breakdown</h3>
            <p>Current order distribution across pending, preparing, and completed.</p>
            <div className="metric-list">
              {statusBreakdown.map((status) => (
                <div className="metric-row" key={status.value}>
                  <div>
                    <strong>{status.label}</strong>
                    <small>{status.percentage}% of visible orders</small>
                  </div>
                  <span>{status.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="widget-card">
            <div className="widget-header">
              <span className="widget-icon">TOP</span>
              <span className="widget-chip">Customers</span>
            </div>
            <h3>Top Customers</h3>
            <p>Customers ranked by total revenue in the current filtered view.</p>
            <div className="mini-list">
              {topCustomers.length === 0 ? (
                <p className="mini-empty">No customer analytics available yet.</p>
              ) : (
                topCustomers.map((customer) => (
                  <div className="mini-list-row" key={customer.name}>
                    <span>{customer.name}</span>
                    <strong>{formatCurrency(customer.totalRevenue)}</strong>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="widget-card">
            <div className="widget-header">
              <span className="widget-icon">MAX</span>
              <span className="widget-chip">Orders</span>
            </div>
            <h3>Highest Orders</h3>
            <p>Largest ticket values in the same filtered analytics snapshot.</p>
            <div className="summary-list">
              {highestOrders.length === 0 ? (
                <p className="mini-empty">No high-value orders available yet.</p>
              ) : (
                highestOrders.map((order) => (
                  <div className="summary-row" key={order.id}>
                    <div className="summary-row-meta">
                      <strong>{getCustomerLabel(order.customer_name)}</strong>
                      <span>#{order.id}</span>
                    </div>
                    <div className="summary-row-end">
                      <strong>{formatCurrency(order.total_price)}</strong>
                      <span>{formatDate(order.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );

  const renderCustomersPage = () => (
    <>
      {renderPageHero()}

      <section className="kpi-grid">
        {customerKpis.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </section>

      {renderFiltersPanel(
        "Customer rollups react to the current search term and status filter so the list stays aligned with active orders."
      )}

      <section className="panel-card customers-panel">
        <div className="panel-header">
          <div>
            <h2>Customer Directory</h2>
            <p>Derived directly from protected orders. No extra backend endpoint required.</p>
          </div>
          <span className="panel-chip">{customersData.length} customers</span>
        </div>

        {customersData.length === 0 ? (
          <p className="status-message">
            {hasActiveFilters
              ? "No customers match the active search and status filters."
              : "No customer data yet. Add orders to reveal customer insights."}
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="orders-table customers-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Total Orders</th>
                  <th>Total Revenue</th>
                  <th>Average Order</th>
                  <th>Highest Order</th>
                  <th>Last Order</th>
                </tr>
              </thead>
              <tbody>
                {customersData.map((customer) => (
                  <tr key={customer.name}>
                    <td>{customer.name}</td>
                    <td>{customer.totalOrders}</td>
                    <td>{formatCurrency(customer.totalRevenue)}</td>
                    <td>{formatCurrency(customer.averageOrder)}</td>
                    <td>{formatCurrency(customer.highestOrder)}</td>
                    <td>{formatDate(customer.lastOrder)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );

  const renderSettingsPage = () => (
    <>
      {renderPageHero()}

      <section className="settings-grid">
        <div className="panel-card settings-card">
          <div className="panel-header">
            <div>
              <h2>Account Snapshot</h2>
              <p>Logged-in account details from the active JWT session.</p>
            </div>
            <span className="panel-chip">Account</span>
          </div>

          <div className="details-list">
            <div className="detail-row">
              <span>Name</span>
              <strong>{displayUser.name}</strong>
            </div>
            <div className="detail-row">
              <span>Email</span>
              <strong>{displayUser.email}</strong>
            </div>
            <div className="detail-row">
              <span>Protected Orders</span>
              <strong>{orders.length}</strong>
            </div>
            <div className="detail-row">
              <span>Current View</span>
              <strong>{PAGE_META[activePage].title}</strong>
            </div>
          </div>

          <button
            type="button"
            className="logout-button settings-logout"
            onClick={handleLogout}
            disabled={isBusy}
          >
            Logout
          </button>
        </div>

        <div className="panel-card settings-card">
          <div className="panel-header">
            <div>
              <h2>Platform Stack</h2>
              <p>Current services used by the dashboard workspace.</p>
            </div>
            <span className="panel-chip">App Info</span>
          </div>

          <div className="details-list">
            <div className="detail-row">
              <span>Frontend</span>
              <strong>React + Vite</strong>
            </div>
            <div className="detail-row">
              <span>Backend</span>
              <strong>Node.js + Express</strong>
            </div>
            <div className="detail-row">
              <span>Database</span>
              <strong>PostgreSQL</strong>
            </div>
            <div className="detail-row">
              <span>Authentication</span>
              <strong>JWT + bcryptjs</strong>
            </div>
            <div className="detail-row">
              <span>Charts</span>
              <strong>Recharts</strong>
            </div>
          </div>
        </div>

        <div className="panel-card settings-card">
          <div className="panel-header">
            <div>
              <h2>Local Workspace</h2>
              <p>Operational details for the current local Docker workflow.</p>
            </div>
            <span className="panel-chip">Local</span>
          </div>

          <div className="details-list">
            <div className="detail-row">
              <span>Frontend Port</span>
              <strong>5173</strong>
            </div>
            <div className="detail-row">
              <span>Backend Port</span>
              <strong>3001</strong>
            </div>
            <div className="detail-row">
              <span>Database Port</span>
              <strong>5432</strong>
            </div>
            <div className="detail-row">
              <span>Deployment Mode</span>
              <strong>Local Docker Compose</strong>
            </div>
            <div className="detail-row">
              <span>Data Scope</span>
              <strong>User-specific orders only</strong>
            </div>
          </div>
        </div>
      </section>
    </>
  );

  const renderActivePage = () => {
    if (activePage === "orders") {
      return renderOrdersPage();
    }

    if (activePage === "analytics") {
      return renderAnalyticsPage();
    }

    if (activePage === "customers") {
      return renderCustomersPage();
    }

    if (activePage === "settings") {
      return renderSettingsPage();
    }

    return renderOverviewPage();
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
      <Sidebar
        currentUser={displayUser}
        activePage={activePage}
        onPageChange={setActivePage}
      />

      <main className="dashboard-main">
        <div className={`dashboard-content page-${activePage}`}>
          <Topbar
            currentUser={displayUser}
            pageTitle={currentPage.title}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onExport={handleExportSnapshot}
            onLogout={handleLogout}
            notificationCount={liveAttentionCount}
            isBusy={isBusy}
            canExport={sortedFilteredOrders.length > 0}
          />

          {ordersError && <p className="status-message error">{ordersError}</p>}

          {renderActivePage()}
        </div>
      </main>
    </div>
  );
}

export default App;
