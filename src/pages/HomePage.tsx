import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Badge from '@/components/common/Badge';
import ButtonLink from '@/components/common/ButtonLink';
import Card from '@/components/common/Card';
import Input from '@/components/common/Input';
import { ROUTES } from '@/constants';
import { specializationsService } from '@/services/specializations.service';
import { useAuthStore } from '@/stores/authStore';

const STEPS = [
  { title: 'Опишіть ситуацію', text: 'Створіть консультацію з темою та детальним описом питання.' },
  {
    title: 'Оберіть юриста',
    text: 'Перегляньте профілі, рейтинги та ціни, оберіть фахівця зі сфери права.',
  },
  {
    title: 'Спілкуйтеся в чаті',
    text: 'Обговорюйте деталі в чаті консультації — повідомлення надходять у реальному часі.',
  },
];

export default function HomePage() {
  const [query, setQuery] = useState('');
  const user = useAuthStore((s) => s.user);
  const { data: specializations = [], isPending } = useQuery({
    queryKey: ['specializations'],
    queryFn: specializationsService.getAll,
  });

  const filtered = useMemo(
    () =>
      specializations.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          (s.description ?? '').toLowerCase().includes(query.toLowerCase())
      ),
    [query, specializations]
  );

  return (
    <div className="flex flex-col gap-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-primary-950 shadow-xl">
        <img
          src="/images/legal-consult-hero.jpg"
          alt="Робочий простір юридичної консультації"
          className="absolute inset-0 h-full w-full object-cover object-right opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-950 via-primary-950/90 to-primary-900/15" />
        <div className="relative grid min-h-[480px] items-center px-6 py-14 sm:px-10 lg:grid-cols-2 lg:px-14">
          <div className="max-w-xl text-left text-white">
            <Badge variant="info">Онлайн-платформа юридичних консультацій</Badge>
            <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl">
              Юридична допомога, коли вона справді потрібна
            </h1>
            <p className="mt-5 text-lg leading-8 text-primary-100">
              Знайдіть юриста за сферою права, обговоріть деталі в чаті та тримайте всі консультації
              в одному кабінеті.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink to="/lawyers" size="lg">
                Знайти юриста
              </ButtonLink>
              <ButtonLink
                to={user ? ROUTES.dashboard : ROUTES.register}
                size="lg"
                variant="secondary"
              >
                {user ? 'Відкрити кабінет' : 'Створити акаунт'}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* Переваги */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { value: 'Пошук', label: 'юриста за потрібною сферою права' },
          { value: 'Прозоро', label: 'ціна, досвід і відгуки у профілі' },
          { value: 'У чаті', label: 'повідомлення без перезавантаження' },
        ].map((s) => (
          <Card key={s.label} className="text-center">
            <p className="text-xl font-bold text-primary-600">{s.value}</p>
            <p className="mt-1">{s.label}</p>
          </Card>
        ))}
      </section>

      {/* Пошук сфер права (демо Input + фільтрація на клієнті) */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Сфери права</h2>
          <p className="max-w-xl text-gray-600 dark:text-gray-300">
            Знайдіть фахівця під ваше питання — від сімейних спорів до податкових перевірок.
          </p>
          <div className="w-full max-w-md">
            <Input
              type="search"
              placeholder="Пошук сфери права..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        {isPending ? (
          <p className="text-center text-gray-500 dark:text-gray-400">Завантаження сфер права...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Нічого не знайдено за запитом «{query}».
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => (
              <Card
                key={s.id}
                title={
                  <span className="flex items-center justify-between gap-2">
                    {s.name}
                    <Badge variant="info">від 500 ₴/год</Badge>
                  </span>
                }
                footer={
                  <ButtonLink to={`/lawyers?specializationId=${s.id}`} size="sm">
                    Знайти юриста
                  </ButtonLink>
                }
              >
                {s.description ?? 'Фахівці допоможуть розібратися у вашій ситуації.'}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Як це працює */}
      <section className="flex flex-col gap-6">
        <h2 className="text-center text-2xl font-bold md:text-3xl">Як це працює</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Card
              key={step.title}
              title={
                <span className="flex items-center gap-2">
                  <Badge variant="success">{i + 1}</Badge>
                  {step.title}
                </span>
              }
            >
              {step.text}
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl bg-primary-600 px-6 py-12 text-center text-white">
        <h2 className="text-2xl font-bold md:text-3xl">Потрібна порада юриста прямо зараз?</h2>
        <p className="mx-auto mt-3 max-w-xl text-primary-100">
          Зареєструйтеся за хвилину та поставте перше запитання перевіреному фахівцеві.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <ButtonLink to={user ? '/lawyers' : ROUTES.register} size="lg" variant="secondary">
            {user ? 'Перейти до каталогу' : 'Створити акаунт'}
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
