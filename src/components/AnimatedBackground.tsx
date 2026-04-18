import React from 'react';

interface AnimatedBackgroundProps {
  url?: string;
}

const AnimatedBackground = React.memo(({ url }: AnimatedBackgroundProps) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        backgroundColor: 'var(--color-background)',
        backgroundImage: url ? `url(${url})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        animation: 'bgZoom 20s ease-in-out infinite alternate',
        filter: 'brightness(0.3) blur(2px)',
        pointerEvents: 'none',
        border: '2px solid red',
      }}
    />
  );
});

AnimatedBackground.displayName = 'AnimatedBackground';

export default AnimatedBackground;
