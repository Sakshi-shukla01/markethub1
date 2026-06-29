'use client';
import { useDispatch, useSelector } from 'react-redux';
import { Moon, Sun } from 'lucide-react';
import { toggleTheme } from '@/store/themeSlice';

export default function ThemeToggle() {
  const dispatch = useDispatch();
  const mode = useSelector((s) => s.theme.mode);
  return (
    <button
      onClick={() => dispatch(toggleTheme())}
      className="grid h-10 w-10 place-items-center rounded-xl btn-ghost"
      aria-label="Toggle theme"
    >
      {mode === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
