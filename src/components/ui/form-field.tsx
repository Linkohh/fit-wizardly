import * as React from 'react';
import { Controller, Control, FieldValues, Path, PathValue } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { errorMessageVariants, shakeVariants } from '@/lib/formAnimations';

export interface FormFieldOption {
  value: string;
  label: string;
  description?: string;
}

export interface FormFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label: string;
  type?: 'text' | 'number' | 'email' | 'password' | 'select' | 'textarea' | 'radio-group';
  options?: FormFieldOption[];
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  showWhen?: (values: T) => boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  rows?: number;
}

export function FormField<T extends FieldValues>({
  name,
  control,
  label,
  type = 'text',
  options = [],
  placeholder,
  helpText,
  required = false,
  disabled = false,
  className,
  inputClassName,
  showWhen,
  maxLength,
  min,
  max,
  rows = 3,
}: FormFieldProps<T>) {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error, isTouched }, formState: { isValid } }) => {
        // Progressive disclosure: if showWhen is provided, check if field should be shown
        // Note: This requires access to form values, which we'll handle at the parent level

        const hasError = error && isTouched;
        const isSuccess = isTouched && !error && field.value;
        const fieldId = `field-${String(name)}`;
        const errorId = `${fieldId}-error`;
        const helpId = `${fieldId}-help`;

        const renderInput = () => {
          switch (type) {
            case 'textarea':
              return (
                <Textarea
                  id={fieldId}
                  {...field}
                  value={field.value || ''}
                  placeholder={placeholder}
                  disabled={disabled}
                  maxLength={maxLength}
                  rows={rows}
                  onFocus={() => setIsFocused(true)}
                  onBlur={(e) => {
                    setIsFocused(false);
                    field.onBlur();
                  }}
                  aria-required={required}
                  aria-invalid={hasError}
                  aria-describedby={cn(
                    hasError && errorId,
                    helpText && helpId
                  ) || undefined}
                  className={cn(
                    hasError && 'border-destructive',
                    inputClassName
                  )}
                />
              );

            case 'select':
              return (
                <Select
                  value={field.value || ''}
                  onValueChange={field.onChange}
                  disabled={disabled}
                >
                  <SelectTrigger
                    id={fieldId}
                    className={cn(
                      hasError && 'border-destructive',
                      inputClassName
                    )}
                    aria-required={required}
                    aria-invalid={hasError}
                    aria-describedby={cn(
                      hasError && errorId,
                      helpText && helpId
                    ) || undefined}
                  >
                    <SelectValue placeholder={placeholder || 'Select...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <span>{option.label}</span>
                          {option.description && (
                            <span className="text-xs text-muted-foreground ml-2">
                              {option.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );

            case 'radio-group':
              return (
                <RadioGroup
                  value={field.value || ''}
                  onValueChange={field.onChange}
                  disabled={disabled}
                  className="space-y-2"
                  aria-required={required}
                  aria-invalid={hasError}
                  aria-describedby={cn(
                    hasError && errorId,
                    helpText && helpId
                  ) || undefined}
                >
                  {options.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={option.value}
                        id={`${fieldId}-${option.value}`}
                      />
                      <Label
                        htmlFor={`${fieldId}-${option.value}`}
                        className="font-normal cursor-pointer"
                      >
                        {option.label}
                        {option.description && (
                          <span className="text-xs text-muted-foreground block">
                            {option.description}
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              );

            case 'number':
              return (
                <Input
                  id={fieldId}
                  type="number"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? undefined : Number(e.target.value);
                    field.onChange(value);
                  }}
                  placeholder={placeholder}
                  disabled={disabled}
                  min={min}
                  max={max}
                  onFocus={() => setIsFocused(true)}
                  onBlur={(e) => {
                    setIsFocused(false);
                    field.onBlur();
                  }}
                  aria-required={required}
                  aria-invalid={hasError}
                  aria-describedby={cn(
                    hasError && errorId,
                    helpText && helpId
                  ) || undefined}
                  className={cn(
                    hasError && 'border-destructive',
                    inputClassName
                  )}
                />
              );

            default:
              return (
                <Input
                  id={fieldId}
                  type={type}
                  {...field}
                  value={field.value || ''}
                  placeholder={placeholder}
                  disabled={disabled}
                  maxLength={maxLength}
                  onFocus={() => setIsFocused(true)}
                  onBlur={(e) => {
                    setIsFocused(false);
                    field.onBlur();
                  }}
                  aria-required={required}
                  aria-invalid={hasError}
                  aria-describedby={cn(
                    hasError && errorId,
                    helpText && helpId
                  ) || undefined}
                  className={cn(
                    hasError && 'border-destructive',
                    inputClassName
                  )}
                />
              );
          }
        };

        return (
          <div className={cn('space-y-2', className)}>
            <div className="flex items-center justify-between">
              <Label
                htmlFor={fieldId}
                className={cn(
                  'text-sm font-medium',
                  hasError && 'text-destructive'
                )}
              >
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
              </Label>

              {/* Character counter for textarea/text with maxLength */}
              {maxLength && (type === 'textarea' || type === 'text') && (
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={(field.value || '').length}
                    initial={{ y: -8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 8, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      'text-xs font-medium tabular-nums transition-colors duration-200',
                      (field.value || '').length >= maxLength
                        ? 'text-destructive'
                        : (field.value || '').length >= maxLength * 0.8
                          ? 'text-amber-500'
                          : 'text-muted-foreground'
                    )}
                  >
                    {(field.value || '').length}/{maxLength}
                  </motion.span>
                </AnimatePresence>
              )}
            </div>

            <motion.div
              variants={shakeVariants}
              animate={hasError ? 'error' : 'initial'}
            >
              {renderInput()}
            </motion.div>

            {/* Error message with animation */}
            <AnimatePresence mode="wait">
              {hasError && (
                <motion.div
                  id={errorId}
                  variants={errorMessageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="flex items-start gap-2 text-sm text-destructive"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{error.message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Help text */}
            {helpText && !hasError && (
              <p id={helpId} className="text-xs text-muted-foreground">
                {helpText}
              </p>
            )}

            {/* Success indicator */}
            <AnimatePresence>
              {isSuccess && !hasError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400"
                >
                  <Check className="h-3 w-3" />
                  <span>Looks good!</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      }}
    />
  );
}

// Wrapper for progressive disclosure fields
export function ConditionalFormField<T extends FieldValues>({
  showWhen,
  watch,
  children,
}: {
  showWhen: (values: T) => boolean;
  watch: () => T;
  children: React.ReactNode;
}) {
  const values = watch();
  const shouldShow = showWhen(values);

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
