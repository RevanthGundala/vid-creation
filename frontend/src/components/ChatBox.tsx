import { useState } from 'react'
import { Textarea } from './ui/textarea'
import { Button } from './ui/button'

export default function ChatBox() {
  const [messages, setMessages] = useState<string[]>([])
  const [model, setModel] = useState<string>('gpt-4o')
  const [prompt, setPrompt] = useState<string>('')

  // Submit on button click
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPrompt('')
    console.log(prompt)
  }

  // Submit on enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const form = e.currentTarget.closest('form')
      if (form) {
        form.requestSubmit()
      }
    }
  }

  return (
    <div className="w-full max-w-4xl bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Textarea 
            placeholder="Build a 3D model of a cat..." 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 pr-12 resize-none"
            rows={1}
            style={{ minHeight: '44px' }}
          />
          <button
            type="submit"
            className="absolute bottom-2 right-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
          {messages.map((message, index) => (
            <div key={index} className="bg-gray-800/70 p-2 rounded-md text-sm">
              {message}
            </div>
          ))}
        </div>
      </form>
    </div>
  )
}