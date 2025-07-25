// WebCodecs API TypeScript declarations
// These are experimental APIs that may not be available in all browsers

declare global {
  interface Window {
    MediaStreamTrackProcessor: typeof MediaStreamTrackProcessor
  }
}

interface VideoFrame {
  readonly width: number
  readonly height: number
  readonly timestamp: number
  readonly duration?: number
  readonly format: VideoPixelFormat
  readonly codedWidth: number
  readonly codedHeight: number
  readonly visibleRect?: VideoFrameRect
  readonly displayWidth?: number
  readonly displayHeight?: number
  readonly colorSpace?: VideoColorSpace
  readonly metadata?: Record<string, any>
  
  clone(): VideoFrame
  close(): void
}

type VideoPixelFormat = 'I420' | 'I420A' | 'I422' | 'I444' | 'NV12' | 'RGBA' | 'RGBX' | 'BGRA' | 'BGRX'

interface VideoFrameRect {
  x: number
  y: number
  width: number
  height: number
}

interface VideoColorSpace {
  primary: VideoColorSpacePrimaries
  transfer: VideoColorSpaceTransfer
  matrix: VideoColorSpaceMatrix
  fullRange: boolean
}

type VideoColorSpacePrimaries = 'bt709' | 'bt470bg' | 'smpte170m' | 'bt2020'
type VideoColorSpaceTransfer = 'bt709' | 'smpte170m' | 'bt2020-10' | 'bt2020-12'
type VideoColorSpaceMatrix = 'rgb' | 'bt709' | 'bt470bg' | 'smpte170m' | 'bt2020nc'

interface MediaStreamTrackProcessorOptions {
  track: MediaStreamTrack
}

declare class MediaStreamTrackProcessor {
  constructor(options: MediaStreamTrackProcessorOptions)
  readonly readable: ReadableStream<VideoFrame>
  readonly writable: WritableStream<MediaStreamTrack>
}

export {} 