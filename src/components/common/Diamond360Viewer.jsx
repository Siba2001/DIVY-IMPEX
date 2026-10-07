import React, { useState, useEffect, useRef } from 'react';

const TOTAL_FRAMES = 120;

const getFramePath = (index) => {
  const frameNum = String(index).padStart(3, '0');
  return `/divy_impex 360Degree Images/diamond_${frameNum}.jpg`;
};

const Diamond360Viewer = ({ size = 370, className = "" }) => {
  const [currentFrame, setCurrentFrame] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const frameIndexRef = useRef(1);
  const autoRotateRef = useRef(null);

  // Preload frames for smooth rotation
  useEffect(() => {
    let loadedCount = 0;
    const images = [];

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFramePath(i);
      img.onload = () => {
        loadedCount++;
        if (loadedCount >= 10) {
          setIsLoaded(true);
        }
      };
      images.push(img);
    }
  }, []);

  // Continuous smooth 360° auto-rotation
  useEffect(() => {
    autoRotateRef.current = setInterval(() => {
      if (!isDragging) {
        setCurrentFrame((prev) => {
          const next = prev >= TOTAL_FRAMES ? 1 : prev + 1;
          frameIndexRef.current = next;
          return next;
        });
      }
    }, 50); // Smooth rotation speed

    return () => {
      if (autoRotateRef.current) clearInterval(autoRotateRef.current);
    };
  }, [isDragging]);

  // Mouse & Touch Drag Handler
  const handleStart = (clientX) => {
    setIsDragging(true);
    startXRef.current = clientX;
  };

  const handleMove = (clientX) => {
    if (!isDragging) return;
    const deltaX = clientX - startXRef.current;
    if (Math.abs(deltaX) > 3) {
      const sensitivity = 0.4;
      let newFrame = Math.round(frameIndexRef.current - deltaX * sensitivity) % TOTAL_FRAMES;
      if (newFrame <= 0) newFrame += TOTAL_FRAMES;
      setCurrentFrame(newFrame);
      frameIndexRef.current = newFrame;
      startXRef.current = clientX;
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      className={`position-relative d-inline-flex flex-column align-items-center justify-content-center user-select-none ${className}`}
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        maxWidth: '100%',
        width: `${size * 1.3}px`
      }}
      onMouseDown={(e) => handleStart(e.clientX)}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
    >
      {/* Subtle Gold Spotlight Soft Ambient Glow Behind Diamond */}
      <div
        className="position-absolute top-50 start-50 translate-middle pointer-events-none"
        style={{
          width: `${size * 0.95}px`,
          height: `${size * 0.95}px`,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.16) 0%, rgba(14, 31, 57, 0.4) 50%, transparent 75%)',
          filter: 'blur(30px)',
          zIndex: 0
        }}
      />

      {/* Pure Frameless 360 Diamond & Stand Container */}
      <div
        className="position-relative overflow-visible d-flex justify-content-center align-items-center"
        style={{
          width: '100%',
          maxWidth: `${size * 1.3}px`,
          zIndex: 1,
          WebkitMaskImage: 'radial-gradient(ellipse 70% 80% at 50% 50%, black 65%, transparent 100%)',
          maskImage: 'radial-gradient(ellipse 70% 80% at 50% 50%, black 65%, transparent 100%)'
        }}
      >
        <img
          src={getFramePath(currentFrame)}
          alt={`DIVY IMPEX 360 Diamond View - Frame ${currentFrame}`}
          className="w-100 h-auto object-fit-contain"
          draggable={false}
          style={{
            filter: 'contrast(1.08) brightness(1.08)',
            mixBlendMode: 'lighten',
            transform: 'scale(1.15)',
            transformOrigin: 'center center'
          }}
        />
      </div>

      {/* Sleek Floating 360 Control Indicator Badge */}
      <div
        className="mt-1 px-3.5 py-1.5 rounded-pill shadow-lg text-center d-inline-flex align-items-center gap-2"
        style={{
          background: 'rgba(7, 18, 36, 0.75)',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
          zIndex: 2
        }}
      >
        <span className="small font-heading fw-bold" style={{ color: '#FDE68A', fontSize: '0.75rem', letterSpacing: '0.08em' }}>
          ✨ 360° REAL DIAMOND VIEW • DRAG TO ROTATE
        </span>
      </div>
    </div>
  );
};

export default Diamond360Viewer;
