import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '../contexts/auth-context';
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: LandingPage,
});

function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleClick = () => {
    if (user) {
      navigate({ to: "/projects" as any });
    } else {
      navigate({ to: "/login" as any });
    }
  };

  return (
    <div className="w-full h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-8">
          Welcome to the App
        </h1>
        <button
          onClick={handleClick}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 text-lg"
        >
          {user ? 'Projects' : 'Sign In'}
        </button>
      </div>
    </div>
  );
}