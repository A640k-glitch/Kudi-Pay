import * as React from "react";
import { cn } from "../../lib/utils";

export interface BrutalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  color?: string;
  textColor?: string;
  hasBorder?: boolean;
  borderColor?: string;
  hasShadow?: boolean;
  shadowColor?: string;
  radius?: number;
}

export const BrutalButton = React.forwardRef<HTMLButtonElement, BrutalButtonProps>(
  (
    {
      className,
      color,
      textColor,
      hasBorder = true,
      borderColor,
      hasShadow = true,
      shadowColor,
      radius = 0,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const customStyles = {
      "--btn-bg": color || "var(--background)",
      "--btn-text": textColor || "var(--foreground)",
      "--btn-border": hasBorder ? borderColor || "var(--foreground)" : "transparent",
      "--btn-shadow": shadowColor || "var(--foreground)",
      "--btn-radius": `${radius}px`,
      ...style,
    } as React.CSSProperties;

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center px-8 py-3.5 font-bold transition-all duration-200 ease-in-out text-base uppercase tracking-wider",
          hasBorder ? "border-[3px] border-black" : "border-0",
          hasShadow
            ? "shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none"
            : "active:scale-95",
          className
        )}
        style={{
          backgroundColor: color || "#E0FF4F", // default vibrant yellow/green
          color: textColor || "#000000",
          borderRadius: "0px", // Strict Brutalism
          ...customStyles,
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

BrutalButton.displayName = "BrutalButton";

export default BrutalButton;
