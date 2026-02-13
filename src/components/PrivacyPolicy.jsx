import React from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedContent from './AnimatedContent';
import Shuffle from './Shuffle';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1.5rem' }}>
      <AnimatedContent
        distance={80}
        direction="vertical"
        reverse={false}
        duration={0.8}
        ease="power2.out"
        initialOpacity={0}
        animateOpacity
        threshold={0.2}
        delay={0.1}
      >
        <Shuffle
          text="PRIVACY POLICY"
          tag="h1"
          style={{
            fontFamily: '"Press Start 2P", sans-serif',
            fontSize: 'clamp(0.9rem, 4vw, 2rem)',
            lineHeight: 1.4,
            color: 'black',
            marginBottom: '2rem',
            textAlign: 'center'
          }}
          shuffleDirection="right"
          duration={0.35}
          animationMode="evenodd"
          shuffleTimes={1}
          ease="power3.out"
          stagger={0.03}
          threshold={0.1}
          triggerOnce={true}
        />

        <div
          style={{
            backgroundColor: '#ffffff',
            border: '4px solid #000',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '8px 8px 0 rgba(0,0,0,0.1)',
            textAlign: 'left'
          }}
        >
          <p style={{
            fontFamily: '"Press Start 2P", sans-serif',
            fontSize: '0.6rem',
            lineHeight: 2.2,
            color: '#666',
            marginBottom: '1.5rem'
          }}>
            Last updated: February 2, 2026
          </p>

          <Section title="1. INTRODUCTION">
            DAO of the Apes ("we", "our", or "the Service") respects your privacy. 
            This Privacy Policy explains how we collect, use, and protect your information when you use our decentralized application.
          </Section>

          <Section title="2. INFORMATION WE COLLECT">
            <strong>Blockchain Data (Public):</strong>
            {'\n'}• Wallet addresses
            {'\n'}• Transaction history
            {'\n'}• Smart contract interactions
            {'\n'}• Respect scores and rankings
            {'\n\n'}<strong>Profile Information (Voluntary):</strong>
            {'\n'}• Display name
            {'\n'}• Profile picture
            {'\n'}• X (Twitter) account handle
            {'\n\n'}<strong>Authentication Data:</strong>
            {'\n'}• Login credentials through Privy (email, social accounts)
            {'\n'}• Session information
          </Section>

          <Section title="3. HOW WE USE YOUR INFORMATION">
            We use collected information to:
            {'\n\n'}• Operate and maintain the Respect Game
            {'\n'}• Display leaderboards and user profiles
            {'\n'}• Process blockchain transactions
            {'\n'}• Verify X account ownership
            {'\n'}• Improve user experience
            {'\n'}• Communicate important updates
          </Section>

          <Section title="4. BLOCKCHAIN TRANSPARENCY">
            Please note that blockchain transactions are inherently public and permanent. 
            Your wallet address and all associated transactions are visible on the Base blockchain 
            and cannot be deleted or modified. This is fundamental to how blockchain technology works.
          </Section>

          <Section title="5. DATA STORAGE">
            • Profile data is stored in our secure database (Supabase)
            {'\n'}• Blockchain data is stored on the Base network
            {'\n'}• Authentication is handled by Privy with industry-standard security
            {'\n'}• Profile images are stored on decentralized storage (IPFS)
          </Section>

          <Section title="6. THIRD-PARTY SERVICES">
            We use the following third-party services:
            {'\n\n'}• <strong>Privy</strong> - Authentication and wallet management
            {'\n'}• <strong>Supabase</strong> - Database services
            {'\n'}• <strong>Base Network</strong> - Blockchain infrastructure
            {'\n'}• <strong>X (Twitter)</strong> - Account verification
            {'\n\n'}Each service has its own privacy policy governing how they handle your data.
          </Section>

          <Section title="7. DATA SHARING">
            We do not sell your personal information. We may share data:
            {'\n\n'}• As required by law or legal process
            {'\n'}• To protect our rights or safety
            {'\n'}• With service providers who assist our operations
            {'\n'}• When you explicitly consent to sharing
          </Section>

          <Section title="8. YOUR RIGHTS">
            You have the right to:
            {'\n\n'}• Update or correct your profile information
            {'\n'}• Request deletion of off-chain data
            {'\n'}• Disconnect your wallet at any time
            {'\n'}• Opt out of non-essential communications
            {'\n\n'}Note: On-chain data cannot be deleted due to blockchain immutability.
          </Section>

          <Section title="9. SECURITY">
            We implement reasonable security measures to protect your information:
            {'\n\n'}• Encrypted data transmission (HTTPS)
            {'\n'}• Secure authentication protocols
            {'\n'}• Regular security audits
            {'\n'}• Smart contract security reviews
            {'\n\n'}However, no system is 100% secure. Use strong passwords and protect your private keys.
          </Section>

          <Section title="10. COOKIES & LOCAL STORAGE">
            We use browser storage to:
            {'\n\n'}• Maintain your session
            {'\n'}• Remember your preferences
            {'\n'}• Improve performance
            {'\n\n'}You can clear this data through your browser settings.
          </Section>

          <Section title="11. CHILDREN'S PRIVACY">
            The Service is not intended for users under 18 years of age. 
            We do not knowingly collect information from minors.
          </Section>

          <Section title="12. CHANGES TO THIS POLICY">
            We may update this Privacy Policy periodically. 
            We will notify users of material changes through the Service or other appropriate means.
          </Section>

          <Section title="13. CONTACT US">
            For privacy-related questions or requests, contact us through:
            {'\n\n'}• Telegram: t.me/daooftheapes
            {'\n'}• X: @DAOOFTHEAPES
          </Section>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                fontFamily: '"Press Start 2P", sans-serif',
                fontSize: '0.7rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '9999px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#333'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#000'}
            >
              BACK TO HOME
            </button>
          </div>
        </div>
      </AnimatedContent>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div style={{ marginBottom: '1.5rem' }}>
    <h2 style={{
      fontFamily: '"Press Start 2P", sans-serif',
      fontSize: '0.7rem',
      lineHeight: 1.6,
      color: '#000',
      marginBottom: '0.75rem'
    }}>
      {title}
    </h2>
    <p style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '0.9rem',
      lineHeight: 1.8,
      color: '#333',
      whiteSpace: 'pre-wrap'
    }}>
      {children}
    </p>
  </div>
);

export default PrivacyPolicy;

