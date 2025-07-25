import { createSignal } from 'solid-js'
import { Button } from './ui/button'
import { generateVideo } from '../api'
import { NUM_VIDEOS_TO_GENERATE } from '../constants'
import { TbLoader } from 'solid-icons/tb'


interface ChatBoxProps { 
  setVideos: (videos: string[]) => void
}

export default function ChatBox({ setVideos }: ChatBoxProps) {
  const [messages, setMessages] = createSignal<string[]>([])
  const [model, setModel] = createSignal<string>('gpt-4o')
  const [prompt, setPrompt] = createSignal<string>('')

  const handleSubmit = async () => {
    setMessages([...messages(), prompt()])
    setPrompt('')
    // post to backend
    try {
      const videoPromises = Array.from({ length: NUM_VIDEOS_TO_GENERATE }, () => generateVideo({ prompt: prompt() }))
      const videos = await Promise.all(videoPromises)
      setVideos(videos.map((video) => video.data?.url).filter((url) => url !== undefined))
    } catch (error) {
      setMessages([...messages(), 'Error generating video'])
    }
  }

  return (
    <div class="w-full max-w-4xl">
      <h1>ChatBox</h1>
      <div class="flex flex-col gap-4">
        <div class="flex flex-row gap-2">   
            <select class="w-full p-2 rounded-md" value={model()} onChange={(e) => setModel(e.target.value)}>
                <option value="gpt-4o">gpt-4o</option>
                <option value="gpt-4o-mini">gpt-4o-mini</option>
                <option value="claude-3-5-sonnet-20240620">claude-3-5-sonnet-20240620</option>
                <option value="claude-3-5-sonnet-20240620">claude-3-5-sonnet-20240620</option>
            </select>
        </div>
        <div class="flex flex-col gap-2">
          {messages().map((message) => (
            <div class="bg-gray-800 p-2 rounded-md">{message}</div>
          ))}
          <div class="flex flex-row gap-2">
            <input type="text" class="w-full p-2 rounded-md" value={prompt()} onChange={(e) => setPrompt(e.target.value)} />
            <Button variant="default" onClick={handleSubmit}>Send</Button>
          </div>
        </div>
      </div>
    </div>
  )
}