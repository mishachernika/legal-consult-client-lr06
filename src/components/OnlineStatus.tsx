import { cn } from '@/utils/cn';
import { useOnlineStore } from '@/stores/onlineStore';

interface OnlineStatusProps {
  userId: number;
  /** Повний вигляд із підписом; за замовчуванням — лише точка */
  withLabel?: boolean;
  className?: string;
}

// Онлайн-статус користувача: множина id онлайнових живе в Zustand-сховищі
// і наповнюється подіями presence:update (див. usePresenceEvents).
export default function OnlineStatus({ userId, withLabel = false, className }: OnlineStatusProps) {
  const isOnline = useOnlineStore((s) => s.onlineIds.has(userId));

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-sm', className)}>
      <span
        aria-hidden="true"
        className={cn(
          'inline-block h-2.5 w-2.5 rounded-full',
          isOnline ? 'bg-green-500' : 'bg-gray-400'
        )}
      />
      <span className="sr-only">{isOnline ? 'Онлайн' : 'Не в мережі'}</span>
      {withLabel && (
        <span className={cn(isOnline ? 'text-green-600 dark:text-green-400' : 'text-gray-500')}>
          {isOnline ? 'Онлайн' : 'Не в мережі'}
        </span>
      )}
    </span>
  );
}
