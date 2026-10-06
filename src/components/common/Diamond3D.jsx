import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Diamond3D = ({ size = 380 }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 0.2, 5.5);

    // Renderer with transparency & antialiasing
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    container.appendChild(renderer.domElement);

    // Load exact brilliant diamond photo texture with transparent background
    const textureLoader = new THREE.TextureLoader();
    const diamondTexture = textureLoader.load('/images/brilliant_diamond_transparent.png');
    diamondTexture.colorSpace = THREE.SRGBColorSpace;

    // Double-sided 3D Plane Mesh for exact photorealistic diamond render
    const geometry = new THREE.PlaneGeometry(3.2, 3.2);
    const material = new THREE.MeshBasicMaterial({
      map: diamondTexture,
      transparent: true,
      side: THREE.DoubleSide,
      alphaTest: 0.05
    });

    const diamondMesh = new THREE.Mesh(geometry, material);
    scene.add(diamondMesh);

    // Ground Reflection Shadow
    const shadowTexture = textureLoader.load('/images/brilliant_diamond_transparent.png');
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide
    });
    const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), shadowMat);
    shadowMesh.rotation.x = Math.PI / 2;
    shadowMesh.position.set(0, -1.8, 0);
    shadowMesh.scale.set(1, -0.6, 1);
    scene.add(shadowMesh);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambientLight);

    // Mouse interaction for 360-degree manual rotation
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotationY = 0;

    const handleMouseDown = (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      targetRotationY += deltaX * 0.015;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const domElem = renderer.domElement;
    domElem.style.cursor = 'grab';
    domElem.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Touch support for 360 rotation
    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const handleTouchMove = (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePosition.x;
      targetRotationY += deltaX * 0.015;
      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const handleTouchEnd = () => {
      isDragging = false;
    };

    domElem.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    // 360-Degree Continuous Rotation Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Continuous 360-degree Y-axis spin
      if (!isDragging) {
        targetRotationY += 0.018;
      }

      // Smooth 360 rotation & floating bobbing motion
      diamondMesh.rotation.y += (targetRotationY - diamondMesh.rotation.y) * 0.1;
      diamondMesh.position.y = Math.sin(elapsedTime * 1.8) * 0.12;

      // Subtle scale pulse for extra brilliance shine
      const scale = 1 + Math.sin(elapsedTime * 2.5) * 0.02;
      diamondMesh.scale.set(scale, scale, scale);

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      domElem.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domElem.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      diamondTexture.dispose();
      renderer.dispose();
    };
  }, [size]);

  return (
    <div className="d-flex flex-column align-items-center justify-content-center position-relative">
      <div
        ref={mountRef}
        style={{ width: size, height: size }}
        className="d-flex align-items-center justify-content-center"
      />
    </div>
  );
};

export default Diamond3D;
