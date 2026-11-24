// Безпечне відтворення HTML з rich text редактора.
// Обгортає рядок у DOM, видаляє все, крім білого списку тегів, і залишає
// href лише для https/http посилань. Текст-вузли при копіюванні не
// інтерпретуються як HTML, тому ін'єкції через <script> чи onerror неможливі.
const ALLOWED_TAGS = new Set([
  'P',
  'BR',
  'B',
  'STRONG',
  'I',
  'EM',
  'U',
  'S',
  'CODE',
  'PRE',
  'BLOCKQUOTE',
  'UL',
  'OL',
  'LI',
  'H1',
  'H2',
  'H3',
  'A',
]);

// Старі записи могли пройти через серверну HTML-ескапізацію і зберегтися як
// `&lt;p&gt;...&lt;/p&gt;`. Декодуємо такий рядок один раз ПЕРЕД санітизацією —
// інакше користувач побачить самі теги. Будь-яка розмітка після декодування
// усе одно проходить через whitelist нижче.
function decodeEscapedMarkup(input: string): string {
  if (!/&lt;\/?[a-z][^&]*&gt;/i.test(input)) return input;
  const decoder = document.createElement('textarea');
  decoder.innerHTML = input;
  return decoder.value;
}

function copyAllowedAttributes(el: Element): Element {
  if (el.tagName === 'A') {
    const href = el.getAttribute('href');
    if (href && /^https?:\/\//i.test(href)) {
      el.setAttribute('href', href);
      el.setAttribute('rel', 'noopener noreferrer nofollow');
      el.setAttribute('target', '_blank');
    } else {
      el.removeAttribute('href');
    }
  }
  // прибираємо всі інші атрибути (style, class, on*)
  for (const attr of [...el.attributes]) {
    if (attr.name !== 'href' && attr.name !== 'rel' && attr.name !== 'target') {
      el.removeAttribute(attr.name);
    }
  }
  return el;
}

export function sanitizeHtml(input: string): { html: string; text: string } {
  const template = document.createElement('template');
  template.innerHTML = decodeEscapedMarkup(input);

  const walk = (node: Node, parent: Node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) continue; // текст лишається як є
      if (child.nodeType !== Node.ELEMENT_NODE) {
        child.remove();
        continue;
      }
      const el = child as Element;
      if (!ALLOWED_TAGS.has(el.tagName)) {
        // непридатний тег — вставляємо його текстовий вміст замість нього
        parent.replaceChild(document.createTextNode(el.textContent ?? ''), el);
        continue;
      }
      copyAllowedAttributes(el);
      walk(el, el);
    }
  };
  walk(template.content, template.content);

  return { html: template.innerHTML, text: template.content.textContent ?? '' };
}

/** Довжина видимого тексту (без тегів) — для валідації форми */
export function htmlTextLength(html: string | undefined | null): number {
  if (!html) return 0;
  const template = document.createElement('template');
  template.innerHTML = html;
  const text = template.content.textContent ?? '';
  // Tiptap додає кінцевий <br> — у валідації його не враховуємо
  return text.replace(/\s+$/, '').length;
}
