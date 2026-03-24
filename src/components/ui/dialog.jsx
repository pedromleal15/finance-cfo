import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const DialogContext = React.createContext(null)

function useDialogContext() {
  const ctx = React.useContext(DialogContext)
  if (!ctx) throw new Error("Dialog sub-components must be used within <Dialog>.")
  return ctx
}

// ---------------------------------------------------------------------------
// Dialog root — supports both controlled and uncontrolled usage
// ---------------------------------------------------------------------------

function Dialog({
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
  children,
}) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  const setOpen = React.useCallback(
    (next) => {
      if (!isControlled) setInternalOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange]
  )

  // Close on Escape key
  React.useEffect(() => {
    if (!open) return
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, setOpen])

  // Prevent body scroll while open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// DialogTrigger — wraps any element to open the dialog on click
// ---------------------------------------------------------------------------

const DialogTrigger = React.forwardRef(({ asChild = false, children, ...props }, ref) => {
  const { setOpen } = useDialogContext()

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      ref,
      onClick: (e) => {
        children.props.onClick?.(e)
        setOpen(true)
      },
    })
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => setOpen(true)}
      {...props}
    >
      {children}
    </button>
  )
})
DialogTrigger.displayName = "DialogTrigger"

// ---------------------------------------------------------------------------
// DialogPortal — renders children into document.body
// ---------------------------------------------------------------------------

function DialogPortal({ children }) {
  return createPortal(children, document.body)
}

// ---------------------------------------------------------------------------
// DialogOverlay — the backdrop behind the dialog panel
// ---------------------------------------------------------------------------

const DialogOverlay = React.forwardRef(({ className, onClick, ...props }, ref) => {
  const { setOpen } = useDialogContext()

  return (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      onClick={onClick ?? (() => setOpen(false))}
      aria-hidden="true"
      {...props}
    />
  )
})
DialogOverlay.displayName = "DialogOverlay"

// ---------------------------------------------------------------------------
// DialogContent — the dialog panel itself
// ---------------------------------------------------------------------------

const DialogContent = React.forwardRef(
  ({ className, children, onClose, showCloseButton = true, ...props }, ref) => {
    const { open, setOpen } = useDialogContext()

    if (!open) return null

    const handleClose = () => {
      onClose?.()
      setOpen(false)
    }

    return (
      <DialogPortal>
        <DialogOverlay />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            ref={ref}
            role="dialog"
            aria-modal="true"
            className={cn(
              "relative w-full max-w-lg rounded-xl border bg-card text-card-foreground shadow-xl",
              "p-6",
              "duration-200 animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4",
              className
            )}
            onClick={(e) => e.stopPropagation()}
            {...props}
          >
            {showCloseButton && (
              <button
                type="button"
                onClick={handleClose}
                className={cn(
                  "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background",
                  "transition-opacity hover:opacity-100",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "disabled:pointer-events-none"
                )}
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {children}
          </div>
        </div>
      </DialogPortal>
    )
  }
)
DialogContent.displayName = "DialogContent"

// ---------------------------------------------------------------------------
// DialogHeader
// ---------------------------------------------------------------------------

const DialogHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left mb-4",
      className
    )}
    {...props}
  />
))
DialogHeader.displayName = "DialogHeader"

// ---------------------------------------------------------------------------
// DialogFooter
// ---------------------------------------------------------------------------

const DialogFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 pt-2",
      className
    )}
    {...props}
  />
))
DialogFooter.displayName = "DialogFooter"

// ---------------------------------------------------------------------------
// DialogTitle
// ---------------------------------------------------------------------------

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

// ---------------------------------------------------------------------------
// DialogDescription
// ---------------------------------------------------------------------------

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"

// ---------------------------------------------------------------------------
// DialogClose — renders a button that closes the dialog
// ---------------------------------------------------------------------------

const DialogClose = React.forwardRef(
  ({ asChild = false, children, onClick, ...props }, ref) => {
    const { setOpen } = useDialogContext()

    const handleClick = (e) => {
      onClick?.(e)
      setOpen(false)
    }

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        ...props,
        ref,
        onClick: handleClick,
      })
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    )
  }
)
DialogClose.displayName = "DialogClose"

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
}
