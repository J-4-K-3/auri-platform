import React from 'react';
import { FiPlus } from 'react-icons/fi';
import { Avatar } from './Avatar';
import { useAppTheme } from '../theme';
import './StoryRing.css';

export const StoryRing = ({ uri, size = 72, isCurrentUser, showPlus }) => {
  const theme = useAppTheme();
  const showPlusIcon = showPlus !== undefined ? showPlus : isCurrentUser;

  return (
    <div className="storyring-wrapper">
      <div className="storyring-ring">
        <Avatar uri={uri} size={size} ring />
      </div>
      {showPlusIcon && (
        <div
          className="storyring-plus"
          style={{
            backgroundColor: theme.colors?.peach || '#FF8A65',
          }}
        >
          <FiPlus size={10} color="#fff" />
        </div>
      )}
    </div>
  );
};

export default StoryRing;

