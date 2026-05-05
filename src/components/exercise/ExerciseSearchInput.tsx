import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface ExerciseSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => Promise<void>;
  isLoading: boolean;
  placeholder?: string;
}

export function ExerciseSearchInput({
  value,
  onChange,
  onSearch,
  isLoading,
  placeholder = 'Search exercises...',
}: ExerciseSearchInputProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      await onSearch(value);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim() && !isLoading) {
      await onSearch(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isLoading}
        minLength={2}
        className="flex-1"
      />
      <Button
        type="submit"
        disabled={isLoading || !value.trim() || value.trim().length < 2}
        size="icon"
      >
        <Search className="h-4 w-4" />
      </Button>
    </form>
  );
}
