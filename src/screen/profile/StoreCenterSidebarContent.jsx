import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { 
  FiX, 
  FiShoppingCart, 
  FiHeart, 
  FiPackage, 
  FiClock, 
  FiFileText,
  FiTrash2,
  FiCheckCircle,
  FiChevronRight,
  FiUnlock
} from "react-icons/fi";
import { useAppTheme } from "../../theme";
import { spacing, colors, radii } from "../../theme/tokens";
import {
  APPWRITE_DATABASE_ID,
  COLLECTION_SHOP_WISHLIST_ID,
  COLLECTION_PRODUCTS_ID,
  COLLECTION_ORDERS_ID,
  databases,
  Query,
} from "../../lib/Appwrite";
import { getUserById } from "../../lib/usersApi";

// Currency options
const CURRENCIES = [
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "₵" },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "MXN", name: "Mexican Peso", symbol: "$" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
];

// Currency mapping based on location/country
const getCurrencyFromLocation = (location) => {
  if (!location) return "USD";

  const locationLower = location.toLowerCase();

  // South Africa
  if (
    locationLower.includes("south africa") ||
    locationLower.includes("durban") ||
    locationLower.includes("cape town") ||
    locationLower.includes("johannesburg") ||
    locationLower.includes("pretoria")
  ) {
    return "ZAR";
  }

  // Other African countries
  if (locationLower.includes("nigeria") || locationLower.includes("lagos"))
    return "NGN";

  if (locationLower.includes("kenya") || locationLower.includes("nairobi"))
    return "KES";

  if (locationLower.includes("ghana") || locationLower.includes("accra"))
    return "GHS";

  if (locationLower.includes("egypt") || locationLower.includes("cairo"))
    return "EGP";

  // United Kingdom
  if (
    locationLower.includes("united kingdom") ||
    locationLower.includes("england") ||
    locationLower.includes("scotland") ||
    locationLower.includes("wales") ||
    locationLower.includes("northern ireland") ||
    locationLower.includes("uk")
  ) {
    return "GBP";
  }

  // Europe (Eurozone)
  if (
    locationLower.includes("europe") ||
    locationLower.includes("france") ||
    locationLower.includes("germany") ||
    locationLower.includes("spain") ||
    locationLower.includes("italy") ||
    locationLower.includes("portugal") ||
    locationLower.includes("lisbon") ||
    locationLower.includes("porto") ||
    locationLower.includes("netherlands") ||
    locationLower.includes("belgium") ||
    locationLower.includes("austria") ||
    locationLower.includes("finland") ||
    locationLower.includes("ireland")
  ) {
    return "EUR";
  }

  // Switzerland
  if (locationLower.includes("switzerland") || locationLower.includes("zurich"))
    return "CHF";

  // United States
  if (
    locationLower.includes("united states") ||
    locationLower.includes("usa") ||
    locationLower.includes("new york") ||
    locationLower.includes("los angeles") ||
    locationLower.includes("chicago") ||
    locationLower.includes("texas") ||
    locationLower.includes("california") ||
    locationLower.includes("florida")
  ) {
    return "USD";
  }

  // Canada
  if (
    locationLower.includes("canada") ||
    locationLower.includes("toronto") ||
    locationLower.includes("vancouver") ||
    locationLower.includes("montreal")
  ) {
    return "CAD";
  }

  // Australia
  if (
    locationLower.includes("australia") ||
    locationLower.includes("sydney") ||
    locationLower.includes("melbourne")
  ) {
    return "AUD";
  }

  // Asia
  if (locationLower.includes("philippines") || locationLower.includes("manila"))
    return "PHP";

  if (locationLower.includes("japan") || locationLower.includes("tokyo"))
    return "JPY";

  if (
    locationLower.includes("china") ||
    locationLower.includes("beijing") ||
    locationLower.includes("shanghai")
  )
    return "CNY";

  if (
    locationLower.includes("india") ||
    locationLower.includes("delhi") ||
    locationLower.includes("mumbai")
  )
    return "INR";

  if (locationLower.includes("south korea") || locationLower.includes("seoul"))
    return "KRW";

  if (locationLower.includes("indonesia") || locationLower.includes("jakarta"))
    return "IDR";

  if (locationLower.includes("singapore")) return "SGD";

  // Middle East
  if (
    locationLower.includes("uae") ||
    locationLower.includes("dubai") ||
    locationLower.includes("abu dhabi")
  )
    return "AED";

  if (
    locationLower.includes("saudi arabia") ||
    locationLower.includes("riyadh")
  )
    return "SAR";

  // Latin America
  if (locationLower.includes("brazil") || locationLower.includes("sao paulo"))
    return "BRL";

  if (locationLower.includes("mexico") || locationLower.includes("mexico city"))
    return "MXN";

  // Default
  return "USD";
};

