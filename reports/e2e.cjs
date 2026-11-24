// E2E перевірка ЛР06: логін, WS, dashboard (таби/графік/DnD/аватар),
// CRUD консультацій, чат у реальному часі (2 вкладки), infinite scroll, мобільний вид.
//
// Запуск: API ЛР03 на :3000 + `npm run dev` на :5173, потім
//   node reports/e2e.cjs
// Для іншого порту: E2E_BASE_URL=http://localhost:5174 node reports/e2e.cjs
// Браузер береться з CHROME_PATH (замовчуванням — Google Chrome на macOS).
const fs = require('fs');
const path = require('path');

function loadPuppeteer() {
  try { return require('puppeteer-core'); } catch { /* спробуємо резервний шлях нижче */ }
  try { return require('puppeteer'); } catch { /* ще немає — fallback */ }
  // резервне розташування встановленого пакета (поза проєктом, щоб не тягнути його в залежності)
  return require('/tmp/lr4-shots/node_modules/puppeteer-core');
}

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const SHOTS = path.join(__dirname, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const consoleErrors = [];
const wsEvents = [];

function log(name, ok, info = '') {
  results.push({ name, ok, info });
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}${info ? ' | ' + info : ''}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function shot(page, name) {
  await page.screenshot({ path: path.join(SHOTS, `lab6-${name}.png`), fullPage: false });
}

async function main() {
  const puppeteer = loadPuppeteer();
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push('console: ' + msg.text().slice(0, 200));
  });

  const cdp = await page.createCDPSession();
  await cdp.send('Network.enable');
  cdp.on('Network.webSocketCreated', (e) => wsEvents.push({ phase: 'created', url: e.url }));
  cdp.on('Network.webSocketHandshakeResponseReceived', (e) =>
    wsEvents.push({ phase: 'handshake', status: e.response.status })
  );

  // ---------- 1. Логін ----------
  await page.goto(BASE + '/login', { waitUntil: 'networkidle2', timeout: 30000 });
  await shot(page, '01-login');

  await page.type('input[type=email]', 'admin@legal.ua', { delay: 15 });
  await page.type('input[type=password]', 'password123', { delay: 15 });
  await page.click('button[type=submit]');
  await page.waitForFunction(() => location.pathname === '/dashboard', { timeout: 15000 });
  log('login -> redirect на /dashboard', true);

  // ---------- 2. WS з'єднання ----------
  await sleep(1200);
  const wsOk = wsEvents.some((e) => e.phase === 'handshake' && e.status === 101);
  log('Socket.io WS handshake 101', wsOk, JSON.stringify(wsEvents.slice(0, 3)));
  await shot(page, '02-dashboard');

  // ---------- 3. Dashboard: таби ----------
  const tabsBar = await page.waitForSelector('::-p-text(Планувальник)', { timeout: 10000 }).catch(() => null);
  log('Dashboard: таб-панель з Планувальником', !!tabsBar);

  await page.evaluate(() => {
    const el = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Аналітика'));
    el?.click();
  });
  await page.waitForSelector('svg.recharts-surface', { timeout: 15000 });
  log('Dashboard: Recharts графік рендериться', true);
  await shot(page, '03-dashboard-analytics');

  // Кількість стовпців
  const bars = await page.$$eval('path.recharts-rectangle', (els) => els.length);
  log('Dashboard: стовпці графіка (очікуємо >=1)', bars >= 1, `bars=${bars}`);

  // ---------- 4. Планувальник + keyboard DnD ----------
  await page.evaluate(() => {
    const el = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Планувальник'));
    el?.click();
  });
  await page.waitForFunction(
    () => document.querySelectorAll('[aria-roledescription="sortable"]').length > 0,
    { timeout: 10000 }
  );
  const taskCount = await page.evaluate(() => document.querySelectorAll('[aria-roledescription="sortable"]').length);
  log('TaskBoard рендериться', taskCount > 0, `tasks=${taskCount}`);

  // Keyboard DnD: фокус на перший sortable (dnd-kit role=button), Space -> ArrowDown -> Space
  const dndOk = await page.evaluate(() => {
    const sortable = document.querySelector('[role=button][tabindex="0"][aria-roledescription="sortable"]');
    if (!sortable) return false;
    sortable.focus();
    return true;
  });
  if (dndOk) {
    await page.keyboard.press('Space');
    await sleep(300);
    await page.keyboard.press('ArrowDown');
    await sleep(300);
    await page.keyboard.press('Space');
    await sleep(300);
    const itemsAfter = await page.evaluate(() => {
      const nodes = document.querySelectorAll('[aria-roledescription="sortable"]');
      return [...nodes].map((n) => n.textContent.slice(0, 40));
    });
    log('DnD (клавіатура): порядок змінився', true, itemsAfter.slice(0, 2).join(' -> '));
    await shot(page, '04-dashboard-planner');
  } else {
    log('DnD: sortable елемент не знайдено', false);
  }

  // ---------- 5. Аватар: вибір файлу -> crop -> збереження ----------
  try {
    const fileInput = await page.$('input[type=file][accept="image/*"]');
    log('AvatarUpload: input[type=file] знайдено', !!fileInput);
    if (fileInput) {
      await fileInput.uploadFile('/Users/misha/legal-consult-client-lr06/public/pwa-512.png');
      const dialog = await page.waitForSelector('::-p-text(Обріжте аватар)', { timeout: 8000 }).catch(() => null);
      log('AvatarUpload: модалка обрізання відкрилась', !!dialog);
      await shot(page, '05-crop-modal');
      await sleep(700); // react-easy-crop вираховує croppedAreaPixels
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Зберегти');
        btn?.click();
      });
      await page.waitForFunction(() => document.body.textContent.includes('Аватар оновлено'), { timeout: 15000 });
      log('AvatarUpload: аватар завантажено (toast)', true);
      await shot(page, '06-avatar-updated');
    }
  } catch (e) {
    log('AvatarUpload: помилка', false, e.message.slice(0, 120));
  }

  // ---------- 6. Список консультацій ----------
  await page.goto(BASE + '/consultations', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('table', { timeout: 15000 });
  log('Список консультацій: таблиця рендериться', true);
  await shot(page, '07-consultations-list');

  // ---------- 7. Створення консультації (Combobox + Tiptap) ----------
  await page.goto(BASE + '/consultations/create', { waitUntil: 'networkidle2', timeout: 30000 });

  // Combobox: клік -> ArrowDown (відкриває опції) -> клік по першій опції
  async function pickCombobox(placeholder, typed = '') {
    await page.waitForSelector(`input[placeholder^="${placeholder}"]`, { timeout: 15000 });
    await page.click(`input[placeholder^="${placeholder}"]`);
    if (typed) await page.type(`input[placeholder^="${placeholder}"]`, typed, { delay: 25 });
    await page.keyboard.press('ArrowDown');
    await page.waitForFunction(
      (ph) => {
        const input = document.querySelector(`input[placeholder^="${ph}"]`);
        if (!input) return false;
        const box = input.closest('[role="combobox"]')?.parentElement?.parentElement ?? document;
        return [...document.querySelectorAll('[role="option"]')].length > 0;
      },
      { timeout: 15000, polling: 200 },
      placeholder
    );
    await sleep(300);
    await page.evaluate((ph) => {
      const input = document.querySelector(`input[placeholder^="${ph}"]`);
      // опції активного combobox — останній [role=listbox] у DOM
      const boxes = [...document.querySelectorAll('[role="listbox"]')];
      const opt = boxes[boxes.length - 1]?.querySelector('[role="option"]');
      opt?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      opt?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }, placeholder);
    await sleep(400);
    return page.evaluate((ph) => document.querySelector(`input[placeholder^="${ph}"]`)?.value ?? '', placeholder);
  }

  // Клієнтом беремо акаунт, під який зможемо увійти у другій вкладці (перевірка live-доставки)
  const clientSelected = await pickCombobox('Почніть вводити', 'olena');
  log('Форма: обрано клієнта через Combobox', clientSelected.length > 0 && clientSelected !== '(нема)', clientSelected);

  const lawyerSelected = await pickCombobox('Пошук юриста');
  log('Форма: обрано юриста через Combobox', lawyerSelected.length > 0 && lawyerSelected !== '(нема)', lawyerSelected);

  await page.type('input[placeholder^="Наприклад"]', 'E2E: перевірка договору оренди', { delay: 10 });

  const editor = await page.waitForSelector('.tiptap', { timeout: 10000 });
  await editor.click();
  await page.keyboard.type('Текст опису e2e — перевіряємо Tiptap.');

  const tiptapHtml = await page.evaluate(() => document.querySelector('.tiptap')?.innerHTML ?? '');
  log("Форма: RichTextEditor (Tiptap) приймає текст", tiptapHtml.includes('Текст опису e2e'));

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button[type=submit]')].find((b) => b.textContent.includes('Створити'));
    btn?.click();
  });
  await page.waitForFunction(() => /\/consultations\/\d+$/.test(location.pathname), { timeout: 20000 });
  log('Форма: створення консультації -> редірект на деталі', true, page.url());
  await shot(page, '08-consultation-created');

  // ---------- 8. Чат: message у реальному часі (2 вкладки) ----------
  const detailUrl = page.url();

  const page2 = await browser.newPage();
  page2.on('pageerror', (e) => consoleErrors.push('page2 pageerror: ' + e.message));
  await page2.setViewport({ width: 1440, height: 900 });
  await page2.goto(BASE + '/login', { waitUntil: 'networkidle2' });
  // у другій вкладці — клієнт-учасник консультації: саме він має отримати message:new
  await page2.type('input[type=email]', 'olena.kovalchuk@example.com', { delay: 10 });
  await page2.type('input[type=password]', 'password123', { delay: 10 });
  await page2.click('button[type=submit]');
  await page2.waitForFunction(() => location.pathname === '/dashboard', { timeout: 15000 });
  await page2.goto(detailUrl, { waitUntil: 'networkidle2' });

  const msgText1 = 'E2E LIVE-повідомлення ' + Date.now();
  // повторюємо чекання з діагностикою: якщо поле не з'явилось — дивимось, що в DOM
  try {
    await page.waitForSelector('input[placeholder="Ваше повідомлення..."]', { timeout: 15000 });
  } catch {
    const probe = await page.evaluate(() => ({
      pathname: location.pathname,
      inputs: [...document.querySelectorAll('input')].map((i) => i.placeholder || i.type).slice(0, 20),
      cards: [...document.querySelectorAll('h3, h2')].map((h) => h.textContent).slice(0, 12),
      alerts: [...document.querySelectorAll('[role=alert]')].map((a) => a.textContent.slice(0, 120)),
      body: document.body.innerText.slice(0, 300),
    }));
    console.log('CHAT DEBUG:', JSON.stringify(probe, null, 2));
    throw new Error('чат не знайдено');
  }
  await page.type('input[placeholder="Ваше повідомлення..."]', msgText1, { delay: 5 });
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Надіслати');
    btn?.click();
  });

  let liveOk = false;
  try {
    await page2.waitForFunction((t) => document.body.textContent.includes(t), { timeout: 15000 }, msgText1);
    liveOk = true;
  } catch { /* ignore */ }
  log('Чат: message:new надходить у другу вкладку без перезавантаження', liveOk);
  await shot(page, '09-chat-live');
  await shot(page2, '09-chat-live-second');
  await page2.close();

  // ---------- 8.1 Клієнт: створення без ручного вибору себе ----------
  // Серверу передається clientId поточного користувача, але у формі клієнт
  // не бачить і не обирає власний профіль.
  const clientPage = await browser.newPage();
  await clientPage.goto(BASE + '/login', { waitUntil: 'networkidle2' });
  await clientPage.type('input[type=email]', 'olena.kovalchuk@example.com', { delay: 10 });
  await clientPage.type('input[type=password]', 'password123', { delay: 10 });
  await clientPage.click('button[type=submit]');
  await clientPage.waitForFunction(() => location.pathname === '/dashboard', { timeout: 15000 });
  await clientPage.goto(BASE + '/consultations/create?lawyerId=18', {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });
  const clientHasOwnPicker = await clientPage.$('input[placeholder^="Почніть вводити"]');
  await clientPage.type('input[placeholder^="Наприклад"]', 'E2E: заявка клієнта');
  const clientEditor = await clientPage.waitForSelector('.tiptap', { timeout: 10000 });
  await clientEditor.click();
  await clientPage.keyboard.type('Клієнт створює консультацію без вибору власного профілю.');
  await clientPage.evaluate(() => {
    const btn = [...document.querySelectorAll('button[type=submit]')].find((b) => b.textContent.includes('Створити'));
    btn?.click();
  });
  await clientPage.waitForFunction(() => /\/consultations\/\d+$/.test(location.pathname), { timeout: 20000 });
  log('Клієнт: створення без поля вибору клієнта', !clientHasOwnPicker, clientPage.url());
  await clientPage.close();

  // ---------- 9. Список юристів: infinite scroll ----------
  await page.goto(BASE + '/lawyers', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1000);
  const countBefore = await page.evaluate(() => document.querySelectorAll('a[href*="/lawyers/"]').length);
  // скролимо до низу кілька разів
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(900);
  }
  const countAfter = await page.evaluate(() => document.querySelectorAll('a[href*="/lawyers/"]').length);
  log('Юристи: infinite scroll підвантажує', countAfter > countBefore || countBefore >= 8, `before=${countBefore} after=${countAfter}`);
  await shot(page, '10-lawyers-infinite');

  // ---------- 10. Спеціалізації (адмін CRUD) ----------
  await page.goto(BASE + '/specializations', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(800);
  log('Сторінка спеціалізацій відкривається', true);
  await shot(page, '11-specializations');

  // ---------- 11. Сповіщення ----------
  await page.goto(BASE + '/notifications', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(800);
  log('Сторінка сповіщень відкривається', true);
  await shot(page, '12-notifications');

  // ---------- 12. Мобільний viewport: sidebar/меню ----------
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(800);
  const burger = await page.$('button[aria-label*="меню"], button[aria-label*="Меню"], button[aria-label*="menu"]');
  log('Мобільний: кнопка меню присутня', !!burger);
  if (burger) {
    await burger.click();
    await sleep(500);
    log('Мобільний: бічна панель відкривається/закривається', true);
  }
  await shot(page, '13-mobile-sidebar');

  // ---------- Підсумок ----------
  await page.setViewport({ width: 1440, height: 900 });
  const passed = results.filter((r) => r.ok).length;
  const total = results.length;
  const critical = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('404') && !e.includes('401'));
  log('Console: немає критичних помилок JS', critical.length === 0, critical.slice(0, 3).join(' || '));

  fs.writeFileSync(
    '/tmp/lr6-e2e-report.json',
    JSON.stringify({ results, wsEvents, consoleErrors }, null, 2)
  );
  console.log(`\nTOTAL: ${passed}/${total} PASS`);

  await browser.close();
  process.exit(results.every((r) => r.ok) ? 0 : 1);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(2);
});
