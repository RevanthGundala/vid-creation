import { useEffect, useRef } from 'react';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';

interface GaussianSplatProps {
  assetUrl?: string;
}

export function GaussianSplat({ assetUrl }: GaussianSplatProps) {
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
        
        // Use the provided asset URL or fallback to the sample
        const sceneUrl = assetUrl || "/splats/bonsai/bonsai_high.ksplat";
        console.log('Loading scene from:', sceneUrl);
        console.log('Asset URL provided:', assetUrl);
        
        // Test if the URL is accessible
        if (assetUrl) {
          fetch(assetUrl)
            .then(response => {
              console.log('Asset fetch response:', response.status, response.statusText);
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              return response.blob();
            })
            .then(blob => {
              console.log('Asset blob size:', blob.size);
              console.log('Asset blob type:', blob.type);
            })
            .catch(error => {
              console.error('Error fetching asset:', error);
            });
        }
        
        viewerRef.current.addSplatScene(sceneUrl, {
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
