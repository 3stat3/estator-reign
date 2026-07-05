import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SplashScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing');
  const [showContent, setShowContent] = useState(false);
  const [displayedTitle, setDisplayedTitle] = useState('');
  const [titleIndex, setTitleIndex] = useState(0);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [spotlightX, setSpotlightX] = useState(-100);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const fullTitle = 'Estator Reign';
  const loadingMessages = [
    { at: 0, text: 'Initializing' },
    { at: 20, text: 'Loading modules' },
    { at: 40, text: 'Preparing estate tools' },
    { at: 60, text: 'Securing your data' },
    { at: 80, text: 'Almost ready' },
    { at: 95, text: 'Finalizing' },
  ];

  // Check for system theme preference
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
  }, []);

  // Check for returning user
  useEffect(() => {
    const hasVisited = localStorage.getItem('estator_visited');
    if (hasVisited) {
      setIsReturningUser(true);
    } else {
      localStorage.setItem('estator_visited', 'true');
    }
  }, []);

  // Spotlight sweep animation
  useEffect(() => {
    const interval = setInterval(() => {
      setSpotlightX(prev => {
        if (prev >= 150) {
          clearInterval(interval);
          return 150;
        }
        return prev + 0.5;
      });
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // Letter-by-letter title reveal
  useEffect(() => {
    if (titleIndex < fullTitle.length) {
      const timer = setTimeout(() => {
        setDisplayedTitle(prev => prev + fullTitle[titleIndex]);
        setTitleIndex(prev => prev + 1);
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [titleIndex]);

  useEffect(() => {
    setTimeout(() => setShowContent(true), 300);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        const increment = prev < 80 ? 2 : prev < 95 ? 1.2 : 0.5;
        return Math.min(prev + increment, 100);
      });
    }, 30);

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

    const timer = setTimeout(() => {
      if (onComplete) {
        document.querySelector('.splash-container')?.classList.add('fade-out');
        setTimeout(() => onComplete(), 800);
      }
    }, isReturningUser ? 2800 : 4200);

    return () => {
      clearInterval(progressInterval);
      clearInterval(textInterval);
      clearTimeout(timer);
    };
  }, [onComplete, isReturningUser]);

  // Gold particles
  const goldParticles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 2 + Math.random() * 4,
    duration: 2 + Math.random() * 3,
    delay: Math.random() * 2,
    opacity: 0.2 + Math.random() * 0.3,
  }));

  return (
    <AnimatePresence>
      <motion.div 
        className={`splash-container ${isDarkMode ? 'dark' : 'light'}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Background */}
        <div className="splash-bg-gradient">
          <div className="gradient-layer gradient-1" />
          <div className="gradient-layer gradient-2" />
          <div className="gradient-layer gradient-3" />
        </div>

        {/* Gold Particles */}
        <div className="gold-particles">
          {goldParticles.map((particle) => (
            <motion.div
              key={particle.id}
              className="gold-particle"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: particle.size,
                height: particle.size,
                opacity: 0,
              }}
              animate={{
                opacity: [0, particle.opacity, 0],
                y: ['0px', '-100px', '-200px'],
                x: ['0px', `${Math.random() * 60 - 30}px`, `${Math.random() * 80 - 40}px`],
                scale: [0, 1.5, 0.5],
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>

        {/* Glow Orbs */}
        <div className="glow-orb glow-orb-1" />
        <div className="glow-orb glow-orb-2" />
        <div className="glow-orb glow-orb-3" />

        {/* Main Content */}
        <motion.div
          className="splash-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: showContent ? 1 : 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Logo with Gold Ring */}
          <div className="logo-wrapper">
            <div className="logo-container">
              {/* Gold Rotating Ring */}
              <motion.div
                className="gold-ring"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <svg viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="url(#goldRingGradient)"
                    strokeWidth="2"
                    strokeDasharray="10 20"
                    opacity="0.4"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    fill="none"
                    stroke="url(#goldRingGradient)"
                    strokeWidth="2"
                    strokeDasharray="5 30"
                    opacity="0.25"
                    strokeDashoffset="15"
                  />
                  <defs>
                    <linearGradient id="goldRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFD700" />
                      <stop offset="50%" stopColor="#FFA500" />
                      <stop offset="100%" stopColor="#FFD700" />
                    </linearGradient>
                  </defs>
                </svg>
              </motion.div>

              {/* Progress Ring */}
              <svg className="progress-ring" viewBox="0 0 120 120">
                <circle
                  className="progress-ring-bg"
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="rgba(255,215,0,0.08)"
                  strokeWidth="3"
                />
                <motion.circle
                  className="progress-ring-fill"
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="url(#goldRingGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="339.292"
                  strokeDashoffset={339.292}
                  animate={{
                    strokeDashoffset: 339.292 - (progress / 100) * 339.292,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </svg>

              {/* Logo Icon */}
              <motion.div 
                className="logo-icon"
                animate={{
                  boxShadow: [
                    '0 20px 60px rgba(255,215,0,0.15)',
                    '0 20px 80px rgba(255,215,0,0.3)',
                    '0 20px 60px rgba(255,215,0,0.15)',
                  ],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <div className="gold-shimmer" />
              </motion.div>

              {/* Percentage */}
              <div className="progress-percentage">
                {Math.round(progress)}%
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="splash-title">
            <span className="title-light">{displayedTitle}</span>
            <span className="cursor-blink">|</span>
          </h1>

          {/* Tagline */}
          <motion.p
            className="splash-tagline"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 10 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          >
            Estate Management at its Finest
          </motion.p>

          <motion.p
            className="splash-subtagline"
            initial={{ opacity: 0 }}
            animate={{ opacity: showContent ? 1 : 0 }}
            transition={{ delay: 1.0, duration: 0.8 }}
          >
            Philippine Estate Tax Solutions
          </motion.p>

          {/* Loading Section */}
          <motion.div 
            className="splash-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: showContent ? 1 : 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <div className="splash-loading-header">
              <span className="splash-loading-label">{loadingText}</span>
              {isReturningUser && (
                <span className="returning-badge">✦ Welcome Back</span>
              )}
            </div>

            <div className="progress-track">
              <motion.div
                className="progress-bar"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
              <div className="progress-glow" style={{ width: `${progress}%` }} />
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            className="splash-footer"
            initial={{ opacity: 0 }}
            animate={{ opacity: showContent ? 1 : 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <div className="footer-line" />
            <p>© 2026 Estator Reign. All rights reserved.</p>
            <div className="footer-badges">
              <span className="badge premium">✦ Premium</span>
              <span className="badge">Secure</span>
              <span className="badge">Trusted</span>
            </div>
          </motion.div>
        </motion.div>

        <style>{`
          .splash-container {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          }

          /* Dark Mode */
          .splash-container.dark {
            background: #0a0a12;
          }

          .splash-container.dark .splash-title {
            color: #ffffff;
          }

          .splash-container.dark .splash-tagline {
            color: rgba(255, 215, 0, 0.6);
          }

          .splash-container.dark .splash-subtagline {
            color: rgba(255, 255, 255, 0.25);
          }

          .splash-container.dark .splash-loading-label {
            color: rgba(255, 255, 255, 0.3);
          }

          .splash-container.dark .splash-footer p {
            color: rgba(255, 255, 255, 0.1);
          }

          .splash-container.dark .badge {
            color: rgba(255, 255, 255, 0.12);
            border-color: rgba(255, 255, 255, 0.04);
          }

          .splash-container.dark .badge.premium {
            color: rgba(255, 215, 0, 0.4);
            border-color: rgba(255, 215, 0, 0.08);
          }

          .splash-container.dark .footer-line {
            background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.1), transparent);
          }

          .splash-container.dark .progress-track {
            background: rgba(255, 215, 0, 0.04);
          }

          .splash-container.dark .returning-badge {
            color: rgba(255, 215, 0, 0.4);
            border-color: rgba(255, 215, 0, 0.08);
            background: rgba(255, 215, 0, 0.04);
          }

          /* Light Mode */
          .splash-container.light {
            background: #f5f0eb;
          }

          .splash-container.light .splash-title {
            color: #1a1a2e;
          }

          .splash-container.light .splash-tagline {
            color: rgba(180, 120, 50, 0.8);
          }

          .splash-container.light .splash-subtagline {
            color: rgba(26, 26, 46, 0.3);
          }

          .splash-container.light .splash-loading-label {
            color: rgba(26, 26, 46, 0.4);
          }

          .splash-container.light .splash-footer p {
            color: rgba(26, 26, 46, 0.15);
          }

          .splash-container.light .badge {
            color: rgba(26, 26, 46, 0.2);
            border-color: rgba(26, 26, 46, 0.06);
          }

          .splash-container.light .badge.premium {
            color: rgba(180, 120, 50, 0.5);
            border-color: rgba(180, 120, 50, 0.1);
          }

          .splash-container.light .footer-line {
            background: linear-gradient(90deg, transparent, rgba(180, 120, 50, 0.1), transparent);
          }

          .splash-container.light .progress-track {
            background: rgba(180, 120, 50, 0.06);
          }

          .splash-container.light .returning-badge {
            color: rgba(180, 120, 50, 0.5);
            border-color: rgba(180, 120, 50, 0.08);
            background: rgba(180, 120, 50, 0.04);
          }

          .splash-container.light .gold-particle {
            background: radial-gradient(circle, #D4A574, #C4956A);
          }

          .splash-container.light .logo-icon {
            background: linear-gradient(135deg, #f5f0eb, #e8e0d8);
            border-color: rgba(180, 120, 50, 0.2);
          }

          .splash-container.light .logo-icon svg {
            color: #C4956A;
          }

          .splash-container.light .glow-orb-1 {
            background: rgba(180, 120, 50, 0.06);
          }

          .splash-container.light .glow-orb-2 {
            background: rgba(180, 120, 50, 0.04);
          }

          .splash-container.light .glow-orb-3 {
            background: rgba(180, 120, 50, 0.02);
          }

          .splash-container.light .gradient-1 {
            background: radial-gradient(ellipse at 30% 40%, rgba(180, 120, 50, 0.06) 0%, transparent 60%);
          }

          .splash-container.light .gradient-2 {
            background: radial-gradient(ellipse at 70% 60%, rgba(180, 120, 50, 0.04) 0%, transparent 60%);
          }

          .splash-container.light .gradient-3 {
            background: radial-gradient(ellipse at 50% 80%, rgba(180, 120, 50, 0.03) 0%, transparent 60%);
          }

          .splash-container.light .progress-percentage {
            color: rgba(180, 120, 50, 0.5);
            background: rgba(245, 240, 235, 0.9);
            border-color: rgba(180, 120, 50, 0.08);
          }

          .splash-container.light .splash-title .title-light {
            color: #1a1a2e;
          }

          .splash-container.light .cursor-blink {
            color: #C4956A;
          }

          .splash-container.light .progress-bar {
            background: linear-gradient(90deg, #D4A574, #C4956A);
          }

          .splash-container.light .progress-glow {
            background: linear-gradient(90deg, transparent, rgba(180, 120, 50, 0.1), transparent);
          }

          /* Fade out transition */
          .splash-container.fade-out {
            opacity: 0;
            transform: scale(0.98);
            filter: blur(10px);
          }

          /* Gradient Background */
          .splash-bg-gradient {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            overflow: hidden;
          }

          .gradient-layer {
            position: absolute;
            top: -50%;
            left: -50%;
            right: -50%;
            bottom: -50%;
            border-radius: 50%;
            animation: gradientFloat 25s ease-in-out infinite alternate;
          }

          .gradient-1 {
            animation-delay: 0s;
          }

          .gradient-2 {
            animation-delay: -8s;
          }

          .gradient-3 {
            animation-delay: -16s;
          }

          @keyframes gradientFloat {
            0% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(5%, -5%) scale(1.1); }
            66% { transform: translate(-5%, 5%) scale(0.9); }
            100% { transform: translate(3%, -3%) scale(1.05); }
          }

          /* Gold Particles */
          .gold-particles {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            overflow: hidden;
          }

          .gold-particle {
            position: absolute;
            border-radius: 50%;
            background: radial-gradient(circle, #FFD700, #FFA500);
            box-shadow: 0 0 10px rgba(255, 215, 0, 0.2);
          }

          /* Glow Orbs */
          .glow-orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            pointer-events: none;
          }

          .glow-orb-1 {
            width: 500px;
            height: 500px;
            top: -200px;
            right: -200px;
            animation: orbFloat 15s ease-in-out infinite;
          }

          .glow-orb-2 {
            width: 400px;
            height: 400px;
            bottom: -150px;
            left: -150px;
            animation: orbFloat 18s ease-in-out infinite reverse;
          }

          .glow-orb-3 {
            width: 300px;
            height: 300px;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            animation: orbFloat 20s ease-in-out infinite;
          }

          @keyframes orbFloat {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-40px, 30px) scale(1.1); }
          }

          .splash-content {
            position: relative;
            z-index: 10;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
            padding: 2rem;
            text-align: center;
            max-width: 420px;
            width: 100%;
          }

          /* Logo */
          .logo-wrapper {
            margin-bottom: 0.5rem;
          }

          .logo-container {
            position: relative;
            width: 130px;
            height: 130px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .gold-ring {
            position: absolute;
            top: -5px;
            left: -5px;
            width: 140px;
            height: 140px;
            opacity: 0.6;
          }

          .progress-ring {
            position: absolute;
            top: 0;
            left: 0;
            width: 130px;
            height: 130px;
            transform: rotate(-90deg);
          }

          .progress-ring-bg {
            stroke: rgba(255, 215, 0, 0.08);
          }

          .progress-ring-fill {
            filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.1));
            transition: stroke-dashoffset 0.3s ease;
          }

          .logo-icon {
            position: relative;
            width: 62px;
            height: 62px;
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            border-radius: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid rgba(255, 215, 0, 0.15);
            overflow: hidden;
            z-index: 2;
          }

          .logo-icon svg {
            width: 34px;
            height: 34px;
            color: #FFD700;
            position: relative;
            z-index: 2;
          }

          .gold-shimmer {
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(
              135deg,
              transparent 30%,
              rgba(255, 215, 0, 0.05) 50%,
              transparent 70%
            );
            animation: shimmer 3s ease-in-out infinite;
          }

          @keyframes shimmer {
            0% { transform: translateX(-100%) rotate(45deg); }
            100% { transform: translateX(100%) rotate(45deg); }
          }

          .progress-percentage {
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.08em;
            padding: 2px 12px;
            border-radius: 12px;
            border: 1px solid rgba(255, 215, 0, 0.06);
            z-index: 3;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: rgba(10, 10, 18, 0.9);
            color: rgba(255, 215, 0, 0.4);
          }

          .splash-title {
            font-size: 2.75rem;
            font-weight: 700;
            margin: 0;
            letter-spacing: -0.02em;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }

          .title-light {
            background: linear-gradient(135deg, #FFD700, #FFA500);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .cursor-blink {
            -webkit-text-fill-color: #FFD700;
            animation: blink 1s step-end infinite;
          }

          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }

          .splash-tagline {
            font-size: 0.95rem;
            margin: -0.5rem 0 0 0;
            font-weight: 400;
            letter-spacing: 0.12em;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-style: italic;
          }

          .splash-subtagline {
            font-size: 0.7rem;
            margin: -0.25rem 0 0 0;
            font-weight: 400;
            letter-spacing: 0.2em;
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
            font-weight: 400;
            letter-spacing: 0.08em;
          }

          .returning-badge {
            font-size: 0.55rem;
            padding: 2px 12px;
            border-radius: 12px;
            border: 1px solid;
            letter-spacing: 0.08em;
            font-weight: 400;
          }

          .progress-track {
            position: relative;
            width: 100%;
            height: 2px;
            border-radius: 2px;
            overflow: hidden;
          }

          .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #FFD700, #FFA500);
            border-radius: 2px;
            transition: width 0.15s ease;
          }

          .progress-glow {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.15), transparent);
            filter: blur(4px);
            transition: width 0.15s ease;
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
          }

          .splash-footer p {
            font-size: 0.6rem;
            margin: 0;
            letter-spacing: 0.05em;
          }

          .footer-badges {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
            justify-content: center;
          }

          .badge {
            font-size: 0.5rem;
            padding: 0.15rem 0.6rem;
            border: 1px solid;
            border-radius: 2rem;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            font-weight: 500;
          }

          .badge.premium {
            border-color: rgba(255, 215, 0, 0.15);
          }

          /* Mobile Responsive */
          @media (max-width: 768px) {
            .splash-title {
              font-size: 2.25rem;
            }
            .logo-container {
              width: 110px;
              height: 110px;
            }
            .gold-ring {
              width: 120px;
              height: 120px;
            }
            .progress-ring {
              width: 110px;
              height: 110px;
            }
            .logo-icon {
              width: 54px;
              height: 54px;
            }
            .logo-icon svg {
              width: 28px;
              height: 28px;
            }
            .splash-content {
              padding: 1.5rem;
              gap: 1.25rem;
            }
            .splash-tagline {
              font-size: 0.85rem;
            }
            .glow-orb-1 {
              width: 300px;
              height: 300px;
            }
            .glow-orb-2 {
              width: 250px;
              height: 250px;
            }
            .progress-percentage {
              font-size: 10px;
              bottom: -8px;
            }
          }

          @media (max-width: 480px) {
            .splash-title {
              font-size: 1.75rem;
            }
            .logo-container {
              width: 90px;
              height: 90px;
            }
            .gold-ring {
              width: 100px;
              height: 100px;
            }
            .progress-ring {
              width: 90px;
              height: 90px;
            }
            .logo-icon {
              width: 44px;
              height: 44px;
              border-radius: 14px;
            }
            .logo-icon svg {
              width: 24px;
              height: 24px;
            }
            .splash-content {
              padding: 1rem;
              gap: 1rem;
            }
            .splash-tagline {
              font-size: 0.75rem;
            }
            .splash-subtagline {
              font-size: 0.6rem;
            }
            .progress-percentage {
              font-size: 9px;
              bottom: -6px;
              padding: 1px 8px;
            }
            .splash-loading-label {
              font-size: 0.6rem;
            }
            .returning-badge {
              font-size: 0.5rem;
              padding: 1px 8px;
            }
            .badge {
              font-size: 0.45rem;
              padding: 0.1rem 0.5rem;
            }
            .splash-footer p {
              font-size: 0.5rem;
            }
          }

          /* Small phones */
          @media (max-width: 380px) {
            .splash-title {
              font-size: 1.5rem;
            }
            .logo-container {
              width: 80px;
              height: 80px;
            }
            .gold-ring {
              width: 90px;
              height: 90px;
            }
            .progress-ring {
              width: 80px;
              height: 80px;
            }
            .logo-icon {
              width: 38px;
              height: 38px;
              border-radius: 12px;
            }
            .logo-icon svg {
              width: 20px;
              height: 20px;
            }
            .splash-content {
              padding: 0.75rem;
              gap: 0.75rem;
            }
            .splash-tagline {
              font-size: 0.65rem;
            }
            .splash-subtagline {
              font-size: 0.5rem;
            }
            .progress-percentage {
              font-size: 8px;
              bottom: -5px;
              padding: 1px 6px;
            }
            .gold-particles {
              display: none;
            }
          }

          /* Landscape phones */
          @media (max-width: 768px) and (orientation: landscape) {
            .splash-content {
              flex-direction: row;
              flex-wrap: wrap;
              justify-content: center;
              max-width: 90%;
              gap: 0.75rem;
            }
            .logo-wrapper {
              margin-bottom: 0;
            }
            .logo-container {
              width: 80px;
              height: 80px;
            }
            .gold-ring {
              width: 90px;
              height: 90px;
            }
            .progress-ring {
              width: 80px;
              height: 80px;
            }
            .logo-icon {
              width: 40px;
              height: 40px;
            }
            .logo-icon svg {
              width: 22px;
              height: 22px;
            }
            .splash-title {
              font-size: 1.5rem;
            }
            .splash-tagline {
              font-size: 0.7rem;
            }
            .splash-subtagline {
              font-size: 0.55rem;
            }
            .splash-loading {
              max-width: 200px;
            }
            .splash-footer {
              margin-top: 0;
            }
          }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
};

export default SplashScreen;