import { useRealtimeStore } from '@/stores/realtimeStore';

export default function OnlineStatus({ userId }: { userId: number }) {
  const online = useRealtimeStore((state) => state.onlineUserIds.includes(userId));
  return (
    <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
      <span className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-gray-400'}`} />
      {online ? 'онлайн' : 'офлайн'}
    </span>
  );
}
