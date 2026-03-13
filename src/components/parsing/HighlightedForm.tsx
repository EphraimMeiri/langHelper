import type { HighlightRange } from '../../types/parsing';
import { useSettingsStore, getFontSizeClass } from '../../stores/settingsStore';
import { useLanguageStore } from '../../stores/languageStore';

interface HighlightedFormProps {
  form: string;
  highlights: HighlightRange[];
  showLabels?: boolean;
}

export function HighlightedForm({ form, highlights, showLabels = false }: HighlightedFormProps) {
  const { fontSize, showSegmentColors } = useSettingsStore();
  const { getCurrentLanguage } = useLanguageStore();
  const currentLang = getCurrentLanguage();

  if (!form) return null;

  // Sort highlights by start position
  const sortedHighlights = [...highlights].sort((a, b) => a.start - b.start);

  // Build segments with highlights
  const segments: Array<{ text: string; highlight?: HighlightRange }> = [];
  let lastEnd = 0;

  for (const hl of sortedHighlights) {
    // Add text before this highlight
    if (hl.start > lastEnd) {
      segments.push({ text: form.slice(lastEnd, hl.start) });
    }

    // Add highlighted text
    segments.push({
      text: form.slice(hl.start, hl.end),
      highlight: hl,
    });

    lastEnd = hl.end;
  }

  // Add remaining text
  if (lastEnd < form.length) {
    segments.push({ text: form.slice(lastEnd) });
  }

  // If no segments, show the whole form
  if (segments.length === 0) {
    segments.push({ text: form });
  }

  const getHighlightClass = (type: HighlightRange['type']): string => {
    if (!showSegmentColors) return '';

    switch (type) {
      case 'root':
        return 'bg-blue-200 dark:bg-blue-700';
      case 'affix':
        return 'bg-green-200 dark:bg-green-700';
      case 'match':
        return 'bg-yellow-200 dark:bg-yellow-700';
      default:
        return '';
    }
  };

  const fontClass = currentLang?.script === 'syriac' ? 'font-syriac' : 'font-hebrew';

  return (
    <span
      className={`${fontClass} ${getFontSizeClass(fontSize)} inline-flex items-baseline`}
      dir={currentLang?.direction || 'rtl'}
    >
      {segments.map((seg, idx) => (
        <span
          key={idx}
          className={`relative ${
            seg.highlight ? `${getHighlightClass(seg.highlight.type)} rounded px-0.5 mx-0.5` : ''
          } transition-all duration-300`}
        >
          {seg.text}
          {showLabels && seg.highlight?.label && (
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {seg.highlight.label}
            </span>
          )}
        </span>
      ))}
    </span>
  );
}
