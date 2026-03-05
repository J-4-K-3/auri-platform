import React, { useState } from "react";
import { useAppTheme } from "../../theme";
import { spacing, colors } from "../../theme/tokens";
import { 
  FiMoreHorizontal, 
  FiSearch, 
  FiBell, 
  FiShoppingBag, 
  FiPlus 
} from "react-icons/fi";
import { IoChatbubbleOutline, IoHeartCircleOutline, IoOpenOutline } from "react-icons/io5";
import "./ChatsScreen.css";

export default function Chat() {
  const theme = useAppTheme();
  const [activeTab, setActiveTab] = useState("Chats");

  return (
    <div className="chatscreen-container" style={{ backgroundColor: theme.background }}>
      {/* Main Content Area - 70% */}
      <div className="chatscreen-main">
        {/* Header */}
        <div className="chatscreen-header">
          <div className="chatscreen-header-row">
            <h1 className="chatscreen-title" style={{ color: theme.text }}>Chat</h1>
            <div className="chatscreen-header-actions">
              <button 
                className="chatscreen-icon-button" 
                style={{ backgroundColor: theme.card }}
              >
                <FiMoreHorizontal size={20} color={theme.text} />
              </button>
            </div>
          </div>
        </div>

        {/* Search Input */}
        <div className="chatscreen-search-container">
          <div className="chatscreen-search-input-wrapper" style={{ backgroundColor: theme.card }}>
            <input 
              type="text" 
              className="chatscreen-search-input"
              placeholder="Search the Chat..."
              placeholderTextColor={theme.subText}
              style={{ 
                color: theme.text,
                backgroundColor: 'transparent'
              }}
            />
          </div>
        </div>

        {/* Pill Tabs */}
        <div className="chatscreen-tabs-container">
          <div className="chatscreen-pill-container" style={{ backgroundColor: theme.card }}>
            <button
              className={`chatscreen-pill-tab ${activeTab === "Chats" ? "active" : ""}`}
              style={activeTab === "Chats" ? { backgroundColor: colors.peach } : {}}
              onClick={() => setActiveTab("Chats")}
            >
              <span 
                className="chatscreen-pill-text"
                style={{ color: activeTab === "Chats" ? colors.white : theme.subText }}
              >
                Chats
              </span>
            </button>
            <button
              className={`chatscreen-pill-tab ${activeTab === "Requests" ? "active" : ""}`}
              style={activeTab === "Requests" ? { backgroundColor: colors.peach } : {}}
              onClick={() => setActiveTab("Requests")}
            >
              <span 
                className="chatscreen-pill-text"
                style={{ color: activeTab === "Requests" ? colors.white : theme.subText }}
              >
                Requests
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="chatscreen-content">
          {activeTab === "Chats" ? (
            <div className="chatscreen-tab-content">
              <div className="chat-locked-content">
                <div className="chat-lock-icon">
                  <IoChatbubbleOutline />
                </div>
                
                <h1 className="chat-title" style={{ color: theme.text }}>Chats Coming Soon</h1>
                
                <p className="chat-description" style={{ color: theme.subText }}>
                  Our full chat feature is still in development. But while we build it, 
                  we'd love to hear from you!
                </p>
                
                <div className="chat-cta-container">
                  <p className="chat-cta-text" style={{ color: theme.subText }}>
                    Swing by our mini community and drop a message, even a simple "Hi" 
                    means the world to us. It's the same place where you can leave reviews, 
                    just in the community section.
                  </p>
                  
                  <a 
                    href="https://auri-green.vercel.app/community" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="chat-community-button"
                  >
                    <IoHeartCircleOutline className="chat-community-icon" />
                    <span>Visit Community</span>
                    <IoOpenOutline className="chat-open-icon" />
                  </a>
                </div>
                
                <p className="chat-footer" style={{ color: theme.subText }}>
                  Every message helps us grow. Thanks for being part of Auri! 🧡
                </p>
              </div>
            </div>
          ) : (
            <div className="chatscreen-tab-content">
              <div className="chat-locked-content">
                <div className="chat-lock-icon">
                  <IoChatbubbleOutline />
                </div>
                
                <h1 className="chat-title" style={{ color: theme.text }}>Requests Coming Soon</h1>
                
                <p className="chat-description" style={{ color: theme.subText }}>
                  Chat requests feature is currently under development.
                </p>
                
                <div className="chat-cta-container">
                  <p className="chat-cta-text" style={{ color: theme.subText }}>
                    We're working hard to bring you this feature. Stay tuned!
                  </p>
                </div>
                
                <p className="chat-footer" style={{ color: theme.subText }}>
                  Thanks for your patience! 🧡
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar - 30% (for future use) */}
      <div 
        className="chatscreen-sidebar"
        style={{ backgroundColor: theme.card }}
      >
        <div className="chatscreen-sidebar-placeholder">
          <p style={{ color: theme.subText }}>Chat's is currently under development</p>
        </div>
      </div>
    </div>
  );
}

