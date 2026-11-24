import { useCallback, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import SuspenseLatch from '@/components/common/SuspenseLatch';
import { useAuthStore } from '@/stores/authStore';
import { filesService, fileUrl } from '@/services/files.service';
import { usersService } from '@/services/users.service';
import { getErrorMessage } from '@/utils/errors';
import { toAppFileUrl } from '@/utils/fileUrl';

// Повний екран обрізання важкий — читаємо його окремим chunk-ом
const EasyCrop = SuspenseLatch(() => import('@/components/common/ImageCrop'));

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Завантаження зображення з попереднім переглядом та обрізанням (рівень 2, завдання 11):
// Файл вбираємо у <input type=file>, показуємо перегляд, обрізаємо react-easy-crop,
// малюємо кадр у <canvas> (PNG) і надсилаємо FormData-м на /api/files/upload.
// Після успіху оновлюємо avatar у профілі (PUT /users/:id) та в authStore.
export default function AvatarUpload() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [selected, setSelected] = useState<{ url: string; name: string } | null>(null);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [cropping, setCropping] = useState(false);

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const uploaded = await filesService.upload(file, file.name);
      const url = fileUrl(uploaded);
      if (!user) throw new Error('Немає сесії');
      await usersService.update(user.id, { avatar: url });
      // файл віддається з /api/files/:id — лише його власнику чи адміну (перевірка прав на сервері)
      return url;
    },
    onSuccess: (url) => {
      useAuthStore.getState().login(
        { ...user!, avatar: url },
        {
          accessToken: useAuthStore.getState().accessToken!,
          refreshToken: useAuthStore.getState().refreshToken!,
        }
      );
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Аватар оновлено');
      setSelected(null);
    },
    onError: (e) => toast.error(getErrorMessage(e, 'Не вдалося завантажити аватар')),
  });

  const readFile = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const onPick = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // дозволити повторний вибір того ж файлу
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Оберіть зображення (jpg, png, webp)');
      return;
    }
    try {
      const url = await readFile(file);
      setSelected({ url, name: file.name.replace(/\.[^.]+$/, '') + '-avatar.png' });
    } catch {
      toast.error('Не вдалося прочитати файл');
    }
  }, []);

  const saveCrop = async () => {
    if (!selected || !cropArea) return;
    setCropping(true);
    try {
      const image = new Image();
      image.src = selected.url;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(cropArea.width);
      canvas.height = Math.round(cropArea.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas недоступний');
      ctx.drawImage(
        image,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        canvas.width,
        canvas.height
      );
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Не вдалося сформувати кадр');
      upload.mutate(new File([blob], selected.name, { type: 'image/png' }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не вдалося обрізати зображення');
    } finally {
      setCropping(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {user?.avatar ? (
        <img
          src={toAppFileUrl(user.avatar)}
          alt={`Аватар ${user.name}`}
          className="h-16 w-16 rounded-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-700 dark:bg-primary-900 dark:text-primary-200"
        >
          {(user?.name ?? '?').slice(0, 1).toUpperCase()}
        </span>
      )}
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Аватар обрізається до квадрата й зберігається у файловому сервісі (ЛР02)
        </p>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-2"
          onClick={() => inputRef.current?.click()}
        >
          Обрати зображення
        </Button>
      </div>

      <Modal
        open={selected !== null}
        title="Обріжте аватар"
        confirmText="Зберегти"
        tone="primary"
        isLoading={cropping || upload.isPending}
        onConfirm={saveCrop}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="flex flex-col items-center gap-3">
            <EasyCrop image={selected.url} onCropComplete={setCropArea} />
            <p className="text-xs text-gray-500">
              Тягніть за кути рамки, щоб обрізати зображення під аватар
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
