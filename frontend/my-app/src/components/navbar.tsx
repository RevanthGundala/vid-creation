import { createSignal } from 'solid-js';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal
} from '../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogTitle
} from '../components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { TextFieldTextArea } from '../components/ui/text-field';
import { TbDotsVertical, TbUserCircle, TbLogout, TbCoin, TbMessage } from 'solid-icons/tb';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [feedbackOpen, setFeedbackOpen] = createSignal(false);
  const currentUser = user();

  return (
    <nav class="w-full flex items-center justify-between px-4 py-2 bg-[#23272f] border-b border-gray-800 shadow z-50">
      {/* Left: Triple Dots Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger as="button">
          <Button variant="ghost" size="icon" aria-label="Menu">
            <TbDotsVertical size={24} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent class="min-w-[160px]">
            <DropdownMenuItem onSelect={() => setFeedbackOpen(true)}>
              <TbMessage class="mr-2" /> Send Feedback
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>

      <Dialog open={feedbackOpen()} onOpenChange={setFeedbackOpen}>
        <DialogContent class="max-w-md w-full p-6 bg-white rounded-lg shadow-xl text-black">
          <DialogTitle class="text-xl font-bold mb-4">Send Feedback</DialogTitle>
          <TextFieldTextArea class="w-full h-32 p-2 border border-gray-300 rounded mb-4" placeholder="Your feedback..." />
          <div class="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setFeedbackOpen(false)}>Cancel</Button>
            <Button variant="default" onClick={() => setFeedbackOpen(false)}>Send</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Right: Profile Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger as="button">
          <Button variant="ghost" size="icon" aria-label="Profile">
            <TbUserCircle size={28} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent class="min-w-[180px]">
            <div class="px-3 py-2 border-b border-gray-200">
              <div class="font-semibold text-sm">{currentUser && currentUser.email ? currentUser.email : 'Not signed in'}</div>
            </div>
            <DropdownMenuItem>
              <TbCoin class="mr-2" /> Credits: 100
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={signOut} class="text-red-600">
              <TbLogout class="mr-2" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>
    </nav>
  );
}
