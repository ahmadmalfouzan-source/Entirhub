import React, { useMemo, useEffect, useState } from 'react';

export function StarField() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const stars = useMemo(() => {
    // Generate fewer stars on mobile
    const count = isMobile ? 80 : 150;
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1, // 1px to 3px
      duration: Math.random() * 3 + 2, // 2s to 5s
      delay: Math.random() * 5, // 0s to 5s
    }));
  }, [isMobile]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#040714]">
      <style>
        {`
          @keyframes disney-twinkle {
            0%, 100% { 
              opacity: 0.1; 
              transform: scale(0.8); 
            }
            50% { 
              opacity: 1; 
              transform: scale(1.2); 
              box-shadow: 0 0 6px 1px rgba(255, 255, 255, 0.4); 
            }
          }
        `}
      </style>
      
      {/* Dynamic Star Elements */}
      {stars.map((star) => (
        <div
          key={star.id}
          style={{
            position: 'absolute',
            top: `${star.y}%`,
            left: `${star.x}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: '#ffffff',
            borderRadius: '50%',
            opacity: 0.1, // Initial state
            animation: `disney-twinkle ${star.duration}s infinite ease-in-out ${star.delay}s`
          }}
        />
      ))}
      
      {/* Background radial gradient for depth */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[50vh] bg-blue-900/10 rounded-full blur-[120px]" />
    </div>
  );
}
