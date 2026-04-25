"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteCourseAction } from "../actions";

type Props = {
  courseId: string;
  title: string;
};

export function DeleteCourseButton({ courseId, title }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      try {
        await deleteCourseAction(courseId);
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        toast.error("Não foi possível excluir o curso.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => setOpen(o)}>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Excluir
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir curso</DialogTitle>
          <DialogDescription>
            Tem certeza que quer excluir &quot;{title}&quot;? Essa ação remove módulos, aulas e
            questões em cascata e não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
