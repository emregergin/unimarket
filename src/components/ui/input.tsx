import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftIcon, rightSlot, ...props }, ref) => (
    <div
      className={cn(
        "flex h-12 items-center gap-2 rounded-2xl bg-muted px-4 text-foreground transition focus-within:ring-2 focus-within:ring-ring",
        className
      )}
    >
      {leftIcon && <span className="text-muted-foreground shrink-0">{leftIcon}</span>}
      <input
        ref={ref}
        className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
        {...props}
      />
      {rightSlot && <span className="shrink-0">{rightSlot}</span>}
    </div>
  )
);
Input.displayName = "Input";
