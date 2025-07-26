import { createSignal } from 'solid-js'
import { Button } from '../components/ui/button'
import { generateVideo } from '../api'
import { NUM_VIDEOS_TO_GENERATE } from '../constants'
import { TbLoader } from 'solid-icons/tb'
import { TextField, TextFieldInput } from '../components/ui/text-field'


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
            <TextField>
                <TextFieldInput
                    type="text"
                    value={model()}
                    onChange={(e) => setModel(e.currentTarget.value)}
                    class="w-full p-2 rounded-md"
                />
            </TextField>
        </div>
        <div class="flex flex-col gap-2">
          {messages().map((message) => (
            <div class="bg-gray-800 p-2 rounded-md">{message}</div>
          ))}
          <div class="flex flex-row gap-2">
            <TextField>
                <TextFieldInput
                    type="text"
                    class="w-full p-2 rounded-md"
                    value={prompt()}
                    onChange={(e) => setPrompt(e.currentTarget.value)}
                />
            </TextField>
            <Button variant="default" onClick={handleSubmit}>Send</Button>
          </div>
        </div>
      </div>
    </div>
  )
}