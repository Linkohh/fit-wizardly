import { Monitor, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { ThemeMode } from '@/stores/themeStore';

const THEME_MODE_OPTIONS = [
  {
    mode: 'light' as const,
    labelKey: 'header.theme.light',
    fallback: 'Light',
    Icon: Sun,
  },
  {
    mode: 'system' as const,
    labelKey: 'header.theme.system',
    fallback: 'System',
    Icon: Monitor,
  },
  {
    mode: 'dark' as const,
    labelKey: 'header.theme.dark',
    fallback: 'Dark',
    Icon: Moon,
  },
];

interface ThemeModePillProps {
  mode: ThemeMode;
  onChange: (mode: ThemeMode) => void;
  containerClassName: string;
  buttonClassName: string;
  testId?: string;
}

export function ThemeModePill({
  mode,
  onChange,
  containerClassName,
  buttonClassName,
  testId,
}: ThemeModePillProps) {
  const { t } = useTranslation();

  return (
    <div className={containerClassName} data-testid={testId}>
      {THEME_MODE_OPTIONS.map(({ mode: optionMode, labelKey, fallback, Icon }) => (
        <button
          key={optionMode}
          type="button"
          aria-label={t(labelKey, fallback)}
          aria-pressed={mode === optionMode}
          onClick={() => onChange(optionMode)}
          className={cn(buttonClassName)}
          data-selected={mode === optionMode}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
