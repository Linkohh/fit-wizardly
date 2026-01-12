import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-background group-[.toaster]:to-background group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border/50 group-[.toaster]:shadow-xl group-[.toaster]:backdrop-blur-lg group-[.toaster]:rounded-xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-gradient-to-r group-[.toast]:from-primary group-[.toast]:to-secondary group-[.toast]:text-primary-foreground group-[.toast]:shadow-md group-[.toast]:hover:shadow-lg group-[.toast]:transition-all",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:hover:bg-muted/80 group-[.toast]:transition-colors",
          success:
            "group-[.toaster]:border-green-500/30 group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-green-500/5 group-[.toaster]:to-background",
          error:
            "group-[.toaster]:border-destructive/30 group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-destructive/5 group-[.toaster]:to-background",
          warning:
            "group-[.toaster]:border-amber-500/30 group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-amber-500/5 group-[.toaster]:to-background",
          info:
            "group-[.toaster]:border-blue-500/30 group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-blue-500/5 group-[.toaster]:to-background",
        },
        duration: 4000,
        style: {
          animation: 'toast-slide-in-right 0.3s ease-out',
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
