import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: 
          "bg-primary text-primary-foreground shadow-md hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5 hover:bg-primary/95",
        destructive: 
          "bg-destructive text-destructive-foreground shadow-md hover:shadow-xl hover:shadow-destructive/25 hover:-translate-y-0.5 hover:bg-destructive/95",
        outline: 
          "border-2 border-border bg-background hover:border-primary hover:bg-primary/5 hover:text-primary hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10",
        secondary: 
          "bg-secondary/80 text-secondary-foreground backdrop-blur-sm hover:bg-secondary hover:-translate-y-0.5 hover:shadow-lg hover:shadow-secondary/20",
        ghost: 
          "hover:bg-accent/15 hover:text-primary relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/0 before:via-primary/5 before:to-primary/0 before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-500",
        link: 
          "text-primary underline-offset-4 hover:underline relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-gradient-to-r after:from-primary after:to-secondary hover:after:w-full after:transition-all after:duration-300",
        gradient: 
          "relative overflow-hidden bg-gradient-to-r from-primary via-primary to-secondary bg-[length:200%_100%] text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 hover:bg-[position:100%_0] transition-all duration-500 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700",
        success: 
          "bg-success text-success-foreground shadow-md hover:shadow-xl hover:shadow-success/30 hover:-translate-y-0.5 hover:bg-success/95",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-8",
        xl: "h-14 rounded-2xl px-10 text-base",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
