import { useState, useRef, useEffect, useMemo } from 'react';
import { OnScreenKeyboard } from './OnScreenKeyboard.tsx';
import { TransliterationHelp } from './TransliterationHelp.tsx';
import { transliterateWithMappings } from '../../utils/transliteration.ts';
import { useTransliterationStore } from '../../stores/transliterationStore.ts';
import type { ScriptType, TextDirection } from '../../types/language.ts';

interface ScriptInputProps {
  value: string;
  onChange: (value: string) => void;
  script: ScriptType;
  direction?: TextDirection;
  placeholder?: string;
  className?: string;
  showKeyboard?: boolean;
  multiline?: boolean;
  rows?: number;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  autoTransliterate?: boolean;
}

export function ScriptInput({
  value,
  onChange,
  script,
  direction = 'rtl',
  placeholder,
  className = '',
  showKeyboard = true,
  multiline = false,
  rows = 3,
  onKeyDown,
  autoTransliterate = true,
}: ScriptInputProps) {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(value.length);
  const [translitEnabled, setTranslitEnabled] = useState(autoTransliterate);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const lastValueRef = useRef(value);

  // Get custom mappings from store
  const { getMappings } = useTransliterationStore();
  const mappings = useMemo(() => getMappings(script), [getMappings, script]);

  const fontClass = script === 'syriac' ? 'font-syriac' : 'font-hebrew';

  const handleKeyPress = (char: string) => {
    const before = value.slice(0, cursorPosition);
    const after = value.slice(cursorPosition);
    const newValue = before + char + after;
    onChange(newValue);
    setCursorPosition(cursorPosition + char.length);
    inputRef.current?.focus();
  };

  const handleBackspace = () => {
    if (cursorPosition > 0) {
      const before = value.slice(0, cursorPosition - 1);
      const after = value.slice(cursorPosition);
      onChange(before + after);
      setCursorPosition(cursorPosition - 1);
    }
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const selStart = e.target.selectionStart || 0;

    if (translitEnabled && newValue.length > lastValueRef.current.length) {
      // User typed something - find what was added
      const addedLength = newValue.length - lastValueRef.current.length;
      const addedStart = selStart - addedLength;
      const addedText = newValue.slice(addedStart, selStart);

      // Check if it's Latin text that should be transliterated
      if (/^[a-zA-Z':]+$/.test(addedText)) {
        const transliterated = transliterateWithMappings(
          addedText,
          mappings.consonants,
          mappings.vowels
        );

        if (transliterated !== addedText) {
          // Replace the Latin text with transliterated text
          const before = newValue.slice(0, addedStart);
          const after = newValue.slice(selStart);
          const finalValue = before + transliterated + after;

          onChange(finalValue);
          const newCursorPos = addedStart + transliterated.length;
          setCursorPosition(newCursorPos);
          lastValueRef.current = finalValue;

          // Set cursor position after React re-render
          requestAnimationFrame(() => {
            if (inputRef.current) {
              inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
          });
          return;
        }
      }
    }

    onChange(newValue);
    setCursorPosition(selStart);
    lastValueRef.current = newValue;
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    setCursorPosition(target.selectionStart || 0);
  };

  useEffect(() => {
    if (cursorPosition > value.length) {
      setCursorPosition(value.length);
    }
    lastValueRef.current = value;
  }, [value, cursorPosition]);

  const inputClassName = `w-full px-4 py-3 text-xl border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fontClass} ${className}`;

  return (
    <div className="space-y-2">
      {/* Input */}
      {multiline ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={handleInputChange}
          onSelect={handleSelect}
          onKeyDown={onKeyDown}
          dir={direction}
          className={inputClassName}
          placeholder={placeholder}
          rows={rows}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={value}
          onChange={handleInputChange}
          onSelect={handleSelect}
          onKeyDown={onKeyDown}
          dir={direction}
          className={inputClassName}
          placeholder={placeholder}
        />
      )}

      {/* Controls row */}
      {showKeyboard && (
        <div className="flex items-center gap-3">
          {/* Transliteration toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={translitEnabled}
              onChange={(e) => setTranslitEnabled(e.target.checked)}
              className="w-3.5 h-3.5 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Auto-convert
            </span>
          </label>

          {/* Help button */}
          <TransliterationHelp script={script} />

          {/* Keyboard toggle */}
          {!keyboardVisible ? (
            <button
              type="button"
              onClick={() => setKeyboardVisible(true)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Show Keyboard
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setKeyboardVisible(false)}
              className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
            >
              Hide Keyboard
            </button>
          )}
        </div>
      )}

      {/* On-screen keyboard */}
      {showKeyboard && keyboardVisible && (
        <OnScreenKeyboard
          script={script}
          onKeyPress={handleKeyPress}
          onBackspace={handleBackspace}
        />
      )}
    </div>
  );
}
