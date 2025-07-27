interface VideoProps {
  videoUrl: string | null
  videoRef?: (el: HTMLVideoElement) => void
}

export default function Video(props: VideoProps) {
  return (
    <div className="w-full h-[60vh] bg-black rounded-lg shadow-lg">
      <video ref={props.videoRef} src={props.videoUrl ?? ''} controls className="w-full h-full rounded-lg" />
    </div>
  )
}