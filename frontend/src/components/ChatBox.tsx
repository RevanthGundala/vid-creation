import { useState } from 'react'
import { Textarea } from './ui/textarea'

interface ChatBoxProps {
  onSubmit: (prompt: string) => void
  errorMessage?: string | null
}

export default function ChatBox({ onSubmit }: ChatBoxProps) {
  const [prompt, setPrompt] = useState<string>('')

  // Submit on button click
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!prompt.trim()) return
    setPrompt('')
    onSubmit(prompt)
  }

  // Submit on enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!prompt.trim()) return
      const form = e.currentTarget.closest('form')
      if (form) {
        form.requestSubmit()
      }
    }
  }

  return (
    <div className="w-96 h-42 bg-black rounded-lg p-6 border border-gray-700">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Textarea 
            placeholder="Describe the video you want to generate..." 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 pr-12 resize-none"
            rows={4}
            style={{ minHeight: '120px' }}
          />
          <button
            type="submit"
            disabled={!prompt.trim()}
            className={`absolute bottom-2 right-2 p-2 rounded-full transition-colors ${
              !prompt.trim() 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

      </form>
    </div>
  )
}