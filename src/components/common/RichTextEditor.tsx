import { useEffect } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { cn } from '@/utils/cn';

interface RichTextEditorProps {
  /** Початковий (або синхронізований ззовні) HTML */
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Підсвітка помилки валідації */
  error?: boolean;
}

// Розширений текстовий редактор на Tiptap (рівень 2, завдання 13).
// Важкий пакет, тому сторінка підключає його через React.lazy (рівень 3, завдання 15).
// Формат зберігаємо як HTML, на екран віддаємо лише через sanitizeHtml (RichText).
export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Опишіть деталі вашого питання...',
  error,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    // Стан редактора не рендериться на сервері; у SPA це захист від миготіння при гідратації
    immediatelyRender: false,
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  // Режим редагування: форма заповнюється через reset після завантаження запису —
  // синхронізуємо редактор лише коли зовнішнє значення реально відрізняється
  // (без цього власний onUpdate циклював би setContent ↔ onChange).
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (content && content !== current) editor.commands.setContent(content);
  }, [content, editor]);

  // Селектор повертає активність форматів: перерисовується лише панель кнопок
  const states = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive('bold'),
            italic: e.isActive('italic'),
            strike: e.isActive('strike'),
            bulletList: e.isActive('bulletList'),
            orderedList: e.isActive('orderedList'),
            blockquote: e.isActive('blockquote'),
            code: e.isActive('code'),
          }
        : null,
  });

  const btn =
    'rounded px-2 py-1 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800';
  const on = 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200';

  return (
    <div
      className={cn(
        'rounded-lg border bg-white transition-colors dark:bg-gray-900',
        error ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
      )}
    >
      <div
        className="flex flex-wrap items-center gap-1 border-b border-gray-200 p-1.5 dark:border-gray-700"
        role="toolbar"
        aria-label="Форматування тексту"
      >
        <button
          type="button"
          aria-label="Жирний"
          aria-pressed={states?.bold}
          disabled={!editor}
          className={cn(btn, states?.bold && on)}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <span className="font-bold">B</span>
        </button>
        <button
          type="button"
          aria-label="Курсив"
          aria-pressed={states?.italic}
          disabled={!editor}
          className={cn(btn, states?.italic && on)}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <span className="italic">I</span>
        </button>
        <button
          type="button"
          aria-label="Закреслений"
          aria-pressed={states?.strike}
          disabled={!editor}
          className={cn(btn, states?.strike && on)}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        >
          <span className="line-through">S</span>
        </button>
        <button
          type="button"
          aria-label="Маркований список"
          aria-pressed={states?.bulletList}
          disabled={!editor}
          className={cn(btn, states?.bulletList && on)}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          • Список
        </button>
        <button
          type="button"
          aria-label="Нумерований список"
          aria-pressed={states?.orderedList}
          disabled={!editor}
          className={cn(btn, states?.orderedList && on)}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          1. Нумерація
        </button>
        <button
          type="button"
          aria-label="Цитата"
          aria-pressed={states?.blockquote}
          disabled={!editor}
          className={cn(btn, states?.blockquote && on)}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          Цитата
        </button>
        <button
          type="button"
          aria-label="Код"
          aria-pressed={states?.code}
          disabled={!editor}
          className={cn(btn, states?.code && on)}
          onClick={() => editor?.chain().focus().toggleCode().run()}
        >
          {'</>'}
        </button>
      </div>

      <EditorContent
        editor={editor}
        className="prose-sm max-w-none px-3 py-2 [&_p]:min-h-6 [&_p.is-editor-empty:first-child]:before:text-gray-400 [&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)] dark:text-gray-100"
      />
    </div>
  );
}
