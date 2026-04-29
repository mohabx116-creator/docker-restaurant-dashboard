import { useState, useEffect, useRef } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import KpiCard from "./components/KpiCard";
import AnalyticsChart from "./components/AnalyticsChart";
import OrdersTable from "./components/OrdersTable";
import OrderForm from "./components/OrderForm";
import BottomNav from "./components/BottomNav";
import ProductsGrid from "./components/ProductsGrid";
import ProductModal from "./components/ProductModal";
import ToastStack from "./components/ToastStack";
import ConfirmDialog from "./components/ConfirmDialog";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const ORDER_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "preparing", label: "Preparing" },
  { value: "completed", label: "Completed" },
];

const PRODUCT_CATEGORIES = [
  "Burgers",
  "Pizzas",
  "Pasta",
  "Salads",
  "Desserts",
  "Drinks",
];

const STATUS_LABELS = ORDER_STATUSES.reduce((acc, status) => {
  acc[status.value] = status.label;
  return acc;
}, {});

const PAGE_META = {
  overview: {
    title: "Dashboard Overview",
    navTitle: "Overview",
    eyebrow: "Overview",
    subtitle: "Welcome back. Here's what's happening in your restaurant today.",
  },
  products: {
    title: "Products / Menu",
    navTitle: "Products",
    eyebrow: "Menu management",
    subtitle: "Manage food items, pricing, categories, and availability.",
  },
  cart: {
    title: "Order Cart",
    navTitle: "Cart",
    eyebrow: "Checkout workspace",
    subtitle: "Review selected menu items, adjust quantities, and create a real order.",
  },
  orders: {
    title: "Orders",
    navTitle: "Orders",
    eyebrow: "Orders",
    subtitle:
      "Manage live orders, update service status, and keep the kitchen workflow moving.",
  },
  analytics: {
    title: "Analytics",
    navTitle: "Analytics",
    eyebrow: "Analytics",
    subtitle:
      "Track revenue, service completion, and customer performance from protected account data.",
  },
  customers: {
    title: "Customers",
    navTitle: "Customers",
    eyebrow: "Customers",
    subtitle:
      "Review customer value, order frequency, and revenue contribution from live orders.",
  },
  settings: {
    title: "Settings",
    navTitle: "Settings",
    eyebrow: "Settings",
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
  return numericValue >= 1000
    ? `$${(numericValue / 1000).toFixed(1)}k`
    : `$${numericValue}`;
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

const formatProductAvailability = (value) => (value ? "Available" : "Out of Stock");

const getFallbackProductImage = () => "/products/smokehouse-royale-burger.jpg";

function App() {
  const toastIdRef = useRef(0);
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [currentUser, setCurrentUser] = useState(parseStoredUser);
  const [activePage, setActivePage] = useState("overview");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartCustomerName, setCartCustomerName] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [isCartMutating, setIsCartMutating] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState(null);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [togglingProductId, setTogglingProductId] = useState(null);

  const [ordersError, setOrdersError] = useState("");
  const [productsError, setProductsError] = useState("");
  const [cartError, setCartError] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [orderStatus, setOrderStatus] = useState("pending");
  const [editingOrderId, setEditingOrderId] = useState(null);

  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    category: PRODUCT_CATEGORIES[0],
    image_url: getFallbackProductImage(),
    is_available: true,
  });

  const [ordersSearchQuery, setOrdersSearchQuery] = useState("");
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [cartSearchQuery, setCartSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAvailability, setSelectedAvailability] = useState("all");
  const [ordersSortBy, setOrdersSortBy] = useState("newest");
  const [sortBy, setSortBy] = useState("name-asc");

  const addToast = (title, message, type = "info") => {
    toastIdRef.current += 1;
    const id = `toast-${toastIdRef.current}`;
    setToasts((currentToasts) => [...currentToasts, { id, title, message, type }]);

    window.setTimeout(() => {
      setToasts((currentToasts) =>
        currentToasts.filter((toast) => toast.id !== id)
      );
    }, 3600);
  };

  const dismissToast = (id) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id)
    );
  };

  const expireSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("restaurantUser");
    setToken("");
    setCurrentUser(null);
    setOrders([]);
    setProducts([]);
    setCartItems([]);
    setOrdersError("");
    setProductsError("");
    setCartError("");
    setCartError("");
    setActivePage("overview");
    setIsMobileSidebarOpen(false);
    setConfirmDialog(null);
    setProductFormOpen(false);
    setCartCustomerName("");
    addToast("Session expired", "Session expired. Please login again.", "error");
  };

  const apiRequest = async (path, options = {}) => {
    const { method = "GET", body, auth = true } = options;
    const headers = {};

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    if (auth && token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const responseText = await response.text();
    let data = null;

    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch {
        data = null;
      }
    }

    if (!response.ok) {
      if (auth && (response.status === 401 || response.status === 403)) {
        expireSession();
      }

      throw new Error(data?.message || "Request failed");
    }

    return data;
  };

  const getDefaultImageForCategory = (category, productList = products) => {
    const match = productList.find(
      (product) => product.category === category && product.image_url
    );

    return match?.image_url || productList[0]?.image_url || getFallbackProductImage();
  };

  const createEmptyProductForm = (category = PRODUCT_CATEGORIES[0]) => ({
    name: "",
    description: "",
    price: "",
    category,
    image_url: getDefaultImageForCategory(category),
    is_available: true,
  });

  const resetOrderForm = () => {
    setCustomerName("");
    setTotalPrice("");
    setOrderStatus("pending");
    setEditingOrderId(null);
  };

  const resetProductForm = (category = PRODUCT_CATEGORIES[0]) => {
    setProductForm(createEmptyProductForm(category));
    setEditingProduct(null);
  };

  const clearOrderFilters = () => {
    setOrdersSearchQuery("");
    setStatusFilter("all");
  };

  const clearProductFilters = () => {
    setProductSearchQuery("");
    setSelectedCategory("all");
    setSelectedAvailability("all");
    setSortBy("name-asc");
  };

  const applyCartResponse = (data) => {
    setCartItems(Array.isArray(data?.items) ? data.items : []);
    setCartError("");
  };

  const getCartQuantity = (productId) => {
    const item = cartItems.find((cartItem) => cartItem.product_id === productId);
    return item ? item.quantity : 0;
  };

  const getCartItemsCount = () =>
    cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = async (product) => {
    if (!product.is_available) {
      addToast("Item unavailable", `${product.name} is currently out of stock.`, "error");
      return;
    }

    setIsCartMutating(true);

    try {
      const data = await apiRequest("/cart/items", {
        method: "POST",
        body: { product_id: product.id, quantity: 1 },
      });
      applyCartResponse(data);
      addToast(
        "Added to cart",
        `${product.name} was added to the order cart.`,
        "success"
      );
    } catch (error) {
      addToast(
        "Cart update failed",
        error instanceof Error ? error.message : "Failed to add item to cart",
        "error"
      );
    } finally {
      setIsCartMutating(false);
    }
  };

  const fetchCart = async () => {
    if (!token) return;

    setIsCartLoading(true);
    setCartError("");

    try {
      const data = await apiRequest("/cart");
      applyCartResponse(data);
    } catch (error) {
      setCartError(error instanceof Error ? error.message : "Failed to load cart");
    } finally {
      setIsCartLoading(false);
    }
  };

  const updateCartItem = async (productId, quantity) => {
    setIsCartMutating(true);

    try {
      const data = await apiRequest(`/cart/items/${productId}`, {
        method: "PATCH",
        body: { quantity },
      });
      applyCartResponse(data);
    } catch (error) {
      addToast(
        "Cart update failed",
        error instanceof Error ? error.message : "Failed to update cart",
        "error"
      );
    } finally {
      setIsCartMutating(false);
    }
  };

  const increaseCartItem = (productId) => {
    const item = cartItems.find((cartItem) => cartItem.product_id === productId);
    if (!item) return;
    updateCartItem(productId, item.quantity + 1);
  };

  const decreaseCartItem = (productId) => {
    const item = cartItems.find((cartItem) => cartItem.product_id === productId);
    if (!item) return;
    updateCartItem(productId, item.quantity - 1);
  };

  const removeCartItem = async (productId) => {
    setIsCartMutating(true);

    try {
      const data = await apiRequest(`/cart/items/${productId}`, { method: "DELETE" });
      applyCartResponse(data);
    } catch (error) {
      addToast(
        "Cart update failed",
        error instanceof Error ? error.message : "Failed to remove cart item",
        "error"
      );
    } finally {
      setIsCartMutating(false);
    }
  };

  const clearCart = async () => {
    if (cartItems.length === 0) return;

    setIsCartMutating(true);

    try {
      const data = await apiRequest("/cart", { method: "DELETE" });
      applyCartResponse(data);
    } catch (error) {
      addToast(
        "Cart update failed",
        error instanceof Error ? error.message : "Failed to clear cart",
        "error"
      );
    } finally {
      setIsCartMutating(false);
    }
  };

  const handleCheckoutCart = async () => {
    const trimmedCustomerName = cartCustomerName.trim();

    if (!trimmedCustomerName || cartItems.length === 0) return;

    setIsCheckingOut(true);

    try {
      await apiRequest("/orders/cart", {
        method: "POST",
        body: { customer_name: trimmedCustomerName },
      });

      await fetchCart();
      await fetchOrders();
      setCartCustomerName("");
      setIsCartOpen(false);
      setActivePage("orders");

      addToast(
        "Order created",
        "The cart was converted into a real order successfully.",
        "success"
      );
    } catch (error) {
      addToast(
        "Checkout failed",
        error instanceof Error ? error.message : "Failed to create order from cart",
        "error"
      );
    } finally {
      setIsCheckingOut(false);
    }
  };

  const fetchOrders = async () => {
    if (!token) return;

    setIsOrdersLoading(true);
    setOrdersError("");

    try {
      const data = await apiRequest("/orders");
      setOrders(data || []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load orders";
      setOrdersError(message);
    } finally {
      setIsOrdersLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (!token) return;

    setIsProductsLoading(true);
    setProductsError("");

    try {
      const data = await apiRequest("/products");
      setProducts(data || []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load products";
      setProductsError(message);
    } finally {
      setIsProductsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    const loadTimer = window.setTimeout(() => {
      fetchOrders();
      fetchProducts();
      fetchCart();
    }, 0);

    return () => window.clearTimeout(loadTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const shouldLockBody =
      isMobileSidebarOpen || productFormOpen || isCartOpen || Boolean(confirmDialog);

    if (!shouldLockBody) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [confirmDialog, isCartOpen, isMobileSidebarOpen, productFormOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleAuth = async (event) => {
    event.preventDefault();
    setIsAuthLoading(true);

    try {
      const data = await apiRequest(
        isRegister ? "/auth/register" : "/auth/login",
        {
          method: "POST",
          auth: false,
          body: isRegister ? { name, email, password } : { email, password },
        }
      );

      if (isRegister) {
        setIsRegister(false);
        setName("");
        setPassword("");
        addToast(
          "Account created",
          "Your account is ready. Login to access the dashboard.",
          "success"
        );
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("restaurantUser", JSON.stringify(data.user || null));
      setCurrentUser(data.user || null);
      setToken(data.token);
      setActivePage("overview");
      addToast(
        "Welcome back",
        "Signed in successfully. Live orders and menu data are now available.",
        "success"
      );
    } catch (error) {
      addToast(
        "Authentication failed",
        error instanceof Error ? error.message : "Authentication failed",
        "error"
      );
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
    setProducts([]);
    setOrdersError("");
    setProductsError("");
    setActivePage("overview");
    setIsMobileSidebarOpen(false);
    setConfirmDialog(null);
    setProductFormOpen(false);
    resetOrderForm();
    resetProductForm();
    clearOrderFilters();
    clearProductFilters();
    setCartSearchQuery("");
    setCartItems([]);
    setIsCartOpen(false);
    setCartCustomerName("");
  };

  const handleSubmitOrder = async (event) => {
    event.preventDefault();

    const trimmedCustomerName = customerName.trim();
    if (!trimmedCustomerName) return;

    setIsSavingOrder(true);

    try {
      const isEditing = Boolean(editingOrderId);
      await apiRequest(isEditing ? `/orders/${editingOrderId}` : "/orders", {
        method: isEditing ? "PUT" : "POST",
        body: {
          customer_name: trimmedCustomerName,
          total_price: Number(totalPrice),
          status: getOrderStatus(orderStatus),
        },
      });

      resetOrderForm();
      await fetchOrders();
      setActivePage("orders");
      addToast(
        isEditing ? "Order updated" : "Order created",
        isEditing
          ? "The selected order was updated successfully."
          : "The new order was added successfully.",
        "success"
      );
    } catch (error) {
      addToast(
        "Unable to save order",
        error instanceof Error ? error.message : "Failed to save order",
        "error"
      );
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

  const handleProductFormChange = (field, value) => {
    setProductForm((currentForm) => {
      if (field === "category") {
        const shouldSwapImage =
          !currentForm.image_url ||
          currentForm.image_url === getDefaultImageForCategory(currentForm.category);

        return {
          ...currentForm,
          category: value,
          image_url: shouldSwapImage
            ? getDefaultImageForCategory(value)
            : currentForm.image_url,
        };
      }

      return {
        ...currentForm,
        [field]: value,
      };
    });
  };

  const openCreateOrder = () => {
    resetOrderForm();
    setActivePage("orders");
  };

  const openCreateProduct = () => {
    setActivePage("products");
    setEditingProduct(null);
    setProductForm(createEmptyProductForm());
    setProductFormOpen(true);
  };

  const openEditProduct = (product) => {
    setActivePage("products");
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      category: product.category,
      image_url: product.image_url || getDefaultImageForCategory(product.category),
      is_available: Boolean(product.is_available),
    });
    setProductFormOpen(true);
  };

  const handleSubmitProduct = async (event) => {
    event.preventDefault();
    setIsSavingProduct(true);

    try {
      const isEditing = Boolean(editingProduct);
      await apiRequest(isEditing ? `/products/${editingProduct.id}` : "/products", {
        method: isEditing ? "PUT" : "POST",
        body: {
          name: productForm.name.trim(),
          description: productForm.description.trim(),
          price: Number(productForm.price),
          image_url: productForm.image_url,
          category: productForm.category,
          is_available: productForm.is_available,
        },
      });

      await fetchProducts();
      setProductFormOpen(false);
      setEditingProduct(null);
      setProductForm(createEmptyProductForm(productForm.category));
      addToast(
        isEditing ? "Product updated" : "Product added",
        isEditing
          ? "Menu item details were updated successfully."
          : "The new menu item was added successfully.",
        "success"
      );
    } catch (error) {
      addToast(
        "Unable to save product",
        error instanceof Error ? error.message : "Failed to save product",
        "error"
      );
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleToggleProduct = async (productId) => {
    setTogglingProductId(productId);

    try {
      const updatedProduct = await apiRequest(`/products/${productId}/toggle`, {
        method: "PATCH",
      });

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === productId ? updatedProduct : product
        )
      );

      addToast(
        "Availability updated",
        `${updatedProduct.name} is now ${formatProductAvailability(
          updatedProduct.is_available
        ).toLowerCase()}.`,
        "success"
      );
    } catch (error) {
      addToast(
        "Toggle failed",
        error instanceof Error ? error.message : "Failed to update product availability",
        "error"
      );
    } finally {
      setTogglingProductId(null);
    }
  };

  const requestDeleteOrder = (orderId) => {
    const order = orders.find((item) => item.id === orderId);
    setConfirmDialog({
      type: "order",
      id: orderId,
      title: "Delete order?",
      message: order
        ? `Remove order #${order.id} for ${getCustomerLabel(order.customer_name)} permanently.`
        : "Delete this order permanently from the current account?",
      confirmLabel: "Delete Order",
      eyebrow: "Order action",
    });
  };

  const requestDeleteProduct = (product) => {
    setConfirmDialog({
      type: "product",
      id: product.id,
      title: "Delete product?",
      message: `Remove ${product.name} from the menu catalog permanently.`,
      confirmLabel: "Delete Product",
      eyebrow: "Menu action",
    });
  };

  const handleConfirmDialog = async () => {
    if (!confirmDialog) return;

    if (confirmDialog.type === "order") {
      setDeletingOrderId(confirmDialog.id);

      try {
        await apiRequest(`/orders/${confirmDialog.id}`, { method: "DELETE" });

        if (editingOrderId === confirmDialog.id) {
          resetOrderForm();
        }

        await fetchOrders();
        addToast("Order deleted", "The selected order was removed.", "success");
      } catch (error) {
        addToast(
          "Delete failed",
          error instanceof Error ? error.message : "Failed to delete order",
          "error"
        );
      } finally {
        setDeletingOrderId(null);
        setConfirmDialog(null);
      }

      return;
    }

    setDeletingProductId(confirmDialog.id);

    try {
      await apiRequest(`/products/${confirmDialog.id}`, { method: "DELETE" });

      if (editingProduct?.id === confirmDialog.id) {
        setProductFormOpen(false);
        setEditingProduct(null);
        resetProductForm();
      }

      await fetchProducts();
      addToast("Product deleted", "The selected menu item was removed.", "success");
    } catch (error) {
      addToast(
        "Delete failed",
        error instanceof Error ? error.message : "Failed to delete product",
        "error"
      );
    } finally {
      setDeletingProductId(null);
      setConfirmDialog(null);
    }
  };

  const normalizedOrdersSearchQuery = ordersSearchQuery.trim().toLowerCase();
  const normalizedProductSearchQuery = productSearchQuery.trim().toLowerCase();
  const normalizedCartSearchQuery = cartSearchQuery.trim().toLowerCase();

  const filteredOrders = orders.filter((order) => {
    const orderStatusValue = getOrderStatus(order.status);
    const formattedDate = formatDate(order.created_at).toLowerCase();
    const orderHaystack = [
      order.id,
      `#${order.id}`,
      getCustomerLabel(order.customer_name),
      orderStatusValue,
      STATUS_LABELS[orderStatusValue],
      formattedDate,
    ]
      .join(" ")
      .toLowerCase();
    const matchesSearch = orderHaystack.includes(normalizedOrdersSearchQuery);
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

  const orderPageOrders = [...sortedFilteredOrders].sort((a, b) => {
    if (ordersSortBy === "oldest") {
      const dateDifference = getDateValue(a.created_at) - getDateValue(b.created_at);
      return dateDifference !== 0
        ? dateDifference
        : Number(a.id || 0) - Number(b.id || 0);
    }

    if (ordersSortBy === "amount-high") {
      return Number(b.total_price || 0) - Number(a.total_price || 0);
    }

    if (ordersSortBy === "amount-low") {
      return Number(a.total_price || 0) - Number(b.total_price || 0);
    }

    return 0;
  });

  const filteredProducts = products
    .filter((product) => {
      const haystack = [
        product.name,
        product.description || "",
        product.category,
        Number(product.price || 0).toFixed(2),
        `$${Number(product.price || 0).toFixed(2)}`,
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch = haystack.includes(normalizedProductSearchQuery);
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;
      const matchesAvailability =
        selectedAvailability === "all" ||
        (selectedAvailability === "available" && product.is_available) ||
        (selectedAvailability === "out-of-stock" && !product.is_available);

      return matchesSearch && matchesCategory && matchesAvailability;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") {
        return Number(a.price) - Number(b.price);
      }

      if (sortBy === "price-high") {
        return Number(b.price) - Number(a.price);
      }

      if (sortBy === "category") {
        return (
          a.category.localeCompare(b.category) ||
          a.name.localeCompare(b.name) ||
          a.id - b.id
        );
      }

      if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name);
      }

      return a.name.localeCompare(b.name);
    });

  const filteredCartItems = cartItems.filter((item) => {
    const haystack = [
      item.name,
      item.description || "",
      item.category,
      Number(item.price || 0).toFixed(2),
      `$${Number(item.price || 0).toFixed(2)}`,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedCartSearchQuery);
  });

  const productsByCategory = PRODUCT_CATEGORIES.map((category) => ({
    category,
    count: products.filter((product) => product.category === category).length,
  })).filter((item) => item.count > 0);

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

  const totalProducts = products.length;
  const activeProducts = products.filter((product) => product.is_available).length;
  const outOfStockProducts = products.filter((product) => !product.is_available).length;
  const averageProductPrice =
    totalProducts > 0
      ? products.reduce((sum, product) => sum + Number(product.price), 0) /
      totalProducts
      : 0;

  const productKpis = [
    {
      icon: "TP",
      label: "Total Products",
      value: totalProducts,
      badge: `${filteredProducts.length} visible`,
      tone: "neutral",
      description: "Live menu catalog items in the protected products table.",
    },
    {
      icon: "AC",
      label: "Active Items",
      value: activeProducts,
      badge: `${totalProducts ? Math.round((activeProducts / totalProducts) * 100) : 0}% live`,
      tone: "success",
      description: "Currently available for service and ordering.",
    },
    {
      icon: "OS",
      label: "Out of Stock",
      value: outOfStockProducts,
      badge: outOfStockProducts ? "Action required" : "Healthy stock",
      tone: "warm",
      description: "Items currently hidden from availability.",
    },
    {
      icon: "AP",
      label: "Average Price",
      value: formatCurrency(averageProductPrice),
      badge: `${PRODUCT_CATEGORIES.length} categories`,
      tone: "info",
      description: "Average menu price across the current catalog.",
    },
  ];

  const primaryKpis = [
    {
      icon: "RV",
      label: "Total Revenue",
      value: formatCurrency(totalRevenue),
      badge: `${uniqueCustomers} guests`,
      tone: "warm",
      description: "Revenue in the current filtered view.",
    },
    {
      icon: "OR",
      label: "Total Orders",
      value: totalOrders,
      badge: `${liveAttentionCount} active`,
      tone: "neutral",
      description: "Protected orders currently in scope.",
    },
    {
      icon: "AV",
      label: "Average Order",
      value: formatCurrency(averageOrder),
      badge: `${uniqueCustomers || 0} customers`,
      tone: "info",
      description: "Average ticket value across visible orders.",
    },
    {
      icon: "CM",
      label: "Completed Orders",
      value: completedOrders,
      badge: `${completionRate}% closed`,
      tone: "success",
      description: "Orders completed successfully by the kitchen team.",
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
      badge: totalOrders ? `${Math.round((preparingOrders / totalOrders) * 100)}%` : "0%",
      tone: "info",
      description: "In active preparation.",
    },
    {
      icon: "CU",
      label: "Active Customers",
      value: uniqueCustomers,
      badge: topCustomer ? topCustomer.name : "Awaiting orders",
      tone: "neutral",
      description: "Unique customers in the current order view.",
    },
    {
      icon: "MX",
      label: "Highest Order",
      value: formatCurrency(highestOrderValue),
      badge: topCustomer ? "Top customer live" : "No leader yet",
      tone: "success",
      description: "Highest order in the visible dataset.",
    },
  ];

  const customerKpis = [
    {
      icon: "CU",
      label: "Unique Customers",
      value: uniqueCustomers,
      badge: `${topCustomers.length} ranked`,
      tone: "neutral",
      description: "Customers derived directly from the protected order history.",
    },
    {
      icon: "TP",
      label: "Top Customer",
      value: topCustomer ? formatCurrency(topCustomer.total) : formatCurrency(0),
      badge: topCustomer ? topCustomer.name : "No customer yet",
      tone: "warm",
      description: "Highest revenue contribution in the current order view.",
    },
    {
      icon: "AV",
      label: "Average Customer Value",
      value: formatCurrency(averageCustomerRevenue),
      badge: repeatLeader ? repeatLeader.name : "No repeat guest",
      tone: "info",
      description: "Revenue per customer in the current filtered view.",
    },
    {
      icon: "RT",
      label: "Most Frequent Customer",
      value: repeatLeader ? repeatLeader.totalOrders : 0,
      badge: repeatLeader ? repeatLeader.name : "No visits yet",
      tone: "success",
      description: "Highest order count among visible customers.",
    },
  ];

  const productImageOptions =
    products
      .filter((product) => product.image_url)
      .reduce((acc, product) => {
        if (!acc.some((option) => option.value === product.image_url)) {
          acc.push({
            value: product.image_url,
            label: `${product.name} (${product.category})`,
          });
        }

        return acc;
      }, []) || [];

  if (productImageOptions.length === 0) {
    productImageOptions.push({
      value: getFallbackProductImage(),
      label: "Smokehouse Royale Burger (Burgers)",
    });
  }

  const imageOptionsForForm = [...productImageOptions].sort((a, b) =>
    a.label.localeCompare(b.label)
  );

  const displayUser = currentUser || {
    name: "Restaurant Manager",
    email: "manager@dashboard.local",
  };
  const currentPage = PAGE_META[activePage];

  const isWorking =
    isSavingOrder ||
    isSavingProduct ||
    isCartMutating ||
    isCheckingOut ||
    deletingOrderId !== null ||
    deletingProductId !== null ||
    togglingProductId !== null;

  const handleExportOrders = () => {
    if (!sortedFilteredOrders.length) return;

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

  const handleExportMenu = () => {
    if (!filteredProducts.length) return;

    const header = [
      "Product",
      "Category",
      "Availability",
      "Price",
      "Description",
      "Image URL",
    ];
    const rows = filteredProducts.map((product) => [
      `"${String(product.name).replace(/"/g, '""')}"`,
      `"${String(product.category).replace(/"/g, '""')}"`,
      formatProductAvailability(product.is_available),
      Number(product.price).toFixed(2),
      `"${String(product.description || "").replace(/"/g, '""')}"`,
      product.image_url || "",
    ]);

    const csv = [header, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `restaurant-menu-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderOrdersFiltersPanel = (description) => (
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
            onChange={(event) => setStatusFilter(event.target.value)}
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
          onClick={clearOrderFilters}
          disabled={normalizedOrdersSearchQuery === "" && statusFilter === "all"}
        >
          Clear Filters
        </button>
      </div>

      <div className="active-filters">
        <span className="filter-chip">
          Search: {ordersSearchQuery.trim() ? ordersSearchQuery.trim() : "All customers"}
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

  const renderProductsFiltersPanel = () => (
    <section className="products-filters-panel">
      <div className="products-inline-search">
        <span className="topbar-search-icon">Search</span>
        <input
          type="search"
          placeholder="Search menu items..."
          value={productSearchQuery}
          onChange={(event) => setProductSearchQuery(event.target.value)}
        />
      </div>

      <div className="products-toolbar">
        <label className="filter-field">
          <span>Category</span>
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
          >
            <option value="all">All Categories</option>
            {PRODUCT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span>Availability</span>
          <select
            value={selectedAvailability}
            onChange={(event) => setSelectedAvailability(event.target.value)}
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </label>

        <label className="filter-field">
          <span>Sort</span>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="price-low">Price Low-High</option>
            <option value="price-high">Price High-Low</option>
            <option value="category">Category</option>
          </select>
        </label>

        <button
          type="button"
          className="secondary-button"
          onClick={clearProductFilters}
          disabled={
            normalizedProductSearchQuery === "" &&
            selectedCategory === "all" &&
            selectedAvailability === "all" &&
            sortBy === "name-asc"
          }
        >
          Clear Filters
        </button>
      </div>
    </section>
  );

  const renderPageHeroAside = () => {
    if (activePage === "cart") {
      const cartItemsCount = getCartItemsCount();
      const cartTotal = cartItems.reduce(
        (sum, item) => sum + Number(item.subtotal ?? Number(item.price) * item.quantity),
        0
      );

      return (
        <div className="overview-note-card">
          <span className="note-label">Cart summary</span>
          <strong>
            {cartItemsCount} item{cartItemsCount === 1 ? "" : "s"} - {formatCurrency(cartTotal)}
          </strong>
          <small>
            Quantities and pricing are reviewed here, while the backend validates
            product availability and calculates the final secure total.
          </small>
        </div>
      );
    }

    if (activePage === "products") {
      return (
        <div className="overview-note-card">
          <span className="note-label">Menu snapshot</span>
          <strong>
            {filteredProducts.length} visible items across {productsByCategory.length} live
            categories
          </strong>
          <small>
            Use the full menu grid below to edit, remove, or toggle availability
            without leaving the dashboard.
          </small>
        </div>
      );
    }

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
            Frontend 5173, backend 3001, PostgreSQL 5432. Auth and exports remain
            active.
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

  const renderPageHero = () => {
    const isProductsPage = activePage === "products";
    const isCartPage = activePage === "cart";

    return (
      <section className={`overview-hero page-${activePage}-hero`}>
        <div className="page-hero-copy">
          <span className="hero-eyebrow">{currentPage.eyebrow}</span>
          <h1>{currentPage.title}</h1>
          <p>{currentPage.subtitle}</p>
        </div>

        <div className="overview-actions">
          <div className="hero-actions-bar">
            <button
              type="button"
              className="secondary-button hero-action-button"
              onClick={
                isCartPage
                  ? () => setActivePage("products")
                  : isProductsPage
                    ? handleExportMenu
                    : handleExportOrders
              }
              disabled={
                isCartPage
                  ? false
                  : isProductsPage
                    ? filteredProducts.length === 0
                    : sortedFilteredOrders.length === 0
              }
            >
              {isCartPage ? "Browse Menu" : isProductsPage ? "Export Menu" : "Export Snapshot"}
            </button>

            <button
              type="button"
              className="primary-button hero-action-button"
              onClick={
                isCartPage
                  ? handleCheckoutCart
                  : isProductsPage
                    ? openCreateProduct
                    : activePage === "settings"
                      ? () => setActivePage("orders")
                      : openCreateOrder
              }
              disabled={isCartPage && (cartItems.length === 0 || cartCustomerName.trim() === "" || isCheckingOut)}
            >
              {isCartPage
                ? isCheckingOut
                  ? "Creating Order..."
                  : "Create Order"
                : isProductsPage
                  ? "Add Product"
                  : activePage === "settings"
                    ? "Open Orders"
                    : "New Order"}
            </button>
          </div>

          {renderPageHeroAside()}
        </div>
      </section>
    );
  };

  const renderOverviewPage = () => (
    <>
      {renderPageHero()}

      <section className="kpi-grid products-kpi-grid">
        {primaryKpis.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </section>

      <section className="dashboard-grid dashboard-grid-overview">
        <div className="dashboard-column-left">
          <div className="panel-card">
            <div className="panel-header">
              <div>
                <h2>Revenue Performance</h2>
                <p>
                  Grouped customer revenue from the live protected order set in
                  the current dashboard view.
                </p>
              </div>
              <span className="panel-chip">Revenue by customer</span>
            </div>

            <AnalyticsChart
              data={groupedRevenueData}
              isLoading={isOrdersLoading}
              hasActiveFilters={
                normalizedOrdersSearchQuery !== "" || statusFilter !== "all"
              }
              formatCurrency={formatCurrency}
              formatAxisCurrency={formatAxisCurrency}
            />
          </div>
        </div>

        <div className="dashboard-column-right">
          <div className="widget-card popular-panel">
            <div className="widget-header">
              <span className="widget-icon">TOP</span>
              <span className="widget-chip">Customers</span>
            </div>
            <h3>Popular Customers</h3>
            <p>Highest-value guests from the current filtered revenue snapshot.</p>

            <div className="popular-list">
              {topCustomers.length === 0 ? (
                <p className="mini-empty">No customer revenue data available.</p>
              ) : (
                topCustomers.slice(0, 4).map((customer) => (
                  <div className="popular-list-row" key={customer.name}>
                    <div className="popular-list-user">
                      <span className="popular-list-avatar">
                        {customer.name
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0]?.toUpperCase())
                          .join("") || "RD"}
                      </span>
                      <div>
                        <strong>{customer.name}</strong>
                        <span>{customer.totalOrders} orders</span>
                      </div>
                    </div>
                    <strong>{formatCurrency(customer.totalRevenue)}</strong>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              className="widget-link-button"
              onClick={() => setActivePage("customers")}
            >
              View All Customers
            </button>
          </div>
        </div>
      </section>

      <section className="panel-card recent-orders-panel">
        <div className="panel-header">
          <div>
            <h2>Recent Orders</h2>
            <p>Latest protected orders from the current filtered service view.</p>
          </div>
          <div className="panel-inline-actions">
            <button
              type="button"
              className="table-toolbar-button"
              onClick={() => setActivePage("orders")}
            >
              View All
            </button>
            <button
              type="button"
              className="table-toolbar-button"
              onClick={handleExportOrders}
              disabled={!sortedFilteredOrders.length}
            >
              Export
            </button>
          </div>
        </div>

        <OrdersTable
          orders={recentOrders}
          totalOrders={orders.length}
          hasActiveFilters={
            normalizedOrdersSearchQuery !== "" || statusFilter !== "all"
          }
          editingOrderId={editingOrderId}
          deletingOrderId={deletingOrderId}
          isBusy={isWorking}
          isLoading={isOrdersLoading}
          onEdit={handleEditOrder}
          onDelete={requestDeleteOrder}
          onCreate={openCreateOrder}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getOrderStatus={getOrderStatus}
          statusLabels={STATUS_LABELS}
        />
      </section>
    </>
  );


  const renderCartPage = () => {
    const cartTotal = cartItems.reduce(
      (sum, item) => sum + Number(item.subtotal ?? Number(item.price) * item.quantity),
      0
    );

    return (
      <>
        {renderPageHero()}

        <section className="cart-page-layout">
          <div className="cart-items-grid">
            {cartError && <p className="status-message error">{cartError}</p>}

            {isCartLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <article className="cart-product-card cart-product-card-skeleton" key={index}>
                  <div className="skeleton-block" />
                  <div className="cart-product-info">
                    <div className="skeleton-line title" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line medium" />
                  </div>
                </article>
              ))
            ) : cartItems.length === 0 ? (
              <div className="cart-empty-state">
                <h3>Your cart is empty</h3>
                <p>Add products from the menu to build a customer order.</p>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setActivePage("products")}
                >
                  Browse Products
                </button>
              </div>
            ) : filteredCartItems.length === 0 ? (
              <div className="cart-empty-state">
                <h3>No cart items match your search</h3>
                <p>Clear the cart search to show all selected products.</p>
              </div>
            ) : (
              filteredCartItems.map((item) => (
                <article className="cart-product-card" key={item.product_id}>
                  <img src={item.image_url} alt={item.name} />

                  <div className="cart-product-info">
                    <span className="product-category-badge">{item.category}</span>
                    <h3>{item.name}</h3>
                    <p>{formatCurrency(item.price)} each</p>

                    <div className="cart-card-footer">
                      <div className="cart-qty-control">
                        <button
                          type="button"
                          onClick={() => decreaseCartItem(item.product_id)}
                          disabled={isCartMutating || isCheckingOut}
                        >
                          -
                        </button>
                        <strong>{item.quantity}</strong>
                        <button
                          type="button"
                          onClick={() => increaseCartItem(item.product_id)}
                          disabled={isCartMutating || isCheckingOut}
                        >
                          +
                        </button>
                      </div>

                      <strong className="cart-card-subtotal">
                        {formatCurrency(item.subtotal ?? Number(item.price) * item.quantity)}
                      </strong>
                    </div>

                    <button
                      type="button"
                      className="cart-remove-button"
                      onClick={() => removeCartItem(item.product_id)}
                      disabled={isCartMutating || isCheckingOut}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          <aside className="cart-summary-panel">
            <span className="feedback-eyebrow">Checkout</span>
            <h2>Order Summary</h2>

            <label className="form-field">
              <span>Customer Name</span>
              <input
                type="text"
                value={cartCustomerName}
                onChange={(event) => setCartCustomerName(event.target.value)}
                placeholder="Walk-in Guest"
                disabled={isCheckingOut}
              />
            </label>

            <div className="cart-summary-row">
              <span>Items</span>
              <strong>{getCartItemsCount()}</strong>
            </div>

            <div className="cart-summary-row total">
              <span>Total</span>
              <strong>{formatCurrency(cartTotal)}</strong>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={handleCheckoutCart}
              disabled={cartItems.length === 0 || cartCustomerName.trim() === "" || isCheckingOut}
            >
              {isCheckingOut ? "Creating Order..." : "Create Order"}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={clearCart}
              disabled={cartItems.length === 0 || isCartMutating || isCheckingOut}
            >
              Clear Cart
            </button>
          </aside>
        </section>
      </>
    );
  };

  const renderProductsPage = () => (
    <>
      {renderPageHero()}

      <section className="kpi-grid">
        {productKpis.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </section>

      {renderProductsFiltersPanel()}

      {productsError && products.length > 0 && (
        <p className="status-message error">{productsError}</p>
      )}

      <ProductsGrid
        products={filteredProducts}
        isLoading={isProductsLoading}
        error={productsError}
        hasFilters={
          normalizedProductSearchQuery !== "" ||
          selectedCategory !== "all" ||
          selectedAvailability !== "all" ||
          sortBy !== "name-asc"
        }
        onRetry={fetchProducts}
        onEdit={openEditProduct}
        onDelete={requestDeleteProduct}
        onToggle={handleToggleProduct}
        onAddToCart={handleAddToCart}
        getCartQuantity={getCartQuantity}
        isCartBusy={isCartMutating}
        deletingProductId={deletingProductId}
        togglingProductId={togglingProductId}
        formatCurrency={formatCurrency}
      />
    </>
  );

  const renderOrdersPage = () => (
    <section className="orders-page">
      <header className="orders-header">
        <div className="orders-heading">
          <span className="orders-eyebrow">Operations</span>
          <h1>Orders</h1>
          <p>
            Track live orders, filter service status, and manage each customer
            ticket from one focused workspace.
          </p>
        </div>

        <div className="orders-toolbar" aria-label="Orders tools">
          <label className="orders-search">
            <span className="sr-only">Search orders</span>
            <input
              type="search"
              value={ordersSearchQuery}
              placeholder="Search customer"
              onChange={(event) => setOrdersSearchQuery(event.target.value)}
              disabled={isWorking}
            />
          </label>

          <label className="orders-select">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              disabled={isWorking}
            >
              <option value="all">All Statuses</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>

          <label className="orders-select">
            <span>Sort</span>
            <select
              value={ordersSortBy}
              onChange={(event) => setOrdersSortBy(event.target.value)}
              disabled={isWorking}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount-high">Amount High</option>
              <option value="amount-low">Amount Low</option>
            </select>
          </label>
        </div>
      </header>

      <section className="orders-summary-grid" aria-label="Orders summary">
        <article className="orders-summary-card">
          <span>Total Orders</span>
          <strong>{totalOrders}</strong>
        </article>
        <article className="orders-summary-card">
          <span>Pending Orders</span>
          <strong>{pendingOrders}</strong>
        </article>
        <article className="orders-summary-card">
          <span>Completed Orders</span>
          <strong>{completedOrders}</strong>
        </article>
        <article className="orders-summary-card">
          <span>Revenue</span>
          <strong>{formatCurrency(totalRevenue)}</strong>
        </article>
      </section>

      <section className="orders-content-grid">
        <div className="orders-table-panel">
          <div className="orders-panel-header">
            <div>
              <h2>Order Queue</h2>
              <p>
                {normalizedOrdersSearchQuery !== "" || statusFilter !== "all"
                  ? `${orderPageOrders.length} matching orders`
                  : `${orders.length} total orders`}
              </p>
            </div>
            <button
              type="button"
              className="orders-create-button"
              onClick={openCreateOrder}
              disabled={isWorking}
            >
              Create Order
            </button>
          </div>

          <OrdersTable
            orders={orderPageOrders}
            totalOrders={orders.length}
            hasActiveFilters={
              normalizedOrdersSearchQuery !== "" || statusFilter !== "all"
            }
            editingOrderId={editingOrderId}
            deletingOrderId={deletingOrderId}
            isBusy={isWorking}
            isLoading={isOrdersLoading}
            onEdit={handleEditOrder}
            onDelete={requestDeleteOrder}
            onCreate={openCreateOrder}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            getOrderStatus={getOrderStatus}
            statusLabels={STATUS_LABELS}
          />
        </div>

        <div className="orders-form-panel">
          <OrderForm
            editingOrderId={editingOrderId}
            customerName={customerName}
            totalPrice={totalPrice}
            orderStatus={orderStatus}
            onCustomerNameChange={setCustomerName}
            onTotalPriceChange={setTotalPrice}
            onOrderStatusChange={setOrderStatus}
            onSubmit={handleSubmitOrder}
            onCancel={resetOrderForm}
            isSavingOrder={isSavingOrder}
            orderStatuses={ORDER_STATUSES}
          />
        </div>
      </section>
    </section>
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

      {renderOrdersFiltersPanel(
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
              hasActiveFilters={
                normalizedOrdersSearchQuery !== "" || statusFilter !== "all"
              }
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

      {renderOrdersFiltersPanel(
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
            {normalizedOrdersSearchQuery !== "" || statusFilter !== "all"
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
              <span>Visible Products</span>
              <strong>{products.length}</strong>
            </div>
          </div>

          <button
            type="button"
            className="logout-button settings-logout"
            onClick={handleLogout}
            disabled={isWorking}
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
              <span>Deployment</span>
              <strong>Render + Vercel</strong>
            </div>
            <div className="detail-row">
              <span>Data Scope</span>
              <strong>Protected orders + menu catalog</strong>
            </div>
          </div>
        </div>
      </section>
    </>
  );

  const renderActivePage = () => {
    if (activePage === "products") return renderProductsPage();
    if (activePage === "cart") return renderCartPage();
    if (activePage === "orders") return renderOrdersPage();
    if (activePage === "analytics") return renderAnalyticsPage();
    if (activePage === "customers") return renderCustomersPage();
    if (activePage === "settings") return renderSettingsPage();

    return renderOverviewPage();
  };

  if (!token) {
    return (
      <main className="auth-page">
        <section className="auth-shell">
          <div className="auth-brand-panel">
            <div className="auth-brand">
              <div className="brand-mark auth-brand-mark" aria-hidden="true">
                <span />
              </div>
              <div>
                <strong>RestoDash Lite</strong>
              </div>
            </div>

            <div className="auth-brand-copy">
              <h2>Master your kitchen&apos;s rhythm with surgical precision.</h2>
              <p>
                Elevate your operational excellence with real-time analytics and
                seamless order management.
              </p>
            </div>

            <div className="auth-brand-metric">
              <div className="auth-brand-avatars">
                <span className="avatar-photo avatar-one" />
                <span className="avatar-photo avatar-two" />
                <span>+2K</span>
              </div>
              <strong>
                Join 2,000+ elite restaurateurs managing over 500k orders monthly.
              </strong>
            </div>
          </div>

          <section className="auth-card">
            <div className="auth-mobile-brand">
              <div className="brand-mark auth-brand-mark" aria-hidden="true">
                <span />
              </div>
              <div>
                <strong>RestoDash Lite</strong>
                <span>Dashboard Lite</span>
              </div>
            </div>

            <div className="auth-header">
              <h1>{isRegister ? "Create your account" : "Welcome Back"}</h1>
              <p>
                {isRegister
                  ? "Create your account to start managing service, menu items, and guest flow."
                  : "Enter your credentials to access your executive dashboard."}
              </p>
            </div>

            <form onSubmit={handleAuth} className="auth-form">
              {isRegister && (
                <label className="auth-field">
                  <span>Full Name</span>
                  <input
                    type="text"
                    value={name}
                    placeholder="Your full name"
                    onChange={(event) => setName(event.target.value)}
                    disabled={isAuthLoading}
                    required
                  />
                </label>
              )}

              <label className="auth-field">
                <span>Email/Username</span>
                <div className="auth-input-shell">
                  <span className="auth-input-icon" aria-hidden="true">
                    @
                  </span>
                  <input
                    type="email"
                    value={email}
                    placeholder="chef@restodash.com"
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={isAuthLoading}
                    required
                  />
                </div>
              </label>

              <label className="auth-field">
                <span className="auth-password-row">
                  <span>Password</span>
                  {!isRegister && (
                    <button type="button" disabled={isAuthLoading}>
                      Forgot Password?
                    </button>
                  )}
                </span>
                <div className="auth-input-shell">
                  <span className="auth-input-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false">
                      <path d="M7 10V8a5 5 0 0 1 10 0v2" />
                      <rect width="14" height="10" x="5" y="10" rx="2" />
                      <path d="M12 14v2" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    placeholder="Enter your password"
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isAuthLoading}
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((value) => !value)}
                    disabled={isAuthLoading}
                  >
                    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>
              </label>

              <label className="auth-remember">
                <input type="checkbox" disabled={isAuthLoading} />
                <span>Keep me signed in on this device</span>
              </label>

              <button
                type="submit"
                disabled={isAuthLoading}
                className="primary-button auth-submit"
              >
                <span>{isAuthLoading
                  ? isRegister
                    ? "Creating Account..."
                    : "Logging in..."
                  : isRegister
                    ? "Create Account"
                    : "Login"}</span>
                {!isAuthLoading && <span aria-hidden="true">-&gt;</span>}
              </button>
            </form>

            <p className="auth-demo-hint">
              Demo account: <strong>mohab@test.com</strong> / <strong>123456</strong>
            </p>

            {!isRegister && (
              <>
                <div className="auth-divider">
                  <span>Or continue with</span>
                </div>

                <div className="auth-provider-row">
                  <button type="button" disabled={isAuthLoading}>
                    <span className="auth-provider-icon" aria-hidden="true">SS</span>
                    SSO
                  </button>
                  <button type="button" disabled={isAuthLoading}>
                    <span className="auth-provider-icon" aria-hidden="true">K</span>
                    Auth0
                  </button>
                </div>
              </>
            )}

            <button
              type="button"
              className="auth-switch"
              onClick={() => !isAuthLoading && setIsRegister((value) => !value)}
              disabled={isAuthLoading}
            >
              {isRegister
                ? (
                  <>
                    Already have an account? <strong>Login</strong>
                  </>
                )
                : (
                  <>
                    New to the platform? <strong>Create Account</strong>
                  </>
                )}
            </button>

            <p className="auth-security-note">
              <span aria-hidden="true">SEC</span>
              Enterprise grade security &amp; 256-bit encryption
            </p>
          </section>
        </section>
      </main>
    );
  }

  return (
    <>
      <div className={`dashboard-shell ${isMobileSidebarOpen ? "mobile-nav-open" : ""}`}>
        <Sidebar
          currentUser={displayUser}
          activePage={activePage}
          onPageChange={setActivePage}
          isMobileOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          primaryActionLabel={activePage === "products" ? "Add Product" : "New Order"}
          onPrimaryAction={activePage === "products" ? openCreateProduct : openCreateOrder}
          onLogout={handleLogout}
          cartItemsCount={getCartItemsCount()}
        />

        <button
          type="button"
          className={`sidebar-backdrop ${isMobileSidebarOpen ? "visible" : ""}`}
          aria-label="Close navigation"
          onClick={() => setIsMobileSidebarOpen(false)}
        />

        <main className="dashboard-main main-shell">
          <div className={`dashboard-content page-content page-${activePage}`}>
            <Topbar
              currentUser={displayUser}
              pageTitle={currentPage.navTitle}
              searchTerm={
                activePage === "products"
                  ? productSearchQuery
                  : activePage === "cart"
                    ? cartSearchQuery
                    : ordersSearchQuery
              }
              onSearchChange={
                activePage === "products"
                  ? setProductSearchQuery
                  : activePage === "cart"
                    ? setCartSearchQuery
                    : setOrdersSearchQuery
              }
              onLogout={handleLogout}
              notificationCount={liveAttentionCount + outOfStockProducts}
              isBusy={isWorking}
              onToggleSidebar={() =>
                setIsMobileSidebarOpen((currentValue) => !currentValue)
              }
              isMobileSidebarOpen={isMobileSidebarOpen}
            />

            {ordersError && activePage !== "products" && (
              <p className="status-message error">{ordersError}</p>
            )}

            {renderActivePage()}
          </div>
        </main>

        <BottomNav
          activePage={activePage}
          onPageChange={setActivePage}
          onPrimaryAction={activePage === "products" ? openCreateProduct : openCreateOrder}
          cartItemsCount={getCartItemsCount()}
        />
      </div>

      <ProductModal
        isOpen={productFormOpen}
        isSaving={isSavingProduct}
        productForm={productForm}
        categories={PRODUCT_CATEGORIES}
        imageOptions={imageOptionsForForm}
        onClose={() => {
          if (!isSavingProduct) {
            setProductFormOpen(false);
            setEditingProduct(null);
          }
        }}
        onChange={handleProductFormChange}
        onSubmit={handleSubmitProduct}
        isEditing={Boolean(editingProduct)}
      />

      <ConfirmDialog
        config={confirmDialog}
        isBusy={Boolean(deletingOrderId || deletingProductId)}
        onCancel={() => setConfirmDialog(null)}
        onConfirm={handleConfirmDialog}
      />

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

export default App;
