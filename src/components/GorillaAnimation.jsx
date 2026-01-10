import React, { useEffect, useState, useRef } from 'react';
import './GorillaAnimation.css';

const GorillaAnimation = ({ show = true, delay = 1000 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState(0);
  const [isBeating, setIsBeating] = useState(false);
  const [showHorde, setShowHorde] = useState(false);
  const [hordeApes, setHordeApes] = useState([]);
  const animationRef = useRef(null);
  const timeoutRef = useRef(null);
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (!show || hasRunRef.current) return;

    const showTimer = setTimeout(() => {
      setIsVisible(true);
      hasRunRef.current = true;
      setPosition(window.innerWidth + 150);
      runAnimation();
    }, delay);

    return () => {
      clearTimeout(showTimer);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [show, delay]);

  const runAnimation = () => {
    let startTime = null;
    const startPosition = window.innerWidth + 150;
    const centerPosition = window.innerWidth / 2 - 60;
    const enterDuration = 3000;

    const animateEnter = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / enterDuration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setPosition(startPosition - (startPosition - centerPosition) * easeOut);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateEnter);
      } else {
        setIsBeating(true);
        
        timeoutRef.current = setTimeout(() => {
          setIsBeating(false);
          animateExit();
        }, 2500);
      }
    };

    const animateExit = () => {
      let exitStart = null;
      const startPos = centerPosition;
      const endPos = -150;
      const exitDuration = 2000;

      const exitFrame = (timestamp) => {
        if (!exitStart) exitStart = timestamp;
        const progress = Math.min((timestamp - exitStart) / exitDuration, 1);
        const easeIn = progress * progress;
        
        setPosition(startPos - (startPos - endPos) * easeIn);
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(exitFrame);
        } else {
          setIsVisible(false);
          // Start the horde!
          startHorde();
        }
      };

      animationRef.current = requestAnimationFrame(exitFrame);
    };

    animationRef.current = requestAnimationFrame(animateEnter);
  };

  const startHorde = () => {
    setShowHorde(true);
    
    // Create 100 apes with random properties
    const apes = [];
    for (let i = 0; i < 100; i++) {
      apes.push({
        id: i,
        delay: i * 150 + Math.random() * 200, // Staggered start
        speed: 2500 + Math.random() * 2000, // Random speed (2.5-4.5s)
        jumpHeight: 15 + Math.random() * 50, // Random jump height (15-65px)
        jumpSpeed: 0.2 + Math.random() * 0.15, // Random jump speed
        size: 80 + Math.random() * 60, // Random size (80-140px)
        willScream: Math.random() > 0.6, // 40% chance to scream
        screamDelay: 500 + Math.random() * 1500, // When to scream during run
      });
    }
    setHordeApes(apes);
  };

  if (!isVisible && !showHorde) return null;

  return (
    <div className="gorilla-container">
      {/* Lead ape */}
      {isVisible && (
        <div 
          className={`gorilla-wrapper ${isBeating ? 'beating' : 'running'}`}
          style={{ left: `${position}px` }}
        >
          <span className="gorilla-emoji">🦍</span>
          
          {isBeating && (
            <div className="roar-effects">
              <div className="roar-text">OOH OOH AHH!</div>
            </div>
          )}
        </div>
      )}
      
      {/* The horde */}
      {showHorde && hordeApes.map((ape) => (
        <HordeApe key={ape.id} {...ape} />
      ))}
    </div>
  );
};

// Individual horde ape component
const HordeApe = ({ delay, speed, jumpHeight, jumpSpeed, size, willScream, screamDelay }) => {
  const [position, setPosition] = useState(window.innerWidth + 150);
  const [isActive, setIsActive] = useState(false);
  const [isScreaming, setIsScreaming] = useState(false);
  const animationRef = useRef(null);

  useEffect(() => {
    const startTimer = setTimeout(() => {
      setIsActive(true);
      runAcross();
    }, delay);

    return () => {
      clearTimeout(startTimer);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isActive || !willScream) return;
    
    const screamTimer = setTimeout(() => {
      setIsScreaming(true);
      setTimeout(() => setIsScreaming(false), 800);
    }, screamDelay);

    return () => clearTimeout(screamTimer);
  }, [isActive, willScream, screamDelay]);

  const runAcross = () => {
    let startTime = null;
    const startPos = window.innerWidth + 150;
    const endPos = -200;

    const frame = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / speed, 1);
      
      setPosition(startPos - (startPos - endPos) * progress);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(frame);
      }
    };

    animationRef.current = requestAnimationFrame(frame);
  };

  if (!isActive) return null;

  return (
    <div 
      className="horde-ape running"
      style={{ 
        left: `${position}px`,
        bottom: '-10px',
        '--jump-height': `${jumpHeight}px`,
        '--jump-speed': `${jumpSpeed}s`,
      }}
    >
      <span className="gorilla-emoji" style={{ fontSize: `${size}px` }}>🦍</span>
      {isScreaming && (
        <div className="roar-effects">
          <div className="roar-text small">OOH!</div>
        </div>
      )}
    </div>
  );
};

export default GorillaAnimation;


