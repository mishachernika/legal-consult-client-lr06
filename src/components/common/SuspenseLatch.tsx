import { lazy, Suspense, type ComponentType } from 'react';
import Loading from './Loading';

type PropsOf<T> = T extends ComponentType<infer P> ? P : never;

/**
 * Загортає lazy() компонент разом із Suspense-fallback у один виклик:
 * const ImageCrop = SuspenseLatch(() => import('@/components/common/ImageCrop'));
 * <ImageCrop image={url} /> — до завантаження chunk-а показує Loading.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function SuspenseLatch<T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>
) {
  const LazyComponent = lazy(loader);
  return function Latched(props: PropsOf<T>) {
    return (
      <Suspense fallback={<Loading />}>
        {/* props типізовані як PropsOf<T>; приводимо до any, бо T — дженерик */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <LazyComponent {...(props as any)} />
      </Suspense>
    );
  };
}
