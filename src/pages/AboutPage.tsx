import Badge from '@/components/common/Badge';
import ButtonLink from '@/components/common/ButtonLink';
import Card from '@/components/common/Card';
import { APP_NAME, CONTACTS, ROUTES } from '@/constants';

const BENEFITS = [
  {
    title: 'Обирайте впевнено',
    text: 'Дивіться сферу права, досвід, ціну та відгуки у профілі юриста до початку консультації.',
    icon: '✓',
  },
  {
    title: 'Спілкуйтеся у зручний час',
    text: 'Створіть заявку, опишіть ситуацію та узгодьте деталі з юристом у захищеному чаті.',
    icon: '↗',
  },
  {
    title: 'Тримайте все під рукою',
    text: 'Історія консультацій, статуси та повідомлення залишаються у вашому особистому кабінеті.',
    icon: '▣',
  },
];

const STEPS = [
  ['01', 'Оберіть фахівця', 'Скористайтеся каталогом і фільтром за потрібною сферою права.'],
  ['02', 'Опишіть ситуацію', 'Створіть консультацію та додайте деталі, важливі для розгляду.'],
  ['03', 'Отримайте відповідь', 'Спілкуйтеся в чаті й відстежуйте статус у власному кабінеті.'],
];

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-16 pb-4">
      <section className="relative overflow-hidden rounded-3xl bg-primary-950 shadow-xl">
        <img
          src="/images/legal-consult-hero.jpg"
          alt="Робочий простір юридичної консультації"
          className="absolute inset-0 h-full w-full object-cover object-right opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-950 via-primary-950/95 to-primary-900/20" />
        <div className="relative max-w-3xl px-6 py-16 text-white sm:px-10 md:py-20 lg:px-14">
          <Badge variant="info">Про LegalConsult</Badge>
          <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl">
            Юридична допомога має бути зрозумілою
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-primary-100">
            {APP_NAME} допомагає знайти фахівця, спокійно описати свою ситуацію та отримати
            відповідь в одному зручному місці.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/lawyers" size="lg">
              Знайти юриста
            </ButtonLink>
            <ButtonLink to={ROUTES.register} size="lg" variant="secondary">
              Створити акаунт
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-600">Наш підхід</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
          Менше невизначеності. Більше ясності у вашому питанні.
        </h2>
        <p className="mt-4 text-lg leading-8 text-gray-600 dark:text-gray-300">
          Ми зібрали ключові речі для комфортної онлайн-консультації: зрозумілий пошук,
          прозорі профілі юристів і листування без зайвих дзвінків чи паперів.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {BENEFITS.map((benefit) => (
          <Card key={benefit.title} className="h-full transition-shadow hover:shadow-lg">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-xl font-bold text-primary-700 dark:bg-primary-900 dark:text-primary-100">
              {benefit.icon}
            </span>
            <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">{benefit.title}</h3>
            <p className="mt-2 leading-7">{benefit.text}</p>
          </Card>
        ))}
      </section>

      <section className="rounded-3xl bg-gray-100 px-6 py-10 dark:bg-gray-900 sm:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-600">Як це працює</p>
          <h2 className="mt-3 text-3xl font-bold">Від питання до консультації — у три кроки</h2>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map(([number, title, text]) => (
            <div key={number} className="border-t-2 border-primary-200 pt-4 dark:border-primary-900">
              <p className="text-sm font-bold tracking-wider text-primary-600">{number}</p>
              <h3 className="mt-2 text-lg font-semibold">{title}</h3>
              <p className="mt-2 leading-7 text-gray-600 dark:text-gray-300">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3" title="Конфіденційність і контроль">
          <p className="leading-7">
            Доступ до консультацій мають лише їхні учасники та адміністратор платформи. Ви бачите
            статус заявки, історію повідомлень і самі вирішуєте, яку інформацію додати до опису.
          </p>
        </Card>
        <Card className="lg:col-span-2" title="Маєте запитання?">
          <p>Напишіть або зателефонуйте — допоможемо зорієнтуватися в роботі платформи.</p>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <a href={`mailto:${CONTACTS.email}`} className="font-medium text-primary-600 hover:underline">
              {CONTACTS.email}
            </a>
            <a href={`tel:${CONTACTS.phoneHref}`} className="font-medium text-primary-600 hover:underline">
              {CONTACTS.phone}
            </a>
            <a
              href={CONTACTS.addressUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary-600 hover:underline"
            >
              {CONTACTS.address}
            </a>
          </div>
        </Card>
      </section>
    </div>
  );
}
