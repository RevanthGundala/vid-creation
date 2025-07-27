declare module '@mkkellogg/gaussian-splats-3d' {
  export interface ViewerOptions {
    cameraUp?: [number, number, number];
    initialCameraPosition?: [number, number, number];
    initialCameraLookAt?: [number, number, number];
  }

  export interface SplatSceneOptions {
    splatAlphaRemovalThreshold?: number;
    showLoadingUI?: boolean;
    position?: [number, number, number];
    rotation?: [number, number, number, number];
    scale?: [number, number, number];
  }

  export class Viewer {
    constructor(options?: ViewerOptions);
    domElement: HTMLElement;
    addSplatScene(path: string, options?: SplatSceneOptions): Promise<void>;
    start(): void;
    dispose(): void;
  }
} 