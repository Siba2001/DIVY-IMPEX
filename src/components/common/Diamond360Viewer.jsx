import React, { useState, useEffect, useRef } from 'react';

const TOTAL_FRAMES = 120;

const getFramePathPNG = (index) => {
  const frameNum = String(index).padStart(3, '0');
  return `/divy_impex 360Degree Images/diamond_${frameNum}.png`;
};

const getFramePathJPG = (index) => {
  const frameNum = String(index).padStart(3, '0');
  return `/divy_impex 360Degree Images/diamond_${frameNum}.jpg`;
};

const Diamond360Viewer = ({ size = 410, className = "" }) => {
  const [currentFrame, setCurrentFrame] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef(null);
  const startXRef = useRef(0);
  const frameIndexRef = useRef(1);
  const autoRotateRef = useRef(null);
  const canvasRef = useRef(null);
  const loadedImagesRef = useRef({});

  // Preload frames (supports both .png and .jpg automatically)
  useEffect(() => {
    let loadedCount = 0;

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFramePathPNG(i);
      img.onload = () => {
        loadedImagesRef.current[i] = img;
        loadedCount++;
        if (loadedCount >= 1) {
          setIsLoaded(true);
        }
      };
      img.onerror = () => {
        // Fallback to .jpg if .png is not found
        const imgJpg = new Image();
        imgJpg.src = getFramePathJPG(i);
        imgJpg.onload = () => {
          loadedImagesRef.current[i] = imgJpg;
          loadedCount++;
          if (loadedCount >= 1) {
            setIsLoaded(true);
          }
        };
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

    // Get pixel data to key out dark navy background if needed
    try {
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        const pixelIdx = i / 4;
        const y = Math.floor(pixelIdx / width);

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Detect dark navy studio background
        if (r < 42 && g < 55 && b < 85) {
          const maxVal = Math.max(r, g, b);
          if (maxVal < 25) {
            data[i + 3] = 0; // 100% transparent
          } else if (maxVal < 50) {
            // Smooth edge alpha transition
            const alpha = (maxVal - 25) / 25;
            data[i + 3] = Math.floor(Math.max(0, Math.min(1, alpha)) * 255);
          }
        }

        // Smooth bottom edge fade to eliminate hard horizontal cut lines under the stand
        const bottomThreshold = height * 0.94;
        if (y > bottomThreshold) {
          const bottomFade = Math.max(0, (height - y) / (height - bottomThreshold));
          data[i + 3] = Math.floor(data[i + 3] * bottomFade);
        }
      }

      ctx.putImageData(imgData, 0, 0);
    } catch (e) {
      // Fallback
    }
  };

  // Re-render canvas whenever currentFrame or isLoaded updates
  useEffect(() => {
    renderFrame(currentFrame);
  }, [currentFrame, isLoaded]);

  // Continuous smooth 360° auto-rotation
  useEffect(() => {
    autoRotateRef.current = setInterval(() => {
      if (!isDragging && !isHovering) {
        setCurrentFrame((prev) => {
          const next = prev >= TOTAL_FRAMES ? 1 : prev + 1;
          frameIndexRef.current = next;
          return next;
        });
      }
    }, 40);

    return () => {
      if (autoRotateRef.current) clearInterval(autoRotateRef.current);
    };
  }, [isDragging, isHovering]);

  // Mouse & Touch Drag & Hover Controls
  const handleMouseMove = (e) => {
    if (isDragging) {
      const deltaX = e.clientX - startXRef.current;
      if (Math.abs(deltaX) > 2) {
        const sensitivity = 0.4;
        let newFrame = Math.round(frameIndexRef.current - deltaX * sensitivity) % TOTAL_FRAMES;
        if (newFrame <= 0) newFrame += TOTAL_FRAMES;
        setCurrentFrame(newFrame);
        frameIndexRef.current = newFrame;
        startXRef.current = e.clientX;
      }
    } else if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const ratio = relativeX / rect.width;
      let frame = Math.floor(ratio * TOTAL_FRAMES) + 1;
      frame = Math.max(1, Math.min(TOTAL_FRAMES, frame));
      setCurrentFrame(frame);
      frameIndexRef.current = frame;
    }
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setIsDragging(false);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    startXRef.current = e.clientX;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    startXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - startXRef.current;
    if (Math.abs(deltaX) > 2) {
      const sensitivity = 0.4;
      let newFrame = Math.round(frameIndexRef.current - deltaX * sensitivity) % TOTAL_FRAMES;
      if (newFrame <= 0) newFrame += TOTAL_FRAMES;
      setCurrentFrame(newFrame);
      frameIndexRef.current = newFrame;
      startXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Current image fallback src
  const fallbackSrc = loadedImagesRef.current[currentFrame]?.src || getFramePathPNG(currentFrame);

  return (
    <div
      ref={containerRef}
      className={`position-relative d-inline-flex flex-column align-items-center justify-content-center user-select-none ${className}`}
      style={{
        cursor: isDragging ? 'grabbing' : 'pointer',
        maxWidth: '100%',
        width: `${size * 1.35}px`
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Soft Ambient Gold Lighting Behind Diamond */}
      <div
        className="position-absolute top-50 start-50 translate-middle pointer-events-none"
        style={{
          width: `${size * 0.9}px`,
          height: `${size * 0.9}px`,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.22) 0%, rgba(14, 165, 233, 0.08) 50%, transparent 75%)',
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
          minHeight: `${size * 0.85}px`,
          zIndex: 1
        }}
      >
        <canvas
          ref={canvasRef}
          className="w-100 h-auto"
          style={{
            transform: 'scale(1.06)',
            transformOrigin: 'center center',
            filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.5))',
            display: isLoaded ? 'block' : 'none'
          }}
        />

        {/* Fallback Direct Image if Canvas is Initializing */}
        {!isLoaded && (
          <img
            src={fallbackSrc}
            alt={`DIVY IMPEX 360 Diamond View - Frame ${currentFrame}`}
            className="w-100 h-auto object-fit-contain"
            draggable={false}
            style={{
              filter: 'contrast(1.08) brightness(1.08)',
              mixBlendMode: 'lighten',
              transform: 'scale(1.18)',
              transformOrigin: 'center center'
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Diamond360Viewer;
