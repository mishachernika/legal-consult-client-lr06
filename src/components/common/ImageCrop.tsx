import { useState } from 'react';
import Cropper from 'react-easy-crop';

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropProps {
  image: string;
  onCropComplete: (area: CropArea) => void;
}

const THUMB_SIZE = 320;

// Обгортка react-easy-crop: відношення 1:1 (квадратний аватар).
// react-easy-crop повертає croppedAreaPixels — координати кадру в пікселях
// ОРИГІНАЛЬНОГО зображення, саме такі потрібні для canvas.drawImage.
export default function ImageCrop({ image, onCropComplete }: ImageCropProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        // react-easy-crop вимагає блок із явними розмірами
        style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
        className="relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
      >
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="rect"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, croppedAreaPixels) => onCropComplete(croppedAreaPixels)}
        />
      </div>
      <label className="flex w-full items-center gap-3 text-sm">
        Масштаб:
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 accent-primary-600"
          aria-label="Масштаб зображення"
        />
      </label>
    </div>
  );
}
