import './MomentsScreen.css';
import { IoPeopleOutline, IoStarOutline, IoOpenOutline } from 'react-icons/io5';
import { useAppTheme } from '../../theme';

export default function Moments() {
  const theme = useAppTheme();
  
  return (
    <div className="moments-container" style={{ backgroundColor: theme.background }}>
      <div className="moments-locked-content">
        <div className="moments-lock-icon">
          <IoPeopleOutline />
        </div>
        
        <h1 className="moments-title" style={{ color: theme.text }}>Moments Coming Soon</h1>
        
        <p className="moments-description" style={{ color: theme.text }}>
          We're building something special! Moments will unlock once our community 
          reaches the right size. This feature is designed to bring our community 
          closer together through shared experiences and memories.
        </p>
        
        <div className="moments-cta-container">
          <p className="moments-cta-text" style={{ color: theme.text }}>
            While you wait, help us grow by leaving a review!
          </p>
          
          <a 
            href="https://auri-green.vercel.app/reviews" 
            target="_blank" 
            rel="noopener noreferrer"
            className="moments-review-button"
          >
            <IoStarOutline className="moments-review-icon" />
            <span style={{ color: 'white' }}>Review Auri</span>
            <IoOpenOutline className="moments-open-icon" />
          </a>
        </div>
        
        <p className="moments-footer" style={{ color: theme.text }}>
          Thank you for being part of our community. Together, we're building 
          something amazing!
        </p>
      </div>
    </div>
  )
}
