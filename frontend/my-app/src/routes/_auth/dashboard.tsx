import { createFileRoute, Link } from '@tanstack/solid-router'
import { createSignal, For } from 'solid-js'

export const Route = createFileRoute('/_auth/dashboard')({
  component: DashboardComponent,
})

function DashboardComponent() {
  const [videos, setVideos] = createSignal([
    { id: '1', name: 'Project 1' },
    { id: '2', name: 'Project 2' },
    { id: '3', name: 'Project 3' },
  ])
  const [isCreating, setIsCreating] = createSignal(false)
  const [newProjectName, setNewProjectName] = createSignal('')

  const handleCreateProject = () => {
    if (newProjectName()) {
      setVideos([
        ...videos(),
        { id: `${videos().length + 1}`, name: newProjectName() },
      ])
      setNewProjectName('')
      setIsCreating(false)
    }
  }

  const handleRenameProject = (id: string, newName: string) => {
    setVideos(
      videos().map(video => (video.id === id ? { ...video, name: newName } : video)),
    )
  }

  const handleDeleteProject = (id: string) => {
    setVideos(videos().filter(video => video.id !== id))
  }

  return (
    <div class="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white p-4">
      <h1 class="text-2xl mb-4">My Projects</h1>
      <button
        onClick={() => setIsCreating(true)}
        class="mb-4 px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-semibold"
      >
        New Project
      </button>

      {isCreating() && (
        <div class="flex items-center space-x-2 mb-4">
          <input
            type="text"
            value={newProjectName()}
            onInput={e => setNewProjectName(e.currentTarget.value)}
            class="px-2 py-1 rounded bg-gray-700 text-white"
            placeholder="Project Name"
          />
          <button
            onClick={handleCreateProject}
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold"
          >
            Create
          </button>
        </div>
      )}

      <ul class="space-y-2">
        <For each={videos()}>
          {video => (
            <li class="flex items-center space-x-2">
              <Link
                to={`/create/${video.id}`}
                class="text-blue-400 hover:underline"
              >
                {video.name}
              </Link>
              <button
                onClick={() => {
                  const newName = prompt('Enter new name', video.name)
                  if (newName) {
                    handleRenameProject(video.id, newName)
                  }
                }}
                class="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-white font-semibold"
              >
                Rename
              </button>
              <button
                onClick={() => handleDeleteProject(video.id)}
                class="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-white font-semibold"
              >
                Delete
              </button>
            </li>
          )}
        </For>
      </ul>
    </div>
  )
}
