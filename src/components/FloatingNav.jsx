import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FiHome,
  FiPlayCircle,
  FiSun,
  FiMessageCircle,
  FiUser,
} from "react-icons/fi";
import { useAppTheme } from "../theme";
import "./FloatingNav.css";

const navItems = [
  { name: "HomeStack", label: "Home", icon: FiHome, path: "/home" },
  { name: "ReelsStack", label: "Reels", icon: FiPlayCircle, path: "/reels" },
  { name: "MomentsStack", label: "Moments", icon: FiSun, path: "/moments" },
  { name: "ChatStack", label: "Chat", icon: FiMessageCircle, path: "/chat" },
  { name: "ProfileStack", label: "Profile", icon: FiUser, path: "/profile" },
];

export const FloatingNav = ({ currentUser: propUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("HomeStack");

  // Get theme from context
  const theme = useAppTheme();

  // Get user from Redux as fallback
  const reduxUser = useSelector((state) => state.users.byId[state.auth.userId]);
  const currentUser = propUser || reduxUser;

  const handleNavigate = (item) => {
    setActiveTab(item.name);
    navigate(item.path);
  };

  const isActive = (name) => activeTab === name;

  React.useEffect(() => {
    const currentItem = navItems.find(
      (item) => item.path === location.pathname,
    );
    if (currentItem) {
      setActiveTab(currentItem.name);
    }
  }, [location.pathname]);

  // Get profile avatar - try multiple sources
  const profileAvatar = currentUser?.avatarUri || reduxUser?.avatarUri;

  return (
    <nav className="floating-nav">
      <div
        className="floating-nav-inner"
        style={{
          "--navBar": theme.navBar,
          "--card": theme.card,
          "--border": theme.border,
          "--subText": theme.subText,
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.name);

          if (item.name === "ProfileStack") {
            return (
              <button
                key={item.name}
                className={`nav-item profile-item ${active ? "active" : ""}`}
                onClick={() => handleNavigate(item)}
                aria-label={item.label}
              >
                <div className="profile-bubble">
                  {profileAvatar ? (
                    <img
                      src={profileAvatar}
                      alt="Profile"
                      className="profile-avatar"
                    />
                  ) : (
                    <Icon size={20} className="nav-icon" />
                  )}
                </div>
                <span className="nav-label">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.name}
              className={`nav-item ${active ? "active" : ""}`}
              onClick={() => handleNavigate(item)}
              aria-label={item.label}
            >
              <Icon size={active ? 22 : 20} className="nav-icon" />
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default FloatingNav;
