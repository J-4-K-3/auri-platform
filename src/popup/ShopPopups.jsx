import React, { useState } from "react";
import {
  FiX,
  FiSearch,
  FiMapPin,
  FiCheck,
  FiGift,
  FiShoppingBag,
  FiMail,
  FiExternalLink,
  FiDollarSign,
  FiGlobe,
  FiSmartphone,
  FiTrendingUp,
  FiUsers,
  FiPackage,
  FiUnlock,
  FiCopy,
  FiStar,
  FiSend,
} from "react-icons/fi";
import { colors, spacing, radii } from "../theme/tokens";

// Preferences Popup
export const PreferencesPopup = ({
  showPreferences,
  setShowPreferences,
  region,
  setRegion,
  price,
  setPrice,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  if (!showPreferences) return null;

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      setShowPreferences(false);
      setSearchQuery("");
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={() => setShowPreferences(false)}
    >
      <div
        style={{
          width: "90%",
          maxHeight: "80%",
          backgroundColor: "#1a1a1a",
          borderRadius: 16,
          padding: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <button
            onClick={() => setShowPreferences(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <FiX size={20} color="#fff" />
          </button>
          <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>
            Preferences
          </h3>
          <div style={{ width: 20 }} />
        </div>

        {/* Search Input */}
        <p style={{ color: "#888", fontSize: 13, marginBottom: 8 }}>
          Search Products
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input
            style={{
              flex: 1,
              border: "1px solid #333",
              borderRadius: 8,
              padding: "12px 16px",
              fontSize: 14,
              backgroundColor: "#222",
              color: "#fff",
              outline: "none",
            }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for items..."
            placeholderTextColor="#666"
            onKeyPress={(e) => e.key === "Enter" && handleSearchSubmit()}
          />
          <button
            onClick={handleSearchSubmit}
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              border: "none",
              backgroundColor: colors.peach,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FiSearch size={18} color="#fff" />
          </button>
        </div>

        {/* Region */}
        <p style={{ color: "#888", fontSize: 13, marginBottom: 8 }}>
          Show items from
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {["Local", "Global", "Both"].map((item) => (
            <button
              key={item}
              onClick={() => setRegion(item)}
              style={{
                padding: "8px 20px",
                borderRadius: 20,
                border: `1px solid ${region === item ? colors.peach : "#333"}`,
                backgroundColor: region === item ? colors.peach : "transparent",
                color: region === item ? "#fff" : "#fff",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Price comfort */}
        <p style={{ color: "#888", fontSize: 13, marginBottom: 8 }}>
          Price comfort
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {["Budget-friendly", "Balanced", "Premium"].map((item) => (
            <button
              key={item}
              onClick={() => setPrice(item)}
              style={{
                padding: "8px 20px",
                borderRadius: 20,
                border: `1px solid ${price === item ? colors.peach : "#333"}`,
                backgroundColor: price === item ? colors.peach : "transparent",
                color: price === item ? "#fff" : "#fff",
                cursor: "pointer",
                fontSize: 14,
                textAlign: "left",
              }}
            >
              {price === item ? "●" : "○"} {item}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 20,
          }}
        >
          <button
            onClick={() => {
              setRegion("Both");
              setPrice("Balanced");
            }}
            style={{
              background: "none",
              border: "none",
              color: "#888",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Reset
          </button>
          <button
            onClick={() => setShowPreferences(false)}
            style={{
              padding: "8px 24px",
              borderRadius: 8,
              border: "none",
              backgroundColor: colors.peach,
              color: "#fff",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// Reward Voucher Popup
export const RewardVoucherPopup = ({
  showRewardVoucher,
  setShowRewardVoucher,
}) => {
  const [activeTab, setActiveTab] = useState("claim");
  const [voucherCode, setVoucherCode] = useState("");
  const [loading, setLoading] = useState(false);

  if (!showRewardVoucher) return null;

  const handleClaim = () => {
    if (!voucherCode.trim()) {
      alert("Please enter a voucher code");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert(`Voucher ${voucherCode} claimed successfully!`);
      setVoucherCode("");
    }, 1000);
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={() => setShowRewardVoucher(false)}
    >
      <div
        style={{
          width: "90%",
          maxHeight: "85%",
          backgroundColor: "#1a1a1a",
          borderRadius: 16,
          padding: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <button
            onClick={() => setShowRewardVoucher(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <FiX size={20} color="#fff" />
          </button>
          <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>
            Reward Vouchers
          </h3>
          <div style={{ width: 20 }} />
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: "flex",
            backgroundColor: "#222",
            borderRadius: 8,
            padding: 4,
            marginBottom: 20,
          }}
        >
          <button
            onClick={() => setActiveTab("claim")}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 6,
              border: "none",
              backgroundColor: activeTab === "claim" ? colors.peach : "transparent",
              color: activeTab === "claim" ? "#fff" : "#fff",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Claim Voucher
          </button>
          <button
            onClick={() => setActiveTab("offer")}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 6,
              border: "none",
              backgroundColor: activeTab === "offer" ? colors.peach : "transparent",
              color: activeTab === "offer" ? "#fff" : "#fff",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Offer Voucher
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: `${colors.peach}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <FiGift size={32} color={colors.peach} />
          </div>
          <p style={{ color: "#888", fontSize: 14, textAlign: "center", marginBottom: 20, lineHeight: 20 }}>
            {activeTab === "claim"
              ? "Enter a voucher code shared by someone to claim your reward!"
              : "Create a voucher to give to friends! They can use it on any product in the Auri platform."}
          </p>
          <input
            style={{
              width: "100%",
              border: "1px solid #333",
              borderRadius: 8,
              padding: "12px 16px",
              fontSize: 16,
              backgroundColor: "#222",
              color: "#fff",
              outline: "none",
              textAlign: "center",
              marginBottom: 20,
            }}
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value)}
            placeholder={activeTab === "claim" ? "Enter voucher code" : "Voucher amount (e.g. $10)"}
            placeholderTextColor="#666"
          />
          <button
            onClick={activeTab === "claim" ? handleClaim : () => alert("Create voucher coming soon!")}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px 32px",
              borderRadius: 8,
              border: "none",
              backgroundColor: colors.peach,
              opacity: loading ? 0.6 : 1,
              color: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: 16,
              width: "100%",
            }}
          >
            {loading ? (
              "Loading..."
            ) : (
              <>
                {activeTab === "claim" ? <FiGift size={18} /> : <FiPlusCircle size={18} />}
                {activeTab === "claim" ? "Claim Voucher" : "Create Voucher"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Become Seller Popup
export const BecomeSellerPopup = ({
  showBecomeSeller,
  setShowBecomeSeller,
}) => {
  if (!showBecomeSeller) return null;

  const advantages = [
    { icon: FiDollarSign, title: "Earn Money", description: "Sell digital products and earn real income" },
    { icon: FiGlobe, title: "Global Reach", description: "Access customers worldwide" },
    { icon: FiSmartphone, title: "Easy Setup", description: "Start selling in minutes" },
    { icon: FiTrendingUp, title: "Grow Your Brand", description: "Build your digital business" },
    { icon: FiUsers, title: "No Inventory", description: "Sell digital products only - no shipping needed" },
  ];

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={() => setShowBecomeSeller(false)}
    >
      <div
        style={{
          width: "95%",
          maxHeight: "90%",
          backgroundColor: "#1a1a1a",
          borderRadius: 16,
          padding: 24,
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <button
            onClick={() => setShowBecomeSeller(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <FiX size={20} color="#fff" />
          </button>
          <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>
            Become a Seller
          </h3>
          <div style={{ width: 20 }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: `${colors.peach}20`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <FiShoppingBag size={40} color={colors.peach} />
          </div>
          <h4 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            Sell on Auri Mini
          </h4>
          <p style={{ color: "#888", fontSize: 14, textAlign: "center" }}>
            Join us with many sellers on Auri's digital marketplace
          </p>
        </div>

        {/* Advantages List */}
        <p style={{ color: "#fff", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
          Why Sell on Auri?
        </p>
        {advantages.map((advantage, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              padding: 12,
              backgroundColor: "#222",
              borderRadius: 12,
              border: "1px solid #333",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: `${colors.peach}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <advantage.icon size={18} color={colors.peach} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: "#fff", fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                {advantage.title}
              </p>
              <p style={{ color: "#888", fontSize: 12 }}>
                {advantage.description}
              </p>
            </div>
          </div>
        ))}

        {/* Digital Products Info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: 12,
            backgroundColor: `${colors.peach}15`,
            borderRadius: 12,
            marginTop: 16,
            gap: 12,
          }}
        >
          <FiPackage size={24} color={colors.peach} />
          <div style={{ flex: 1 }}>
            <p style={{ color: "#fff", fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
              What can I sell?
            </p>
            <p style={{ color: "#888", fontSize: 12 }}>
              Mobile data, eSIM, gift cards, game vouchers, CV designs, UI designs, illustrations, logos, and more!
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button
            onClick={() => {
              setShowBecomeSeller(false);
              window.open("mailto:innoxation.tech@gmail.com");
            }}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px 0",
              borderRadius: 8,
              border: "1px solid #333",
              backgroundColor: "transparent",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            <FiMail size={16} />
            Contact Us
          </button>
          <button
            onClick={() => {
              setShowBecomeSeller(false);
              window.open("https://seller-mini.vercel.app/", "_blank");
            }}
            style={{
              flex: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px 0",
              borderRadius: 8,
              border: "none",
              backgroundColor: colors.peach,
              color: "#fff",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            <FiExternalLink size={16} />
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

// Digital Category Popup
export const DigitalCategoryPopup = ({
  showDigitalCategory,
  setShowDigitalCategory,
  categoryTitle,
  categoryItems,
}) => {
  if (!showDigitalCategory) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={() => setShowDigitalCategory(false)}
    >
      <div
        style={{
          width: "95%",
          maxHeight: "85%",
          backgroundColor: "#1a1a1a",
          borderRadius: 16,
          padding: 20,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <button
            onClick={() => setShowDigitalCategory(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
            }}
          >
            <FiX size={20} color="#fff" />
          </button>
          <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>
            {categoryTitle || "Select Item"}
          </h3>
          <div style={{ width: 20 }} />
        </div>

        {categoryItems && categoryItems.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {categoryItems.map((item, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: 12,
                  backgroundColor: "#222",
                  borderRadius: 12,
                  border: "1px solid #333",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    backgroundColor: `${colors.peach}20`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <FiGift size={24} color={colors.peach} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: "#fff", fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                    {item.name}
                  </p>
                  <p style={{ color: "#888", fontSize: 12, marginBottom: 4 }}>
                    {item.description || "No description available"}
                  </p>
                  <p style={{ color: colors.peach, fontSize: 14, fontWeight: 700 }}>
                    ${(item.price || 0).toFixed(2)}
                  </p>
                </div>
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "none",
                    backgroundColor: colors.peach,
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  <FiShoppingBag size={14} />
                  Buy
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 40 }}>
            <FiGift size={48} color="#888" />
            <p style={{ color: "#888", fontSize: 14, marginTop: 16 }}>
              No items available in this category
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// FiPlusCircle import fix - using FiGift as fallback
const FiPlusCircle = FiGift;

