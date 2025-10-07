import React from 'react';
import profileImage from '../assets/profile.jpg';
import './ProfileCard.css';

const ProfileCard = ({ rank, name, x, score, style }) => {
  const handleCardClick = () => {
    window.open('https://google.com', '_blank', 'noopener,noreferrer');
  };

  const handleLinkClick = (e) => {
    e.stopPropagation();
  };

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
        src={profileImage}
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
        <p style={{ margin: '0.5rem 0', fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>
          <span>
            X:{' '}
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
          </span>
          <svg
            className="verified-tick"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
              d="M5 13l4 4L19 7"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </p>
        <p style={{ margin: '0.5rem 0', fontSize: '0.8rem' }}>RESPECT SCORE: {score}</p>
      </div>
    </div>
  );
};

export default ProfileCard;
