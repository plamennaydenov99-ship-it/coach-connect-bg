import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm font-display uppercase tracking-[0.08em] text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-background hover:bg-secondary",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-border-hover bg-transparent text-foreground-muted hover:border-gold hover:text-foreground",
        secondary:
          "bg-background-tertiary text-foreground hover:bg-background-secondary",
        ghost: "text-foreground-muted hover:text-foreground hover:bg-background-secondary",
        link: "text-foreground underline-offset-4 hover:underline normal-case tracking-normal",
        hero: "bg-foreground text-background hover:bg-secondary",
        soft: "bg-background-secondary text-foreground hover:bg-background-tertiary",
        success: "bg-success text-success-foreground hover:bg-success/90",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-sm px-3.5 text-xs",
        lg: "h-12 rounded-sm px-8 text-base",
        xl: "h-14 rounded-sm px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
