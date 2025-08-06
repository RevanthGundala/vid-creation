import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'

export const Route = createFileRoute('/_auth/projects/')({
  component: ProjectsComponent,
})

function ProjectsComponent() {
  const [projects, setProjects] = useState([
    { 
      id: '1', 
      name: 'AI Videos Generator', 
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
      description: 'Ai Videos Generator' 
    },
    // { 
    //   id: '2', 
    //   name: 'Virtual Gallery', 
    //   image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
    //   description: 'Immersive art exhibition experience'
    // },
    // { 
    //   id: '3', 
    //   name: 'Game Engine', 
    //   image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop',
    //   description: 'Real-time 3D game development platform'
    // },
    // { 
    //   id: '4', 
    //   name: 'Architectural Viz', 
    //   image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop',
    //   description: 'Building design visualization tool'
    // },
    // { 
    //   id: '5', 
    //   name: 'VR Experience', 
    //   image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=400&h=300&fit=crop',
    //   description: 'Virtual reality training simulation'
    // },
    // { 
    //   id: '6', 
    //   name: 'Data Visualization', 
    //   image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
    //   description: 'Interactive 3D data charts and graphs'
    // },
  ])
  const [isCreating, setIsCreating] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')

  const handleCreateProject = () => {
    if (newProjectName) {
      setProjects([
        ...projects,
        { 
          id: `${projects.length + 1}`, 
          name: newProjectName,
          image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
          description: 'New project description'
        },
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              My Projects
            </h1>
            <p className="text-gray-400 mt-2">Create and manage your 3D projects</p>
          </div>
          <Button
            onClick={() => setIsCreating(true)}
            className="mt-4 sm:mt-0 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white font-semibold flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus size={20} />
            New Project
          </Button>
        </div>

        {/* Create Project Modal */}
        {isCreating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-semibold mb-4">Create New Project</h3>
              <input
                type="text"
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="Project Name"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
              />
              <div className="flex gap-3 mt-4">
                <Button
                  onClick={handleCreateProject}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold"
                >
                  Create
                </Button>
                <Button
                  onClick={() => setIsCreating(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-semibold"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Projects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.map(project => (
            <div
              key={project.id}
              className="group relative bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-gray-700 hover:border-gray-600"
            >
              {/* Project Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={project.image}
                  alt={project.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Action Buttons Overlay */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Link
                    to="/projects/$projectId"
                    params={{ projectId: project.id }}
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors duration-200"
                    title="View Project"
                  >
                    <Eye size={16} />
                  </Link>
                  <button
                    onClick={() => {
                      const newName = prompt('Enter new name', project.name)
                      if (newName) {
                        handleRenameProject(project.id, newName)
                      }
                    }}
                    className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white transition-colors duration-200"
                    title="Rename Project"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors duration-200"
                    title="Delete Project"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Project Info */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors duration-200">
                  {project.name}
                </h3>
                <p className="text-gray-400 text-sm mb-3">
                  {project.description}
                </p>
                
                {/* View Button */}
                <Link
                  to="/projects/$projectId"
                  params={{ projectId: project.id }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white font-medium transition-all duration-200 text-sm"
                >
                  <Eye size={16} />
                  View Project
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {projects.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📁</div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-6">Create your first project to get started</p>
            <Button
              onClick={() => setIsCreating(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white font-semibold"
            >
              Create Your First Project
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
