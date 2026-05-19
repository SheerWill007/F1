'use client';

interface Props { message?: string }

export default function LoadingState({ message }: Props) {
  return (
    <div className="bg-f1-darkgray border border-f1-gray/20 rounded-lg p-10 flex flex-col items-center gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-2 border-f1-gray/20 rounded-full" />
        <div className="absolute inset-0 border-2 border-t-f1-red rounded-full animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-sm text-white font-mono">
          {message || 'Loading session data…'}
        </p>
        <p className="text-xs text-f1-gray mt-1 font-mono">
          FastF1 may take 30–60s on first load — data is cached after that
        </p>
      </div>
    </div>
  );
}
