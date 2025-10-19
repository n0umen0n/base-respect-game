import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import VerifiedIcon from '@mui/icons-material/Verified';
import CancelIcon from '@mui/icons-material/Cancel';
import profileImage from '../assets/profile.jpg';
import { formatRespectDisplay } from '../lib/formatTokens';
import './ProfileCard.css';

const ProfileCard = ({ rank, name, x, score, profileUrl, xVerified, style, walletAddress }) => {
  const navigate = useNavigate();
  const { user, login } = usePrivy();
  
  const handleCardClick = () => {
    if (walletAddress) {
      navigate(`/profile/${walletAddress}`);
    }
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
              <VerifiedIcon sx={{ fontSize: 18, color: '#4CAF50' }} />
            </>
          ) : (
            <>
              <span style={{ color: '#9e9e9e', fontSize: '0.7rem' }}>missing</span>
              <CancelIcon sx={{ fontSize: 18, color: '#f44336' }} />
            </>
          )}
        </p>
        <p style={{ margin: '0.5rem 0', fontSize: '0.8rem' }}>RESPECT SCORE: {formatRespectDisplay(score)}</p>
      </div>
    </div>
  );
};

export default ProfileCard;
