import React from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { Tooltip } from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import CancelIcon from '@mui/icons-material/Cancel';
import defaultApe from '../assets/default-ape.svg';
import { formatRespectDisplay } from '../lib/formatTokens';
import './ProfileCard.css';

// Small leaf SVG component
const Leaf = ({ className }) => (
  <div className={`leaf ${className}`}>
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
    </svg>
  </div>
);

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

  // Generate leaf elements for each edge (16 leaves per edge for uniform density)
  const topLeaves = Array.from({ length: 16 }, (_, i) => <Leaf key={`t${i+1}`} className={`leaf-t${i+1}`} />);
  const rightLeaves = Array.from({ length: 16 }, (_, i) => <Leaf key={`r${i+1}`} className={`leaf-r${i+1}`} />);
  const bottomLeaves = Array.from({ length: 16 }, (_, i) => <Leaf key={`b${i+1}`} className={`leaf-b${i+1}`} />);
  const leftLeaves = Array.from({ length: 16 }, (_, i) => <Leaf key={`l${i+1}`} className={`leaf-l${i+1}`} />);

  return (
    <div className="profile-card-wrapper">
      {/* Decorative leaves - dense border around the card */}
      {topLeaves}
      {rightLeaves}
      {bottomLeaves}
      {leftLeaves}
      
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
        src={profileUrl || defaultApe}
        alt={name}
        className="profile-card-image"
        style={{
          width: '80px',
          height: '80px',
          objectFit: 'cover',
          borderRadius: '8px',
          flexShrink: 0
        }}
      />
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <p style={{ margin: '0.5rem 0', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>Rank: {rank}</p>
        <p style={{ margin: '0.5rem 0', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}>
          <span>Name:</span>
          <Tooltip title={name} placement="top" arrow>
            <span className="profile-card-name">{name}</span>
          </Tooltip>
        </p>
        <p style={{ margin: '0.5rem 0', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
          <span>X:</span>
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
              <span className="missing-x-text" style={{ color: '#9e9e9e', fontSize: '0.7rem' }}>missing</span>
              <CancelIcon className="missing-x-icon" sx={{ fontSize: 18, color: '#f44336' }} />
            </>
          )}
        </p>
        <p style={{ margin: '0.5rem 0', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>RESPECT SCORE: {formatRespectDisplay(score)}</p>
      </div>
      </div>
    </div>
  );
};

export default ProfileCard;
