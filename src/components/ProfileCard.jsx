import React from 'react';
import profileImage from '../assets/profile.jpg';
import './ProfileCard.css';

const ProfileCard = ({ rank, name, x, score, profileUrl, xVerified, style }) => {
  const handleCardClick = () => {
    window.open('https://google.com', '_blank', 'noopener,noreferrer');
  };

  const handleLinkClick = (e) => {
    e.stopPropagation();
  };

  const hasXAccount = x && x.trim() !== '';

  return (
    <div
      onClick={handleCardClick}
      className="profile-card-container"
      style={{
        padding: '1rem',
        backgroundColor: '#f5f5f5',
        borderRadius: 16,
        textAlign: 'left',
        fontFamily: '"Press Start 2P", sans-serif',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        ...style
      }}
    >
      <img
        src={profileUrl || profileImage}
        alt={name}
        style={{
          width: '90px',
          height: '90px',
          objectFit: 'cover',
          borderRadius: '8px',
          flexShrink: 0
        }}
      />
      <div>
        <p style={{ margin: '0.5rem 0', fontSize: '0.8rem' }}>Rank: {rank}</p>
        <p style={{ margin: '0.5rem 0', fontSize: '0.8rem' }}>Name: {name}</p>
        <p style={{ margin: '0.5rem 0', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>X: </span>
          {hasXAccount ? (
            <>
              <a
                href={`https://x.com/${x.substring(1)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleLinkClick}
                className="x-link"
                style={{ color: '#1da1f2', textDecoration: 'none' }}
              >
                {x}
              </a>
              <svg
                className="verified-tick"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                style={{ width: '18px', height: '18px', color: '#4CAF50', marginLeft: '-2px' }}
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  d="M5 13l4 4L19 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </>
          ) : (
            <>
              <span style={{ color: '#9e9e9e', fontStyle: 'italic', fontSize: '0.7rem' }}>missing</span>
              <svg
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                style={{ width: '18px', height: '18px', color: '#f44336', transform: 'rotate(45deg)' }}
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  d="M12 2 L12 22 M2 12 L22 12"
                  strokeLinecap="round"
                />
              </svg>
            </>
          )}
        </p>
        <p style={{ margin: '0.5rem 0', fontSize: '0.8rem' }}>RESPECT SCORE: {score}</p>
      </div>
    </div>
  );
};

export default ProfileCard;
