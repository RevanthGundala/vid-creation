import { createFileRoute, Link } from '@tanstack/solid-router';
import { useAuth } from '../contexts/AuthContext';

export const Route = createFileRoute('/')({
  component: LandingPage,
});

function LandingPage() {
  const { user } = useAuth();
  // Placeholder video data
  const videos = [
    { id: 1, title: 'AI Art Demo', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 2, title: 'Nature Timelapse', url: 'https://www.w3schools.com/html/movie.mp4' },
    { id: 3, title: 'Productivity Tips', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 4, title: 'Travel Vlog', url: 'https://www.w3schools.com/html/movie.mp4' },
    { id: 5, title: 'Cooking Show', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { id: 6, title: 'Music Video', url: 'https://www.w3schools.com/html/movie.mp4' },
  ];

  return (
    <div class="flex flex-col min-h-screen bg-[#282c34] text-white">
      {/* Hero Section */}
      <section class="flex flex-col items-center justify-center flex-1 py-24 bg-gradient-to-b from-[#282c34] to-[#1a1d22]">
        <h1 class="text-4xl md:text-6xl font-bold mb-6 text-center">Welcome to Vid Creation</h1>
        <p class="text-lg md:text-2xl mb-8 text-center max-w-xl">Create, share, and discover amazing AI-generated videos.</p>
        <Link to="/create" class="mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold">Go to my projects</Link>
      </section>

      {/* Video Grid Section */}
      <section class="py-16 px-4 max-w-6xl mx-auto w-full">
        <h2 class="text-3xl font-bold mb-8 text-center">See what other people are creating</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {videos.map(video => (
            <div class="bg-[#23272f] rounded-lg shadow-lg overflow-hidden flex flex-col items-center">
              <video src={video.url} controls class="w-full h-48 object-cover bg-black" />
              <div class="p-4 w-full">
                <h3 class="text-lg font-semibold mb-2">{video.title}</h3>
                <p class="text-sm text-gray-400">by User {video.id}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
