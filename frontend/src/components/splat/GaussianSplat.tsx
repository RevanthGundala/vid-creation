import { useEffect, useRef } from 'react';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';

export function GaussianSplat() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<GaussianSplats3D.Viewer | undefined>(undefined);

  useEffect(() => {
    console.log('GaussianSplat component mounted');
    
    if (!containerRef.current) {
      console.error('Container ref is null');
      return;
    }

    try {
      console.log('Creating GaussianSplats3D viewer...');
      
      // Create the viewer
      viewerRef.current = new GaussianSplats3D.Viewer({
        'cameraUp': [0, -1, -0.6],
        'initialCameraPosition': [-1, -4, 6],
        'initialCameraLookAt': [0, 4, 0]
      });

      console.log('Viewer created:', viewerRef.current);

      // Attach the viewer's renderer DOM element to the container
      if (viewerRef.current && (viewerRef.current as any).renderer && (viewerRef.current as any).renderer.domElement) {
        console.log('Adding viewer renderer to container...');
        containerRef.current!.appendChild((viewerRef.current as any).renderer.domElement);
        console.log('Viewer renderer added to container');
      }

      // Load the splat scene
      if (viewerRef.current) {
        console.log('Loading splat scene...');
        // Add a sample splat scene (you'll need to replace with your actual file path)
        viewerRef.current.addSplatScene("/splats/bonsai/bonsai_high.ksplat", {
          'splatAlphaRemovalThreshold': 5,
          'showLoadingUI': true,
          'position': [0, 1, 0],
          'rotation': [0, 0, 0, 1],
          'scale': [1.5, 1.5, 1.5]
        })
        .then(() => {
          console.log('Splat scene loaded successfully');
          viewerRef.current?.start();
          console.log('Viewer started');
        })
        .catch((error: unknown) => {
          console.error('Error loading splat scene:', error);
        });
      } else {
        console.error('Viewer was not created successfully');
        console.log('Viewer:', viewerRef.current);
        console.log('Available properties:', Object.keys(viewerRef.current || {}));
      }
    } catch (error) {
      console.error('Error creating GaussianSplats3D viewer:', error);
    }

    return () => {
      console.log('Cleaning up viewer...');
      if (viewerRef.current) {
        viewerRef.current.dispose();
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[400px] bg-gray-900"
      style={{ border: '2px solid red' }}
    />
  );
}
