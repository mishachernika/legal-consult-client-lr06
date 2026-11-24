import { useEffect, useEffectEvent } from 'react';
import { socket } from '@/services/socket';

// Підписка на подіюSocket.io на час життя компонента.
// useEffectEvent тримає завжди актуальний обробник без повторної підписки на кожне
// відтворення, а функція очищення знімає САМЕ ЦЕЙ обробник (за посиланням) —
// підписки інших компонентів на ту саму подію не зачіпаються.
export function useSocketEvent<T>(event: string, handler: (payload: T) => void) {
  const onEvent = useEffectEvent(handler);

  useEffect(() => {
    const listener = (payload: T) => onEvent(payload);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [event]);
}
