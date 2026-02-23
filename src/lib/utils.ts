import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getImageUrl(path: string | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;

  // Handle paths that might already have 'uploads/' or not
  const cleanPath = path.replace(/^\/+/, '');
  let apiBase = import.meta.env.VITE_API_URL || '';

  if (apiBase.endsWith('/api')) {
    apiBase = apiBase.slice(0, -4);
  }

  // Use the API base URL to resolve images if hosted separately, otherwise relative
  return `${apiBase}/uploads/${cleanPath.replace(/^uploads\//, '')}`;
}
