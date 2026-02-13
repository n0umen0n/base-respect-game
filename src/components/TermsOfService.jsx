import React from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedContent from './AnimatedContent';
import Shuffle from './Shuffle';

const TermsOfService = () => {
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
          text="TERMS OF SERVICE"
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

          <Section title="1. ACCEPTANCE OF TERMS">
            By accessing or using DAO of the Apes ("the Service"), you agree to be bound by these Terms of Service. 
            If you do not agree to these terms, please do not use the Service.
          </Section>

          <Section title="2. DESCRIPTION OF SERVICE">
            DAO of the Apes is a decentralized application (dApp) that facilitates the Respect Game, 
            a peer-to-peer consensus mechanism for distributing $RESOURCE tokens based on community recognition of contributions. 
            The Service operates on the Base blockchain network.
          </Section>

          <Section title="3. ELIGIBILITY">
            You must be at least 18 years old to use the Service. By using the Service, 
            you represent and warrant that you meet this age requirement and have the legal capacity to enter into these Terms.
          </Section>

          <Section title="4. USER RESPONSIBILITIES">
            You are responsible for:
            {'\n\n'}• Maintaining the security of your wallet and private keys
            {'\n'}• All activities conducted through your account
            {'\n'}• Complying with all applicable laws and regulations
            {'\n'}• Providing accurate information when creating your profile
          </Section>

          <Section title="5. BLOCKCHAIN TRANSACTIONS">
            All transactions on the Service are executed on the blockchain and are irreversible. 
            You acknowledge that:
            {'\n\n'}• Transaction fees (gas) are required and non-refundable
            {'\n'}• Smart contract interactions carry inherent risks
            {'\n'}• We cannot reverse or modify blockchain transactions
            {'\n'}• Token values may fluctuate significantly
          </Section>

          <Section title="6. PROHIBITED CONDUCT">
            You agree not to:
            {'\n\n'}• Manipulate the Respect Game through collusion or fraudulent activities
            {'\n'}• Create multiple accounts to gain unfair advantages
            {'\n'}• Attempt to exploit or attack the smart contracts
            {'\n'}• Use the Service for any illegal purposes
            {'\n'}• Harass, abuse, or harm other users
          </Section>

          <Section title="7. INTELLECTUAL PROPERTY">
            The Service and its original content, features, and functionality are owned by DAO of the Apes 
            and are protected by international copyright, trademark, and other intellectual property laws.
          </Section>

          <Section title="8. DISCLAIMER OF WARRANTIES">
            THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. 
            WE DO NOT GUARANTEE UNINTERRUPTED ACCESS, ERROR-FREE OPERATION, OR SPECIFIC OUTCOMES FROM PARTICIPATION.
          </Section>

          <Section title="9. LIMITATION OF LIABILITY">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, DAO OF THE APES SHALL NOT BE LIABLE FOR ANY INDIRECT, 
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR TOKENS.
          </Section>

          <Section title="10. MODIFICATIONS">
            We reserve the right to modify these Terms at any time. Continued use of the Service after changes 
            constitutes acceptance of the new Terms. We will make reasonable efforts to notify users of significant changes.
          </Section>

          <Section title="11. GOVERNING LAW">
            These Terms shall be governed by and construed in accordance with applicable laws, 
            without regard to conflict of law principles.
          </Section>

          <Section title="12. CONTACT">
            For questions about these Terms, please reach out through our official channels:
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

export default TermsOfService;

