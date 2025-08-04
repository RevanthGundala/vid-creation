import { useEffect, useRef, useState } from 'react';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';

interface GaussianSplatProps {
  assetUrl?: string;
}

export function GaussianSplatGaussianSplats3D({ assetUrl }: GaussianSplatProps) {
  console.log('🎬 GaussianSplats3D component rendered with assetUrl:', assetUrl);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<GaussianSplats3D.Viewer | undefined>(undefined);
  const [fileFormat, setFileFormat] = useState<string>('Unknown');
  const [fileSize, setFileSize] = useState<number>(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Separate effect for viewer creation (runs only once)
  useEffect(() => {
    console.log('GaussianSplats3D component mounted');
    
    if (!containerRef.current) {
      console.error('Container ref is null');
      return;
    }

    try {
      console.log('Creating GaussianSplats3D viewer...');
      
      // Create the viewer with optimized settings for .ksplat files
      viewerRef.current = new GaussianSplats3D.Viewer({
        'cameraUp': [0, -1, -0.6],
        'initialCameraPosition': [-1, -4, 6],
        'initialCameraLookAt': [0, 4, 0]
      });

      console.log('Viewer created:', viewerRef.current);

      // Attach the viewer's renderer DOM element to the container
      if (viewerRef.current && (viewerRef.current as any).renderer && (viewerRef.current as any).renderer.domElement) {
        console.log('Adding viewer renderer to container...');
        // Clear the container first
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild((viewerRef.current as any).renderer.domElement);
        console.log('✅ Viewer renderer added to container');
      } else {
        console.error('❌ Viewer renderer not available');
      }

    } catch (error) {
      console.error('Error creating GaussianSplats3D viewer:', error);
    }

    return () => {
      console.log('Cleaning up GaussianSplats3D viewer...');
      if (viewerRef.current) {
        try {
          (viewerRef.current as any).dispose?.();
        } catch (e) {
          console.error('Error disposing viewer:', e);
        }
      }
    };
  }, []); // Empty dependency array - only run once

  // Separate effect for loading assets (runs when assetUrl changes)
  useEffect(() => {
    if (!viewerRef.current || !assetUrl) {
      console.log('Viewer not ready or no asset URL, skipping load');
      return;
    }

    // Reset state when assetUrl changes
    setFileFormat('Unknown');
    setFileSize(0);
    setLoadError(null);
    setIsLoading(true);

    console.log('Loading splat scene...');
    console.log('Asset URL provided:', assetUrl);
    
    // Test if the URL is accessible first
    console.log('🔍 Testing asset URL accessibility...');
    console.log('🔗 Full URL:', assetUrl);
    
    // First, let's check if the URL is valid
    try {
      new URL(assetUrl);
      console.log('✅ URL format is valid');
    } catch (e) {
      console.error('❌ Invalid URL format:', e);
      setLoadError('Invalid URL format');
      setIsLoading(false);
      return;
    }
    
    fetch(assetUrl)
      .then(response => {
        console.log('Asset fetch response:', response.status, response.statusText);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        console.log('Content-Type:', response.headers.get('content-type'));
        console.log('Content-Length:', response.headers.get('content-length'));
        
        if (!response.ok) {
          console.error(`❌ HTTP error! status: ${response.status} ${response.statusText}`);
          if (response.status === 404) {
            throw new Error(`File not found (404). The asset file does not exist at this URL.`);
          } else if (response.status === 403) {
            throw new Error(`Access forbidden (403). You may not have permission to access this file.`);
          } else if (response.status >= 500) {
            throw new Error(`Server error (${response.status}). The backend server is experiencing issues.`);
          } else {
            throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
          }
        }
        
        // Check if the response is actually a file or an error page
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          console.warn('⚠️ Response is HTML, not a binary file. This might be an error page.');
        }
        
        return response.blob();
      })
      .then(blob => {
        console.log('Asset blob size:', blob.size, 'bytes');
        console.log('Asset blob type:', blob.type);
        console.log('✅ Asset file fetched successfully!');
        
        // Check file format before loading
        console.log('🔍 Analyzing file format...');
        return blob.arrayBuffer().then(buffer => {
          const uint8Array = new Uint8Array(buffer);
          const firstBytes = Array.from(uint8Array.slice(0, 16));
          
          console.log('First 16 bytes:', firstBytes.map(b => b.toString(16).padStart(2, '0')).join(' '));
          console.log('First 16 bytes as ASCII:', firstBytes.map(b => String.fromCharCode(b)).join(''));
          
          // Set file size
          setFileSize(blob.size);
          
          // Additional debugging: check for more file signatures
          console.log('🔍 Detailed file analysis:');
          console.log('  - File size:', blob.size, 'bytes');
          console.log('  - MIME type:', blob.type);
          console.log('  - First 32 bytes as hex:', Array.from(uint8Array.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join(' '));
          console.log('  - First 32 bytes as ASCII:', Array.from(uint8Array.slice(0, 32)).map(b => String.fromCharCode(b < 32 || b > 126 ? 46 : b)).join(''));
          
          // Check for common file signatures
          if (firstBytes[0] === 0x7B) { // '{' character
            console.error('❌ File appears to be JSON, not a .splat file');
            setFileFormat('JSON (Error: Expected .splat file)');
            throw new Error('File is JSON format, expected .splat file');
          } else if (firstBytes[0] === 0x50 && firstBytes[1] === 0x4B) { // PK (ZIP)
            console.log('✅ File appears to be a ZIP archive - this might be a compressed .splat file');
            console.warn('⚠️ ZIP files need to be extracted first. The backend should serve the .splat file directly.');
            setFileFormat('ZIP Archive (Needs extraction)');
          } else if (firstBytes[0] === 0x1F && firstBytes[1] === 0x8B) { // GZIP
            console.log('✅ File appears to be a GZIP compressed file');
            setFileFormat('GZIP Compressed (Needs decompression)');
          } else if (firstBytes[0] === 0x73 && firstBytes[1] === 0x70 && firstBytes[2] === 0x6C && firstBytes[3] === 0x61 && firstBytes[4] === 0x74) { // "splat"
            console.log('✅ File appears to be a .splat file');
            setFileFormat('.splat (Standard format)');
          } else if (firstBytes[0] === 0x6B && firstBytes[1] === 0x73 && firstBytes[2] === 0x70 && firstBytes[3] === 0x6C && firstBytes[4] === 0x61 && firstBytes[5] === 0x74) { // "ksplat"
            console.log('✅ File appears to be a .ksplat file');
            setFileFormat('.ksplat (K-Planes format)');
          } else if (firstBytes[0] === 0x00 && firstBytes[1] === 0x01 && firstBytes[2] === 0x00 && firstBytes[3] === 0x00) { // Binary .ksplat format
            console.log('✅ File appears to be a binary .ksplat file (K-Planes format)');
            setFileFormat('.ksplat (K-Planes binary format)');
            
            // Additional analysis for this specific format
            console.log('🔍 Analyzing binary .ksplat format:');
            console.log('  - Header: 00 01 00 00 01 00 00 00 01 00 00 00 d7 86 12 00');
            console.log('  - This appears to be a custom binary format');
            console.log('  - Testing with GaussianSplats3D for compatibility');
          } else if (firstBytes[0] === 0x45 && firstBytes[1] === 0x78 && firstBytes[2] === 0x61 && firstBytes[3] === 0x6D && firstBytes[4] === 0x70 && firstBytes[5] === 0x6C && firstBytes[6] === 0x65) { // "Example"
            console.error('❌ File appears to be a placeholder/example file, not a real 3D asset');
            setFileFormat('Placeholder File (Error: Not a real 3D asset)');
            throw new Error('File is a placeholder/example file. The backend is not serving the actual generated 3D asset.');
          } else if (firstBytes[0] === 0x3C && firstBytes[1] === 0x21 && firstBytes[2] === 0x44 && firstBytes[3] === 0x4F && firstBytes[4] === 0x43) { // "<!DOC"
            console.error('❌ File appears to be an HTML document (likely an error page), not a .splat file');
            setFileFormat('HTML Document (Error: Server returned error page)');
            throw new Error('File is an HTML document. The server is returning an error page instead of a .splat file.');
          } else {
            console.warn('⚠️ Unknown file format - may not be a valid .splat file');
            console.warn('  This could be:');
            console.warn('  - A different 3D format (PLY, OBJ, etc.)');
            console.warn('  - A corrupted or incomplete file');
            console.warn('  - A file with wrong extension');
            console.warn('  - An HTML error page from the server');
            setFileFormat(`Unknown (${firstBytes.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join(' ')})`);
          }
          
          return blob;
        });
      })
      .then((blob) => {
        // Now load the scene into the viewer
        console.log('🎬 Loading scene into viewer...');
        console.log('📁 File format detected:', fileFormat);
        console.log('📊 File size:', blob.size, 'bytes');
        
        // Check if we detected an unsupported format before trying to load
        if (fileFormat.includes('JSON') || fileFormat.includes('ZIP') || fileFormat.includes('GZIP') || fileFormat.includes('Placeholder') || fileFormat.includes('HTML Document')) {
          throw new Error(`Detected unsupported file format: ${fileFormat}. Cannot load this file type.`);
        }
        
        // Check if we have a supported .ksplat format
        if (fileFormat.includes('.ksplat')) {
          console.log('✅ Detected supported .ksplat format, proceeding with load');
        }
        
        // Create a blob URL for the file to ensure proper loading
        const blobUrl = URL.createObjectURL(blob);
        console.log('🔗 Created blob URL:', blobUrl);
        
        // The library supports .ksplat files natively, so we can load them directly
        return viewerRef.current!.addSplatScene(blobUrl, {
          'splatAlphaRemovalThreshold': 5,
          'showLoadingUI': true,
          'position': [0, 1, 0],
          'rotation': [0, 0, 0, 1],
          'scale': [1.5, 1.5, 1.5]
        }).finally(() => {
          // Clean up the blob URL after loading
          URL.revokeObjectURL(blobUrl);
        });
      })
      .then(() => {
        console.log('✅ Splat scene loaded successfully');
        viewerRef.current?.start();
        console.log('Viewer started');
        setIsLoading(false);
      })
      .catch((error: unknown) => {
        console.error('Error loading splat scene:', error);
        
        // Set error state
        if (error instanceof Error) {
          setLoadError(error.message);
          
          if (error.message.includes('placeholder/example file')) {
            console.error('❌ BACKEND ISSUE: The backend is serving a placeholder file instead of the actual 3D asset.');
            console.error('   This suggests:');
            console.error('   1. The 3D generation job failed or is incomplete');
            console.error('   2. The backend is serving the wrong file');
            console.error('   3. The file path is incorrect');
            console.error('   Check the backend logs and job status.');
          } else if (error.message.includes('JSON')) {
            console.error('❌ The file is JSON format, not a .splat file. This suggests the backend is serving metadata instead of the actual 3D asset.');
          } else if (error.message.includes('HTML document')) {
            console.error('❌ The file is an HTML document, likely an error page. This suggests:');
            console.error('   - The server is returning a 404 or 500 error page');
            console.error('   - The file URL is incorrect or the file does not exist');
            console.error('   - There are authentication/permission issues');
            console.error('   - The backend is not properly configured to serve the file');
          } else if (error.message.includes('unsupported file format') || error.message.includes('File format not supported')) {
            console.error('❌ Unsupported file format. The file might be:');
            console.error('   - A different 3D format (not .splat)');
            console.error('   - Corrupted or incomplete');
            console.error('   - Missing file extension');
            console.error('   - Served with wrong MIME type');
            console.error('   - Not a valid splat file at all');
            
            // Check if it's a .ksplat file
            if (fileFormat.includes('.ksplat')) {
              console.error('⚠️ .ksplat files should be supported by this viewer library.');
              console.error('   The file might be corrupted or in an incompatible version.');
              setLoadError('K-Planes (.ksplat) file format error. The file might be corrupted or incompatible.');
            } else if (fileFormat.includes('Unknown')) {
              console.error('⚠️ Unknown file format detected. This suggests:');
              console.error('   - The file is not a valid splat file');
              console.error('   - The file might be corrupted or incomplete');
              console.error('   - The backend might be serving the wrong file type');
              setLoadError(`Unknown file format detected: ${fileFormat}. The file is not a valid splat file.`);
            } else {
              setLoadError(`Unsupported file format: ${fileFormat}. The GaussianSplats3D library cannot load this file type.`);
            }
          }
        } else {
          setLoadError('Unknown error occurred');
        }
        
        setIsLoading(false);
      });
  }, [assetUrl]);

  return (
    <div className="w-full h-full min-h-[400px] p-4 text-white relative">
      {/* Debug info always visible */}
      <div className="absolute top-2 left-2 z-20 bg-black/80 p-2 rounded text-xs">
        <div>GaussianSplats3D Component Active</div>
        <div>Asset URL: {assetUrl ? 'Present' : 'None'}</div>
        <div>Container: {containerRef.current ? 'Ready' : 'Not ready'}</div>
        <div>Viewer: {viewerRef.current ? 'Created' : 'Not created'}</div>
      </div>
      
      <div 
        ref={containerRef} 
        className="w-full h-full"
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Loading 3D Scene...</p>
            <p className="text-gray-400 text-sm mt-2">{fileFormat}</p>
          </div>
        </div>
      )}
      
      {assetUrl && (
        <div className="mt-4 p-4 bg-gray-800 rounded">
          <h3 className="text-lg font-bold mb-2">Asset Debug Info:</h3>
          <p><strong>Asset URL:</strong> {assetUrl}</p>
          <p><strong>File Format:</strong> {fileFormat}</p>
          <p><strong>File Size:</strong> {fileSize > 0 ? `${(fileSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}</p>
          <p><strong>Container:</strong> {containerRef.current ? 'Ready' : 'Not ready'}</p>
          <p><strong>Viewer:</strong> {viewerRef.current ? 'Created' : 'Not created'}</p>
          <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
          {fileFormat.includes('.ksplat') && (
            <div className="mt-2 p-2 bg-green-900 rounded text-green-200">
              <strong>✅ Format Supported:</strong> .ksplat files are natively supported by this viewer library.
              This should provide optimal performance and loading times.
            </div>
          )}
          {loadError && (
            <div className="mt-2 p-2 bg-red-900 rounded text-red-200">
              <strong>Load Error:</strong> {loadError}
              {loadError.includes('placeholder/example file') && (
                <div className="mt-2 text-xs">
                  <strong>🔧 Backend Issue Detected:</strong><br/>
                  • The backend is serving a placeholder file instead of the actual 3D asset<br/>
                  • Check if the 3D generation job completed successfully<br/>
                  • Verify the backend is serving the correct file path<br/>
                  • Contact your backend team to investigate
                </div>
              )}
            </div>
          )}
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