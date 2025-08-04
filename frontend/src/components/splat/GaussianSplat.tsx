import { useEffect, useRef } from 'react';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';

interface GaussianSplatProps {
  assetUrl?: string;
}

export function GaussianSplat({ assetUrl }: GaussianSplatProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<GaussianSplats3D.Viewer | undefined>(undefined);

  // Separate effect for viewer creation (runs only once)
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
        // Clear the container first to avoid DOM conflicts
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
        containerRef.current!.appendChild((viewerRef.current as any).renderer.domElement);
        console.log('✅ Viewer renderer added to container');
        console.log('Container dimensions:', containerRef.current?.offsetWidth, 'x', containerRef.current?.offsetHeight);
      } else {
        console.error('❌ Viewer renderer not available');
        console.log('Viewer ref:', viewerRef.current);
        console.log('Viewer renderer:', (viewerRef.current as any)?.renderer);
        console.log('Viewer DOM element:', (viewerRef.current as any)?.renderer?.domElement);
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
  }, []); // Empty dependency array - only run once

  // Separate effect for loading assets (runs when assetUrl changes)
  useEffect(() => {
    if (!viewerRef.current || !assetUrl) {
      console.log('Viewer not ready or no asset URL, skipping load');
      return;
    }

    console.log('Loading splat scene...');
    console.log('Asset URL provided:', assetUrl);
    
    // Test if the URL is accessible first
    console.log('🔍 Testing asset URL accessibility...');
    fetch(assetUrl)
      .then(response => {
        console.log('Asset fetch response:', response.status, response.statusText);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        console.log('Asset blob size:', blob.size, 'bytes');
        console.log('Asset blob type:', blob.type);
        console.log('✅ Asset file fetched successfully!');
        
        // Now load the scene into the viewer
        console.log('🎬 Loading scene into viewer...');
        return viewerRef.current!.addSplatScene(assetUrl, {
          'splatAlphaRemovalThreshold': 5,
          'showLoadingUI': true,
          'position': [0, 1, 0],
          'rotation': [0, 0, 0, 1],
          'scale': [1.5, 1.5, 1.5]
        });
      })
      .then(() => {
        console.log('Splat scene loaded successfully');
        viewerRef.current?.start();
        console.log('Viewer started');
      })
      .catch((error: unknown) => {
        console.error('Error loading splat scene:', error);
      });
  }, [assetUrl]);

  return (
    <div className="w-full h-full min-h-[400px] p-4 text-white">
      <div 
        ref={containerRef} 
        className="w-full h-full"
      />
      {assetUrl && (
        <div className="mt-4 p-4 bg-gray-800 rounded">
          <h3 className="text-lg font-bold mb-2">Asset Debug Info:</h3>
          <p><strong>Asset URL:</strong> {assetUrl}</p>
          <p><strong>Container:</strong> {containerRef.current ? 'Ready' : 'Not ready'}</p>
          <p><strong>Viewer:</strong> {viewerRef.current ? 'Created' : 'Not created'}</p>
          <a 
            href={assetUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Download Asset File
          </a>
        </div>
      )}
    </div>
  );
}
