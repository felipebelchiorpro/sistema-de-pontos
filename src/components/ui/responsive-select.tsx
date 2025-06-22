
"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "./scroll-area"
import { cn } from "@/lib/utils"

interface ResponsiveSelectProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder: string
  options: { value: string; label: string }[]
  className?: string
  title?: string // For sheet title
}

export function ResponsiveSelect({
  value,
  onValueChange,
  placeholder,
  options,
  className,
  title,
}: ResponsiveSelectProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)

  const selectedOptionLabel = options.find((option) => option.value === value)?.label || placeholder

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className={cn("w-full justify-start text-left h-10", !value && "text-muted-foreground", className)}>
            {selectedOptionLabel}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-auto max-h-[80vh] flex flex-col">
          <SheetHeader className="mb-4">
            <SheetTitle>{title || placeholder}</SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 -mx-6">
            <div className="flex flex-col gap-1 px-6">
              {options.length > 0 ? options.map((option) => (
                <Button
                  key={option.value}
                  variant={value === option.value ? "default" : "ghost"}
                  className="w-full justify-start p-4 h-auto text-left"
                  onClick={() => {
                    onValueChange(option.value)
                    setOpen(false)
                  }}
                >
                  {option.label}
                </Button>
              )) : <p className="text-muted-foreground text-center p-4">Nenhuma opção disponível.</p>}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.length > 0 
          ? options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            )) 
          : <SelectItem value="no-options" disabled>Nenhuma opção disponível</SelectItem>
        }
      </SelectContent>
    </Select>
  )
}
