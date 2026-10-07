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
  const canvasRef = useRef(null);
  const loadedImagesRef = useRef({});

  // Preload frames for smooth rotation
  useEffect(() => {
    let loadedCount = 0;

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFramePath(i);
      img.onload = () => {
        loadedImagesRef.current[i] = img;
        loadedCount++;
        if (loadedCount >= 5) {
          setIsLoaded(true);
        }
      };
    }
  }, []);

  // Canvas renderer with Chroma-Key Background Removal
  const renderFrame = (frameNum) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = loadedImagesRef.current[frameNum];
    if (!img) return;

    // Set canvas dimensions
    const width = 960;
    const height = 540;
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    // Clear previous render
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    // Get pixel data to key out dark navy background
    try {
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Detect dark navy studio background (low R, low G, low B)
        // Background pixels typically have R < 35, G < 48, B < 75
        if (r < 35 && g < 48 && b < 75) {
          const maxVal = Math.max(r, g, b);
          if (maxVal < 22) {
            data[i + 3] = 0; // 100% transparent
          } else if (maxVal < 42) {
            // Smooth edge alpha transition
            const alpha = (maxVal - 22) / 20;
            data[i + 3] = Math.floor(Math.max(0, Math.min(1, alpha)) * 255);
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
    } catch (e) {
      // Fallback if canvas security blocks imageData
    }
  };

  // Re-render canvas whenever currentFrame updates
  useEffect(() => {
    renderFrame(currentFrame);
  }, [currentFrame, isLoaded]);

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
    }, 45); // Smooth rotation speed

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
        width: `${size * 1.35}px`
      }}
      onMouseDown={(e) => handleStart(e.clientX)}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
    >
      {/* Soft Ambient Gold Lighting Behind Diamond */}
      <div
        className="position-absolute top-50 start-50 translate-middle pointer-events-none"
        style={{
          width: `${size * 0.9}px`,
          height: `${size * 0.9}px`,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.2) 0%, rgba(14, 165, 233, 0.08) 50%, transparent 75%)',
          filter: 'blur(35px)',
          zIndex: 0
        }}
      />

      {/* Hardware-Accelerated Canvas for 100% Transparent Diamond & Stand Rendering */}
      <div
        className="position-relative overflow-visible d-flex justify-content-center align-items-center"
        style={{
          width: '100%',
          maxWidth: `${size * 1.3}px`,
          zIndex: 1
        }}
      >
        <canvas
          ref={canvasRef}
          className="w-100 h-auto"
          style={{
            transform: 'scale(1.18)',
            transformOrigin: 'center center',
            filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.5))'
          }}
        />
      </div>

      {/* Sleek Floating 360 Control Indicator Badge */}
      <div
        className="mt-1 px-3.5 py-1.5 rounded-pill shadow-lg text-center d-inline-flex align-items-center gap-2"
        style={{
          background: 'rgba(7, 18, 36, 0.85)',
          border: '1px solid rgba(212, 175, 55, 0.4)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
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
