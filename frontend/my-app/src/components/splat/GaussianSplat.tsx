import { onMount, onCleanup } from 'solid-js';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';

export function GaussianSplat() {
  let containerRef: HTMLDivElement | undefined;
  let viewer: GaussianSplats3D.Viewer | undefined;

  onMount(() => {
    if (!containerRef) return;

    // Create the viewer
    viewer = new GaussianSplats3D.Viewer({
      'cameraUp': [0, -1, -0.6],
      'initialCameraPosition': [-1, -4, 6],
      'initialCameraLookAt': [0, 4, 0]
    });

    // Add the viewer to the container
    containerRef.appendChild(viewer.domElement);

    // Add a sample splat scene (you'll need to replace with your actual file path)
    viewer.addSplatScene('', {
      'splatAlphaRemovalThreshold': 5,
      'showLoadingUI': true,
      'position': [0, 1, 0],
      'rotation': [0, 0, 0, 1],
      'scale': [1.5, 1.5, 1.5]
    })
    .then(() => {
      viewer?.start();
    })
    .catch((error: unknown) => {
      console.error('Error loading splat scene:', error);
    });
  });

  onCleanup(() => {
    if (viewer) {
      viewer.dispose();
    }
  });

  return (
    <div 
      ref={containerRef} 
      class="w-full h-full min-h-[400px] bg-gray-900"
    />
  );
}