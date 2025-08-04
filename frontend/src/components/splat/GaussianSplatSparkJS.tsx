import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SplatMesh } from '@sparkjsdev/spark';

interface GaussianSplatSparkJSProps {
  assetUrl?: string;
}

export function GaussianSplatSparkJS({ assetUrl }: GaussianSplatSparkJSProps) {
  console.log('🎬 SparkJS GaussianSplat component rendered with assetUrl:', assetUrl);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const splatMeshRef = useRef<SplatMesh | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Three.js scene (runs only once)
  useEffect(() => {
    console.log('🎬 Initializing Three.js scene...');
    
    if (!containerRef.current) {
      console.error('Container ref is null');
      return;
    }

    try {
      // Create scene
      sceneRef.current = new THREE.Scene();
      console.log('✅ Scene created');

      // Create camera (matching online viewer settings)
      const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
      cameraRef.current.position.set(0, 0, 3);
      console.log('✅ Camera created');

      // Create renderer
      rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      rendererRef.current.setClearColor(0x000000, 0);
      containerRef.current.appendChild(rendererRef.current.domElement);
      console.log('✅ Renderer created and attached');

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      sceneRef.current.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 10, 5);
      sceneRef.current.add(directionalLight);
      console.log('✅ Lighting added');

      // Add a test cube to verify rendering
      const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(0, 0, -2);
      sceneRef.current.add(cube);
      console.log('✅ Test cube added');

      // Animation loop
      const animate = () => {
        if (sceneRef.current && cameraRef.current && rendererRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
          
          // Rotate the test cube
          cube.rotation.x += 0.01;
          cube.rotation.y += 0.01;
          
          // Rotate the splat mesh if it exists
          if (splatMeshRef.current) {
            splatMeshRef.current.rotation.y += 0.01;
          }
        }
        animationIdRef.current = requestAnimationFrame(animate);
      };
      animate();
      console.log('✅ Animation loop started');

      // Handle window resize
      const handleResize = () => {
        if (containerRef.current && cameraRef.current && rendererRef.current) {
          const width = containerRef.current.clientWidth;
          const height = containerRef.current.clientHeight;
          
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(width, height);
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current);
        }
        if (rendererRef.current && containerRef.current) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
      };
    } catch (err) {
      console.error('❌ Error initializing Three.js scene:', err);
      setError(`Failed to initialize 3D scene: ${err}`);
    }
  }, []);

  // Load splat file when assetUrl changes
  useEffect(() => {
    if (!assetUrl || !sceneRef.current) {
      console.log('⏳ Waiting for assetUrl or scene to be ready...');
      return;
    }

    console.log('🎬 Loading splat file:', assetUrl);
    setIsLoading(true);
    setError(null);

    // Remove existing splat mesh
    if (splatMeshRef.current) {
      sceneRef.current.remove(splatMeshRef.current);
      splatMeshRef.current = null;
      console.log('🧹 Removed existing splat mesh');
    }

    fetch(assetUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.arrayBuffer();
      })
      .then(arrayBuffer => {
        console.log('✅ File fetched successfully, size:', arrayBuffer.byteLength, 'bytes');
        
        // Create blob from array buffer
        const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
        const blobUrl = URL.createObjectURL(blob);
        console.log('🔗 Created blob URL:', blobUrl);

        // Wait a bit for the blob to be ready
        setTimeout(() => {
          try {
            // Create SplatMesh (matching online viewer approach)
            console.log('🎬 Creating SplatMesh...');
            const splatMesh = new SplatMesh({ url: blobUrl });
            
            // Position the splat mesh (matching online viewer)
            splatMesh.position.set(0, 0, -3);
            splatMesh.quaternion.set(1, 0, 0, 0);
            
            // Add to scene
            sceneRef.current!.add(splatMesh);
            splatMeshRef.current = splatMesh;
            
            console.log('✅ SplatMesh created and added to scene:', splatMesh);
            
            // Clean up blob URL
            URL.revokeObjectURL(blobUrl);
            
            setIsLoading(false);
          } catch (err) {
            console.error('❌ Error creating SplatMesh:', err);
            setError(`Failed to create SplatMesh: ${err}`);
            setIsLoading(false);
            URL.revokeObjectURL(blobUrl);
          }
        }, 100); // Small delay to ensure blob is ready
      })
      .catch(err => {
        console.error('❌ Error loading splat file:', err);
        setError(`Failed to load splat file: ${err.message}`);
        setIsLoading(false);
      });
  }, [assetUrl]);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={containerRef} 
        className="w-full h-full bg-gray-900"
        style={{ minHeight: '400px' }}
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="bg-white p-4 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm">Loading 3D scene...</p>
          </div>
        </div>
      )}
      
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-red-900/80 flex items-center justify-center z-10">
          <div className="bg-white p-4 rounded-lg max-w-md">
            <h3 className="text-red-600 font-bold mb-2">Error Loading 3D Scene</h3>
            <p className="text-sm text-gray-700">{error}</p>
          </div>
        </div>
      )}
      
      {/* Debug info */}
      <div className="absolute top-2 left-2 z-20 bg-black/80 p-2 rounded text-xs text-white">
        <div>SparkJS Component</div>
        <div>Asset URL: {assetUrl ? 'Present' : 'None'}</div>
        <div>Scene: {sceneRef.current ? 'Ready' : 'Not ready'}</div>
        <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
        <div>SplatMesh: {splatMeshRef.current ? 'Loaded' : 'Not loaded'}</div>
      </div>
    </div>
  );
} 