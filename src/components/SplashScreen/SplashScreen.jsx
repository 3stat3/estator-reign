import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SplashScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing');
  const [showContent, setShowContent] = useState(false);

  const loadingMessages = [
    { at: 0, text: 'Initializing' },
    { at: 20, text: 'Loading modules' },
    { at: 40, text: 'Preparing estate tools' },
    { at: 60, text: 'Securing your data' },
    { at: 80, text: 'Almost ready' },
    { at: 95, text: 'Finalizing' },
  ];

  useEffect(() => {
    // Show content with fade in
    setTimeout(() => setShowContent(true), 100);

    // Animate progress bar
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        // Slow down near the end for realism
        const increment = prev < 80 ? 2 : prev < 95 ? 1.2 : 0.5;
        return Math.min(prev + increment, 100);
      });
    }, 30);

    // Update loading text based on progress
    const textInterval = setInterval(() => {
      setProgress(currentProgress => {
        const matched = loadingMessages
          .filter(msg => currentProgress >= msg.at)
          .pop();
        if (matched) {
          setLoadingText(matched.text);
        }
        return currentProgress;
      });
    }, 100);

    // Auto-complete after 3.5 seconds
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 3500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(textInterval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  // Particles data
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    size: Math.random() * 6 + 2,
    duration: Math.random() * 15 + 10,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.4 + 0.1,
  }));

  return (
    <AnimatePresence>
      <motion.div 
        className="splash-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Animated Gradient Background */}
        <div className="splash-bg-gradient" />
        
        {/* Grid Pattern Overlay */}
        <div className="splash-grid-overlay" />

        {/* Floating Particles */}
        <div className="splash-particles">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="particle"
              style={{
                left: `${particle.left}%`,
                width: particle.size,
                height: particle.size,
                opacity: particle.opacity,
              }}
              animate={{
                y: ['100vh', '-100vh'],
                x: ['0px', `${(Math.random() - 0.5) * 100}px`],
                rotate: [0, 360],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
                ease: 'linear',
              }}
            />
          ))}
        </div>

        {/* Glow Orbs */}
        <div className="glow-orb glow-orb-1" />
        <div className="glow-orb glow-orb-2" />

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: showContent ? 1 : 0, scale: showContent ? 1 : 0.95 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="splash-content"
        >
          {/* Logo Section */}
          <motion.div 
            className="splash-logo"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div className="splash-logo-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <div className="logo-ring">
                <div className="ring ring-1" />
                <div className="ring ring-2" />
                <div className="ring ring-3" />
              </div>
            </div>
            
            <motion.h1 
              className="splash-title"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Estator<span>Reign</span>
            </motion.h1>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="splash-tagline"
          >
            Philippine Estate Tax Management
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="splash-subtagline"
          >
            Simplify · Secure · Smart
          </motion.p>

          {/* Loading Section */}
          <motion.div 
            className="splash-loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            <div className="splash-loading-header">
              <span className="splash-loading-label">{loadingText}</span>
              <span className="splash-loading-percent">{Math.round(progress)}%</span>
            </div>

            <div className="splash-progress-track">
              <motion.div
                className="splash-progress-bar"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
              <div className="progress-glow" style={{ width: `${progress}%` }} />
            </div>

            {/* Progress dots */}
            <div className="progress-dots">
              {[0, 25, 50, 75, 100].map((dot, index) => (
                <motion.div
                  key={index}
                  className={`progress-dot ${progress >= dot ? 'active' : ''}`}
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ 
                    scale: progress >= dot ? 1 : 0.8,
                    opacity: progress >= dot ? 1 : 0.5,
                  }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="splash-footer"
          >
            <div className="footer-line" />
            <p>© 2026 Estator Reign. All rights reserved.</p>
            <div className="footer-badges">
              <span className="badge">Secure</span>
              <span className="badge">Compliant</span>
              <span className="badge">Trusted</span>
            </div>
          </motion.div>

          {/* Version */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="splash-version"
          >
            v2.0.0
          </motion.div>
        </motion.div>

        <style>{`
          .splash-container {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: #0a0e1a;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }

          /* Animated Gradient Background */
          .splash-bg-gradient {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
              radial-gradient(ellipse at 20% 50%, rgba(102, 126, 234, 0.08) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 50%, rgba(118, 75, 162, 0.08) 0%, transparent 60%),
              radial-gradient(ellipse at 50% 100%, rgba(102, 126, 234, 0.04) 0%, transparent 50%);
            animation: gradientPulse 4s ease-in-out infinite alternate;
          }

          @keyframes gradientPulse {
            0% { opacity: 0.6; }
            100% { opacity: 1; }
          }

          /* Grid Pattern */
          .splash-grid-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: 
              linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
            background-size: 60px 60px;
            opacity: 0.5;
          }

          /* Glow Orbs */
          .glow-orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            pointer-events: none;
          }

          .glow-orb-1 {
            width: 400px;
            height: 400px;
            top: -100px;
            right: -100px;
            background: rgba(102, 126, 234, 0.15);
            animation: orbFloat 8s ease-in-out infinite;
          }

          .glow-orb-2 {
            width: 300px;
            height: 300px;
            bottom: -50px;
            left: -50px;
            background: rgba(118, 75, 162, 0.15);
            animation: orbFloat 10s ease-in-out infinite reverse;
          }

          @keyframes orbFloat {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-30px, 20px) scale(1.1); }
          }

          /* Particles */
          .splash-particles {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            overflow: hidden;
          }

          .particle {
            position: absolute;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.4), rgba(118, 75, 162, 0.4));
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(102, 126, 234, 0.2);
          }

          /* Logo Ring Animation */
          .splash-logo-icon {
            position: relative;
            width: 5.5rem;
            height: 5.5rem;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 1.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 20px 60px rgba(102, 126, 234, 0.4);
            transition: transform 0.3s ease;
          }

          .splash-logo-icon svg {
            width: 2.75rem;
            height: 2.75rem;
            color: white;
            position: relative;
            z-index: 2;
          }

          .logo-ring {
            position: absolute;
            top: -8px;
            left: -8px;
            right: -8px;
            bottom: -8px;
            pointer-events: none;
          }

          .ring {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: 1.75rem;
            border: 2px solid rgba(102, 126, 234, 0.2);
            animation: ringPulse 3s ease-in-out infinite;
          }

          .ring-1 {
            animation-delay: 0s;
          }
          .ring-2 {
            animation-delay: 0.5s;
            border-color: rgba(102, 126, 234, 0.1);
          }
          .ring-3 {
            animation-delay: 1s;
            border-color: rgba(118, 75, 162, 0.1);
          }

          @keyframes ringPulse {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(1.3); opacity: 0; }
          }

          .splash-content {
            position: relative;
            z-index: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
            padding: 3rem;
            text-align: center;
            max-width: 420px;
            width: 100%;
          }

          .splash-logo {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.75rem;
            cursor: default;
          }

          .splash-title {
            font-size: 2.75rem;
            font-weight: 800;
            color: white;
            margin: 0;
            letter-spacing: -0.02em;
            background: linear-gradient(135deg, #ffffff 0%, #94a3b8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .splash-title span {
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .splash-tagline {
            font-size: 1rem;
            color: rgba(255, 255, 255, 0.6);
            margin: -0.25rem 0 0 0;
            font-weight: 400;
            letter-spacing: 0.08em;
          }

          .splash-subtagline {
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.3);
            margin: -0.5rem 0 0 0;
            font-weight: 400;
            letter-spacing: 0.15em;
            text-transform: uppercase;
          }

          .splash-loading {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            width: 100%;
            margin-top: 0.5rem;
          }

          .splash-loading-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
          }

          .splash-loading-label {
            font-size: 0.7rem;
            color: rgba(255, 255, 255, 0.4);
            font-weight: 500;
            letter-spacing: 0.05em;
          }

          .splash-loading-percent {
            font-size: 0.7rem;
            color: rgba(255, 255, 255, 0.6);
            font-weight: 600;
            font-variant-numeric: tabular-nums;
          }

          .splash-progress-track {
            position: relative;
            width: 100%;
            height: 4px;
            background: rgba(255, 255, 255, 0.06);
            border-radius: 2px;
            overflow: hidden;
          }

          .splash-progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2, #667eea);
            background-size: 200% 100%;
            border-radius: 2px;
            transition: width 0.15s ease;
            animation: shimmer 2s linear infinite;
          }

          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }

          .progress-glow {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent);
            filter: blur(4px);
            transition: width 0.15s ease;
          }

          .progress-dots {
            display: flex;
            justify-content: space-between;
            width: 100%;
            padding: 0 2px;
          }

          .progress-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
          }

          .progress-dot.active {
            background: linear-gradient(135deg, #667eea, #764ba2);
            box-shadow: 0 0 12px rgba(102, 126, 234, 0.4);
          }

          .splash-footer {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.75rem;
            width: 100%;
            margin-top: 0.5rem;
          }

          .footer-line {
            width: 40px;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          }

          .splash-footer p {
            font-size: 0.65rem;
            color: rgba(255, 255, 255, 0.15);
            margin: 0;
            letter-spacing: 0.05em;
          }

          .footer-badges {
            display: flex;
            gap: 0.75rem;
          }

          .badge {
            font-size: 0.55rem;
            color: rgba(255, 255, 255, 0.2);
            padding: 0.2rem 0.6rem;
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 2rem;
            letter-spacing: 0.05em;
            text-transform: uppercase;
          }

          .splash-version {
            position: fixed;
            bottom: 1rem;
            right: 1.5rem;
            font-size: 0.6rem;
            color: rgba(255, 255, 255, 0.08);
            letter-spacing: 0.05em;
            font-weight: 400;
          }

          @media (max-width: 640px) {
            .splash-title {
              font-size: 2.25rem;
            }
            .splash-logo-icon {
              width: 4.5rem;
              height: 4.5rem;
            }
            .splash-logo-icon svg {
              width: 2.25rem;
              height: 2.25rem;
            }
            .splash-content {
              padding: 2rem;
              gap: 1.25rem;
            }
            .splash-tagline {
              font-size: 0.875rem;
            }
            .glow-orb-1 {
              width: 250px;
              height: 250px;
            }
            .glow-orb-2 {
              width: 200px;
              height: 200px;
            }
            .splash-version {
              bottom: 0.75rem;
              right: 1rem;
            }
            .footer-badges {
              flex-wrap: wrap;
              justify-content: center;
            }
          }

          @media (max-width: 480px) {
            .splash-title {
              font-size: 1.75rem;
            }
            .splash-logo-icon {
              width: 3.75rem;
              height: 3.75rem;
              border-radius: 1rem;
            }
            .splash-logo-icon svg {
              width: 1.75rem;
              height: 1.75rem;
            }
            .splash-content {
              padding: 1.5rem;
            }
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
};

export default SplashScreen;