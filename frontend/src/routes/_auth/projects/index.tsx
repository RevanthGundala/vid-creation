import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '../../../components/ui/button'
// import { TextFieldInput } from '../../../components/ui/text-field'

export const Route = createFileRoute('/_auth/projects/')({
  component: ProjectsComponent,
})

function ProjectsComponent() {
  const [projects, setProjects] = useState([
    { id: '1', name: 'Project 1' },
    { id: '2', name: 'Project 2' },
    { id: '3', name: 'Project 3' },
  ])
  const [isCreating, setIsCreating] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')

  const handleCreateProject = () => {
    if (newProjectName) {
      setProjects([
        ...projects,
        { id: `${projects.length + 1}`, name: newProjectName },
      ])
      setNewProjectName('')
      setIsCreating(false)
    }
  }

  const handleRenameProject = (id: string, newName: string) => {
    setProjects(
      projects.map(project => (project.id === id ? { ...project, name: newName } : project)),
    )
  }

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter(project => project.id !== id))
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#282c34] text-white p-4">
      <h1 className="text-2xl mb-4">My Projects</h1>
      <Button
        onClick={() => setIsCreating(true)}
        className="mb-4 px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-semibold"
      >
        New Project
      </Button>

      {/* {isCreating && (
        <div className="flex items-center space-x-2 mb-4">
          <TextFieldInput
            type="text"
            value={newProjectName}
            onChange={e => setNewProjectName(e.currentTarget.value)}
            className="px-2 py-1 rounded bg-gray-700 text-white"
            placeholder="Project Name"
          />
          <Button
            onClick={handleCreateProject}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold"
          >
            Create
          </Button>
        </div>
      )} */}

      <ul className="space-y-2">
        {projects.map(project => (
          <li key={project.id} className="flex items-center space-x-2">
            <Link
              to="/projects/$projectId"
              params={{ projectId: project.id }}
              className="text-blue-400 hover:underline"
            >
              {project.name}
            </Link>
            <Button
              onClick={() => {
                const newName = prompt('Enter new name', project.name)
                if (newName) {
                  handleRenameProject(project.id, newName)
                }
              }}
              className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-white font-semibold"
            >
              Rename
            </Button>
            <Button
              onClick={() => handleDeleteProject(project.id)}
              className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-white font-semibold"
            >
              Delete
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
