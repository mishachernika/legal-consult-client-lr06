import ButtonLink from '@/components/common/ButtonLink';
import { ROUTES } from '@/constants';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-6 py-20 text-center">
      <p className="text-7xl font-bold text-primary-600">404</p>
      <h1 className="text-2xl font-bold">Сторінку не знайдено</h1>
      <p className="max-w-md text-gray-600 dark:text-gray-300">
        Схоже, ви перейшли за неіснуючим посиланням або сторінку було переміщено.
      </p>
      <ButtonLink to={ROUTES.home}>На головну</ButtonLink>
    </div>
  );
}
