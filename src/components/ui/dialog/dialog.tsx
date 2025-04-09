// components/ui/dialog.tsx
"use client";

import React, { useRef, useEffect } from "react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  onOpenChange,
  children,
  className,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto z-50">
      <div
        className="fixed inset-0 h-full w-full bg-black/80 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      ></div>
      <div
        ref={dialogRef}
        className={`relative w-full max-w-lg bg-white p-6 shadow-lg sm:rounded-lg dark:bg-gray-950 ${className || ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

export const DialogContent: React.FC<DialogContentProps> = ({
  children,
  className,
}) => {
  return (
    <div className={`relative grid gap-4 ${className || ""}`}>
      {children}
    </div>
  );
};

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({
  children,
  className,
}) => {
  return (
    <div className={`flex flex-col space-y-1.5 text-center sm:text-left ${className || ""}`}>
      {children}
    </div>
  );
};

interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const DialogFooter: React.FC<DialogFooterProps> = ({
  children,
  className,
}) => {
  return (
    <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className || ""}`}>
      {children}
    </div>
  );
};

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const DialogTitle: React.FC<DialogTitleProps> = ({
  children,
  className,
}) => {
  return (
    <h2 className={`text-lg font-semibold leading-none tracking-tight ${className || ""}`}>
      {children}
    </h2>
  );
};

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const DialogDescription: React.FC<DialogDescriptionProps> = ({
  children,
  className,
}) => {
  return (
    <p className={`text-sm text-gray-500 dark:text-gray-400 ${className || ""}`}>
      {children}
    </p>
  );
};

// Export all components
export {
  Dialog as Root,
  DialogContent as Content,
  DialogHeader as Header,
  DialogFooter as Footer,
  DialogTitle as Title,
  DialogDescription as Description,
};