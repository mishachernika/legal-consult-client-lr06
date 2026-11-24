import { useMemo } from 'react';
import { cn } from '@/utils/cn';
import { sanitizeHtml } from '@/utils/sanitizeHtml';

interface RichTextProps {
  html: string | null | undefined;
  className?: string;
}

// Відтворення rich text (Tiptap HTML) тільки через sanitizeHtml — теги й атрибути
// за межами білого списку викидаються, тому dangerouslySetInnerHTML безпечний.
export default function RichText({ html, className }: RichTextProps) {
  const safe = useMemo(() => sanitizeHtml(html ?? ''), [html]);
  return (
    <div
      className={cn('[&_a]:text-primary-600 [&_a]:underline', className)}
      dangerouslySetInnerHTML={{ __html: safe.html }}
    />
  );
}