// Get currency symbol from currency code
const getCurrencySymbol = (currencyCode) => {
  const currency = CURRENCIES.find((c) => c.code === currencyCode);
  return currency ? currency.symbol : "$";
};

// Get status color
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return colors.peach;
    case "processing":
      return "#FFA500";
    case "shipped":
      return "#4169E1";
    case "delivered":
      return "#32CD32";
    case "cancelled":
      return "#FF4444";
    default:
      return "rgba(15, 18, 32, 0.64)";
  }
};

// Get payment status color
const getPaymentStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return colors.peach;
    case "processing":
      return "#FFA500";
    case "paid":
      return "#32CD32";
    case "failed":
      return "#FF4444";
    case "refunded":
      return "#FF4444";
    default:
      return "rgba(15, 18, 32, 0.64)";
  }
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Function to check if item is digital/mini (instant delivery)
const isDigitalItem = (item) => {
  return item.isDigital === true || item.deliveryMethod === "instant" || item.type === "mini";
};

// Function to check if item needs shipping (physical items)
const needsShipping = (item) => {
  return !isDigitalItem(item);
};

// Function to fetch user's orders
const fetchUserOrders = async (userId) => {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTION_ORDERS_ID,
      [Query.equal("userId", userId)],
    );
    return response.documents;
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
};

// Function to fetch user's wishlist
const fetchUserWishlist = async (userId) => {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTION_SHOP_WISHLIST_ID,
      [Query.equal("userId", userId)],
    );

    if (response.documents.length > 0) {
      return response.documents[0];
    }
    return null;
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return null;
  }
};

// Function to fetch product details by IDs
const fetchProductsByIds = async (productIds) => {
  if (!productIds || productIds.length === 0) return [];

  try {
    // Fetch products in batches (Appwrite has limits on IN queries)
    const batchSize = 10;
    const allProducts = [];

    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTION_PRODUCTS_ID,
        [Query.equal("$id", batch)],
      );
      allProducts.push(...response.documents);
    }

    return allProducts;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

// Tab configurations
const TABS = [
  { key: "cart", label: "Cart", icon: FiShoppingCart },
  { key: "wishlist", label: "Wishlist", icon: FiHeart },
  { key: "ordersTracking", label: "Orders", icon: FiPackage },
  { key: "history", label: "History", icon: FiClock },
  { key: "receipts", label: "Receipts", icon: FiFileText },
];

// Wishlist Tab Component
const WishlistRoute = ({ theme, auth, userCurrency }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWishlist = async () => {
      if (!auth?.userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const wishlistDoc = await fetchUserWishlist(auth.userId);

        if (wishlistDoc && wishlistDoc.items && wishlistDoc.items.length > 0) {
          const wishlistIds = wishlistDoc.items;
          const fetchedProducts = await fetchProductsByIds(wishlistIds);
          setProducts(fetchedProducts);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error("Error loading wishlist:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, [auth?.userId]);

  const renderWishlistItem = (item) => {
    // Calculate discounted price
    const originalPrice = item?.price || 0;
    const discountPercent = item?.discount_percent || 0;
    const discountedPrice = originalPrice * (1 - discountPercent / 100);

    return (
      <div
        key={item.$id}
        style={{
          display: "flex",
          alignItems: "center",
          padding: spacing.sm,
          borderRadius: radii.chip,
          border: `1px solid ${theme.border}`,
          backgroundColor: theme.card,
          marginBottom: spacing.md,
        }}
      >
        <img
          src={item.images?.[0]}
          alt={item.name}
          style={{
            width: 80,
            height: 80,
            borderRadius: radii.chip,
            objectFit: "cover",
          }}
        />
        <div style={{ flex: 1, marginLeft: spacing.md }}>
          <p
            style={{
              color: theme.text,
              fontSize: 14,
              fontWeight: "600",
              marginBottom: spacing.xs,
              margin: 0,
            }}
            numberOfLines={2}
          >
            {item.name}
          </p>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
            {discountPercent > 0 ? (
              <>
                <span style={{ color: theme.text, fontSize: 16, fontWeight: "700" }}>
                  {userCurrency}{discountedPrice.toFixed(2)}
                </span>
                <span style={{ color: theme.subText, fontSize: 14, textDecoration: "line-through", marginLeft: spacing.sm }}>
                  {userCurrency}{originalPrice.toFixed(2)}
                </span>
                <span style={{
                  backgroundColor: colors.peach,
                  padding: "2px 6px",
                  borderRadius: radii.chip,
                  marginLeft: spacing.sm,
                  fontSize: 12,
                  fontWeight: "600",
                  color: colors.white,
                }}>
                  {discountPercent}% OFF
                </span>
              </>
            ) : (
              <span style={{ color: theme.text, fontSize: 16, fontWeight: "700" }}>
                {userCurrency}{originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: spacing.xs }}>
          <button
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: spacing.sm,
            }}
          >
            <FiShoppingCart size={20} color={theme.text} />
          </button>
          <button
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: spacing.sm,
            }}
          >
            <FiTrash2 size={20} color={colors.peach} />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div className="reel-spinner" />
      </div>
    );
  }

  if (!auth?.userId) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <FiHeart size={48} color={theme.subText} />
        <p style={{ color: theme.subText, marginTop: spacing.md }}>
          Please log in to view your wishlist
        </p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <FiHeart size={48} color={theme.subText} />
        <p style={{ color: theme.subText, marginTop: spacing.md }}>
          Your wishlist is empty
        </p>
        <p style={{ color: theme.subText, fontSize: 14 }}>
          Add items from the shop to see them here
        </p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      {products.map(renderWishlistItem)}
    </div>
  );
};

