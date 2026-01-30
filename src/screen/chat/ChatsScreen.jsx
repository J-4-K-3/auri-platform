import './ChatsScreen.css';
import { useAppTheme } from '../../theme';
import { IoChatbubbleOutline, IoHeartCircleOutline, IoOpenOutline } from 'react-icons/io5';

export default function Chat() {
  const theme = useAppTheme();

  return (
    <div className="chat-container" style={{ backgroundColor: theme.background }}>
      <div className="chat-locked-content">
        <div className="chat-lock-icon">
          <IoChatbubbleOutline />
        </div>
        
        <h1 className="chat-title" style={{ color: theme.text }}>Chats Coming Soon</h1>
        
        <p className="chat-description" style={{ color: theme.text }}>
          Our full chat feature is still in development. But while we build it, 
          we'd love to hear from you!
        </p>
        
        <div className="chat-cta-container">
          <p className="chat-cta-text" style={{ color: theme.text }}>
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
        
        <p className="chat-footer" style={{ color: theme.text }}>
          Every message helps us grow. Thanks for being part of Auri! 🧡
        </p>
      </div>
    </div>
  )
}