// OrdersTrackingRoute Component
const OrdersTrackingRoute = ({ theme, auth, userCurrency }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRevealPopup, setShowRevealPopup] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Fetch orders on mount
  useEffect(() => {
    const loadOrders = async () => {
      if (!auth?.userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const fetchedOrders = await fetchUserOrders(auth.userId);
        // Filter for orders that still need user attention
        const filtered = fetchedOrders.filter((order) => {
          const digital = isDigitalItem(order);
          if (digital) {
            return order.payment_status === "pending" ||
                   order.payment_status === "processing";
          } else {
            return (
              order.status === "pending" ||
              order.status === "processing"
            );
          }
        });
        setOrders(filtered);
      } catch (error) {
        console.error("Error loading orders:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [auth?.userId]);

  // Polling for order updates
  useEffect(() => {
    if (!auth?.userId) return;

    let pollInterval;

    const pollForUpdates = async () => {
      try {
        const fetchedOrders = await fetchUserOrders(auth.userId);

        // Check each updated order for payment_status = "paid"
        fetchedOrders.forEach((order) => {
          const isDigital = isDigitalItem(order);
          if (isDigital && order.payment_status === "paid") {
            if (!selectedOrder || selectedOrder.$id !== order.$id) {
              setSelectedOrder(order);
              setShowRevealPopup(true);
            }
          }
        });

        // Update the orders list
        const filtered = fetchedOrders.filter((order) => {
          const digital = isDigitalItem(order);
          if (digital) {
            return order.payment_status === "pending" ||
                   order.payment_status === "processing";
          } else {
            return (
              order.status === "pending" ||
              order.status === "processing"
            );
          }
        });
        setOrders(filtered);
      } catch (error) {
        console.error("Error polling for order updates:", error);
      }
    };

    // Poll every 2 seconds for order updates
    pollInterval = setInterval(pollForUpdates, 2000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [auth?.userId, selectedOrder]);

  const renderOrderItem = (item) => {
    const isDigital = isDigitalItem(item);
    const paymentStatus = item.payment_status || item.status || "pending";

    return (
      <div
        key={item.$id || item.orderId}
        style={{
          padding: spacing.sm,
          borderRadius: radii.chip,
          border: `1px solid ${theme.border}`,
          backgroundColor: theme.card,
          marginBottom: spacing.md,
        }}
      >
        {/* Order Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 10 }}>
          <div>
            <p style={{ color: theme.text, fontSize: 16, fontWeight: "700", margin: 0, marginBottom: 4 }}>
              {userCurrency}{(item.totalPrice || item.total_amount || 0).toFixed(2)}
            </p>
            <p style={{ color: theme.subText, fontSize: 12, margin: 0 }}>
              {item.order_number || item.$id?.substring(0, 8).toUpperCase()}
            </p>
            <p style={{ color: theme.subText, fontSize: 12, margin: 0 }}>
              {formatDate(item.$createdAt)}
            </p>
          </div>
          {isDigital && (
            <span style={{
              backgroundColor: "rgba(156, 39, 176, 0.2)",
              padding: "4px 8px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: "600",
              color: "#9C27B0",
            }}>
              📱 Digital
            </span>
          )}
        </div>

        {/* Product Info */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
          <img
            src={item.productImage?.[0] || item.productImage}
            alt={item.productName}
            style={{
              width: 60,
              height: 60,
              borderRadius: radii.chip,
              objectFit: "cover",
            }}
          />
          <div style={{ flex: 1, marginLeft: spacing.md }}>
            <p
              style={{
                color: theme.text,
                fontSize: 14,
                fontWeight: "600",
                margin: 0,
                marginBottom: 4,
              }}
              numberOfLines={2}
            >
              {item.productName || "Product"}
            </p>
            <p style={{ color: theme.subText, fontSize: 12, margin: 0 }}>
              Qty: {item.items?.length || 1}
            </p>
          </div>
        </div>

        {/* Payment Status Section */}
        <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ color: theme.subText, fontSize: 13 }}>Payment Status:</span>
            <span style={{
              backgroundColor: getPaymentStatusColor(item.payment_status) + "20",
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: "600",
              color: getPaymentStatusColor(paymentStatus),
            }}>
              {paymentStatus === "processing" ? "⏳ Processing" : 
               paymentStatus === "paid" ? "✓ Paid" : 
               paymentStatus === "pending" ? "⏳ Pending" : 
               paymentStatus === "failed" ? "❌ Failed" : 
               paymentStatus === "refunded" ? "↩️ Refunded" : paymentStatus}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ color: theme.subText, fontSize: 13 }}>Order Status:</span>
            <span style={{
              backgroundColor: getStatusColor(item.status) + "20",
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: "600",
              color: getStatusColor(item.status),
            }}>
              {item.status === "processing" ? "⏳ Processing" : item.status || "Pending"}
            </span>
          </div>

          {/* Tracking Number */}
          {item.tracking_number && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: theme.subText, fontSize: 13 }}>Tracking:</span>
              <span style={{ color: theme.text, fontSize: 13, fontWeight: "500" }}>
                {item.tracking_number}
              </span>
            </div>
          )}
        </div>

        {/* Instructions for Processing Orders */}
        {((isDigital && item.payment_status === "pending") || (!isDigital && item.status === "processing")) && (
          <div style={{ backgroundColor: "rgba(255, 165, 0, 0.15)", padding: 12, borderRadius: 8, marginTop: 8 }}>
            <p style={{ color: "#FFA500", fontSize: 14, fontWeight: "600", margin: 0, marginBottom: 6 }}>
              ⏳ Waiting for Confirmation
            </p>
            <p style={{ color: theme.subText, fontSize: 12, margin: 0, lineHeight: 18 }}>
              Your payment is being verified by the seller. You'll receive your digital product once confirmed.
            </p>
          </div>
        )}

        {/* View Digital Item Button - Show when payment is paid */}
        {isDigital && item.payment_status === "paid" && (
          <div style={{ 
            backgroundColor: "rgba(50, 205, 50, 0.15)", 
            padding: spacing.md, 
            borderRadius: radii.card, 
            marginTop: spacing.md,
            border: "1px solid rgba(50, 205, 50, 0.4)",
          }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: spacing.md }}>
              <FiCheckCircle size={20} color="#32CD32" style={{ marginRight: spacing.md }} />
              <div>
                <p style={{ color: "#32CD32", fontSize: 14, fontWeight: "600", margin: 0, marginBottom: 4 }}>
                  ✓ Payment Confirmed
                </p>
                <p style={{ color: theme.subText, fontSize: 12, margin: 0 }}>
                  Your digital item is ready to reveal
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedOrder(item);
                setShowRevealPopup(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                padding: `${spacing.sm}px ${spacing.md}px`,
                backgroundColor: "#32CD32",
                border: "none",
                borderRadius: radii.button,
                cursor: "pointer",
                gap: spacing.xs,
              }}
            >
              <FiUnlock size={16} color={colors.white} />
              <span style={{ color: colors.white, fontSize: 14, fontWeight: "600" }}>Reveal Item</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div className="reel-spinner" />
      </div>
    );
  }

  if (!auth?.userId) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <FiPackage size={48} color={theme.subText} />
        <p style={{ color: theme.subText, marginTop: spacing.md }}>
          Please log in to view your orders
        </p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <FiPackage size={48} color={theme.subText} />
        <p style={{ color: theme.subText, marginTop: spacing.md }}>
          You don't have any orders
        </p>
        <p style={{ color: theme.subText, fontSize: 14 }}>
          Buy an item to see your orders here
        </p>
      </div>
    );
  }

  // Split into digital vs physical containers
  const digitalOrders = orders.filter(isDigitalItem);
  const physicalOrders = orders.filter(needsShipping);

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: spacing.lg }}>
      {digitalOrders.length > 0 && (
        <div style={{ marginBottom: spacing.lg }}>
          <p style={{ color: theme.text, fontSize: 16, fontWeight: "700", marginBottom: spacing.sm, margin: 0 }}>
            Digital / Instant orders
          </p>
          {digitalOrders.map((o) => (
            <React.Fragment key={o.$id || o.orderId}>
              {renderOrderItem(o)}
            </React.Fragment>
          ))}
        </div>
      )}
      {physicalOrders.length > 0 && (
        <div style={{ marginBottom: spacing.lg }}>
          <p style={{ color: theme.text, fontSize: 16, fontWeight: "700", marginBottom: spacing.sm, margin: 0 }}>
            Physical / Shippable orders
          </p>
          {physicalOrders.map((o) => (
            <React.Fragment key={o.$id || o.orderId}>
              {renderOrderItem(o)}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

// History Route Component
const HistoryRoute = ({ theme }) => {
  return (
    <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <p style={{ color: theme.text, textAlign: "center", marginTop: spacing.xl, fontSize: 16 }}>
        Purchase history will appear here
      </p>
    </div>
  );
};

// Cart Route Component
const CartRoute = ({ theme, auth, userCurrency }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch orders on mount - ONLY physical items that need shipping
  useEffect(() => {
    const loadOrders = async () => {
      if (!auth?.userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const fetchedOrders = await fetchUserOrders(auth.userId);
        // Filter for physical items only (items that need shipping/address)
        const physicalOrders = fetchedOrders.filter(needsShipping);
        setOrders(physicalOrders);
      } catch (error) {
        console.error("Error loading orders:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [auth?.userId]);

  const renderOrderItem = (item) => {
    const isDigital = isDigitalItem(item);

    return (
      <div
        key={item.$id || item.orderId}
        style={{
          display: "flex",
          alignItems: "center",
          padding: spacing.md,
          borderRadius: 16,
          border: `1px solid ${theme.border}`,
          backgroundColor: theme.card,
          marginBottom: spacing.md,
          boxShadow: "0px 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        {/* Product Image */}
        <img
          src={item.productImage?.[0] || item.productImage}
          alt={item.productName}
          style={{
            width: 60,
            height: 60,
            borderRadius: radii.chip,
            objectFit: "cover",
          }}
        />
        
        {/* Order Info */}
        <div style={{ flex: 1, marginLeft: spacing.md }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <p
              style={{
                color: theme.text,
                fontSize: 14,
                fontWeight: "600",
                margin: 0,
                flex: 1,
                marginRight: spacing.sm,
              }}
              numberOfLines={2}
            >
              {item.productName || "Product"}
            </p>
            {isDigital && (
              <span style={{
                backgroundColor: "rgba(156, 39, 176, 0.2)",
                padding: "3px 8px",
                borderRadius: 12,
                fontSize: 10,
                fontWeight: "600",
                color: "#9C27B0",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}>
                Digital
              </span>
            )}
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ color: theme.subText, fontSize: 12 }}>
              Qty: {item.items?.length || 1}
            </span>
            <span style={{ color: theme.subText, fontSize: 12 }}>
              {formatDate(item.$createdAt)}
            </span>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: theme.text, fontSize: 16, fontWeight: "700" }}>
              {userCurrency}{(item.totalPrice || item.total_amount || 0).toFixed(2)}
            </span>
            <span style={{
              backgroundColor: getStatusColor(item.status) + "20",
              padding: "2px 8px",
              borderRadius: radii.chip,
              fontSize: 12,
              fontWeight: "600",
              color: getStatusColor(item.status),
              textTransform: "capitalize",
            }}>
              {item.status || "Pending"}
            </span>
          </div>
        </div>
        
        <FiChevronRight size={20} color={theme.subText} />
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div className="reel-spinner" />
      </div>
    );
  }

  if (!auth?.userId) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <FiShoppingCart size={48} color={theme.subText} />
        <p style={{ color: theme.subText, marginTop: spacing.md }}>
          Please log in to view your orders
        </p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.md,
        }}>
          <FiShoppingCart size={40} color={theme.subText} />
        </div>
        <p style={{ color: theme.subText, marginTop: spacing.md }}>
          Your cart is empty
        </p>
        <p style={{ color: theme.subText, fontSize: 14 }}>
          Items that you add to cart will appear here
        </p>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      {orders.map(renderOrderItem)}
    </div>
  );
};

// Receipts Route Component
const ReceiptsRoute = ({ theme }) => {
  return (
    <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <p style={{ color: theme.text, textAlign: "center", marginTop: spacing.xl, fontSize: 16 }}>
        Receipts will appear here
      </p>
    </div>
  );
};

// Main Component
export const StoreCenterSidebarContent = ({ theme, onClose }) => {
  const appTheme = theme || useAppTheme();
  const auth = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState("cart");
  const [userCurrency, setUserCurrency] = useState("$");

  // Detect user currency based on location
  useEffect(() => {
    const detectCurrency = async () => {
      try {
        let currencyCode = "USD";

        // First, try to get currency from user's profile address
        if (auth?.userId) {
          try {
            const user = await getUserById(auth.userId);
            if (user?.address) {
              currencyCode = getCurrencyFromLocation(user.address);
            }
          } catch (error) {
            console.log("Error fetching user profile:", error);
          }
        }

        // If no user profile or no address, use browser geolocation
        if (!currencyCode || currencyCode === "USD") {
          try {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                async (position) => {
                  try {
                    // Use reverse geocoding API (free tier)
                    const response = await fetch(
                      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
                    );
                    const data = await response.json();
                    if (data?.address) {
                      const address = data.address;
                      const fullLocation = `${address.city || ""}, ${address.state || ""}, ${address.country || ""}`;
                      currencyCode = getCurrencyFromLocation(fullLocation);
                      const symbol = getCurrencySymbol(currencyCode);
                      setUserCurrency(symbol);
                    }
                  } catch (error) {
                    console.log("Error reverse geocoding:", error);
                  }
                },
                (error) => {
                  console.log("Error getting location:", error);
                }
              );
            }
          } catch (error) {
            console.log("Error getting location:", error);
          }
        }

        const symbol = getCurrencySymbol(currencyCode);
        setUserCurrency(symbol);
      } catch (error) {
        console.log("Error detecting currency:", error);
        setUserCurrency("$");
      }
    };

    detectCurrency();
  }, [auth]);

  const renderContent = () => {
    switch (activeTab) {
      case "cart":
        return <CartRoute theme={appTheme} auth={auth} userCurrency={userCurrency} />;
      case "wishlist":
        return <WishlistRoute theme={appTheme} auth={auth} userCurrency={userCurrency} />;
      case "ordersTracking":
        return <OrdersTrackingRoute theme={appTheme} auth={auth} userCurrency={userCurrency} />;
      case "history":
        return <HistoryRoute theme={appTheme} />;
      case "receipts":
        return <ReceiptsRoute theme={appTheme} />;
      default:
        return <CartRoute theme={appTheme} auth={auth} userCurrency={userCurrency} />;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: spacing.xl,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: spacing.lg,
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: spacing.xs,
          }}
        >
          <FiX size={24} color={appTheme.text} />
        </button>
        <h2
          style={{
            color: appTheme.text,
            fontSize: 20,
            fontWeight: "600",
            margin: 0,
          }}
        >
          Store Center
        </h2>
        <div style={{ width: 24 }} />
      </div>

      {/* Tab Bar */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          borderBottom: `1px solid ${appTheme.border}`,
          marginBottom: spacing.lg,
          overflowX: "auto",
        }}
      >
        {TABS.map((tab) => {
          const focused = tab.key === activeTab;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.xs,
                padding: `${spacing.sm}px ${spacing.md}px`,
                background: "transparent",
                border: "none",
                borderBottom: focused ? `2px solid ${colors.peach}` : "2px solid transparent",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {/*<Icon size={16} color={focused ? appTheme.text : appTheme.subText} />*/}
              <span
                style={{
                  color: focused ? appTheme.text : appTheme.subText,
                  fontSize: 14,
                  fontWeight: focused ? "600" : "400",
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {renderContent()}
      </div>
    </div>
  );
};

export default StoreCenterSidebarContent;

