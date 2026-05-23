"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { JSONContent } from "@tiptap/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createModuleAction,
  deleteLessonAction,
  deleteModuleAction,
  renameModuleAction,
  reorderLessonsAction,
  reorderModulesAction,
} from "../actions";
import { LessonForm } from "./lesson-form";

export type LessonItem = {
  id: string;
  title: string;
  order: number;
  youtubeVideoId: string | null;
  bunnyVideoId: string | null;
  bunnyLibraryId: string | null;
  sidebarContent: JSONContent | null;
  sidebarPdfUrl: string | null;
};

export type ModuleItem = {
  id: string;
  title: string;
  order: number;
  lessons: LessonItem[];
};

type Props = {
  courseId: string;
  modules: ModuleItem[];
};

export function ModulesPanel({ courseId, modules: initial }: Props) {
  const [modules, setModules] = useState<ModuleItem[]>(initial);
  const [newTitle, setNewTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    setModules(initial);
  }, [initial]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = modules.findIndex((m) => m.id === active.id);
    const newIndex = modules.findIndex((m) => m.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(modules, oldIndex, newIndex).map((m, idx) => ({ ...m, order: idx }));
    setModules(next);
    startTransition(async () => {
      const result = await reorderModulesAction(
        courseId,
        next.map((m) => ({ id: m.id, order: m.order })),
      );
      if ("error" in result) {
        toast.error(result.error);
        setModules(initial);
      } else {
        router.refresh();
      }
    });
  }

  const boundCreateModule = createModuleAction.bind(null, courseId);

  return (
    <div className="space-y-4">
      <form
        action={async (fd) => {
          const result = await boundCreateModule(fd);
          if ("error" in result) {
            toast.error(result.error);
            return;
          }
          window.location.reload();
        }}
        className="flex items-end gap-2 rounded-md border border-dashed border-border p-3"
      >
        <div className="flex-1 space-y-1">
          <span className="text-sm font-medium">Novo módulo</span>
          <Input
            name="title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Ex: Fundamentos"
          />
        </div>
        <Button type="submit" disabled={isPending}>
          Adicionar
        </Button>
      </form>

      {modules.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sem módulos ainda. Adicione o primeiro acima.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-3">
              {modules.map((m) => (
                <ModuleRow key={m.id} courseId={courseId} module={m} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function ModuleRow({ courseId, module: m }: { courseId: string; module: ModuleItem }) {
  const sortable = useSortable({ id: m.id });
  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  };
  const [editing, setEditing] = useState(false);
  const [renameValue, setRenameValue] = useState(m.title);
  const [isPending, startTransition] = useTransition();

  function handleRename() {
    if (renameValue.trim().length < 2) {
      toast.error("Título inválido");
      return;
    }
    const fd = new FormData();
    fd.set("title", renameValue.trim());
    startTransition(async () => {
      const result = await renameModuleAction(m.id, fd);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setEditing(false);
      window.location.reload();
    });
  }

  function handleDelete() {
    if (!window.confirm(`Excluir o módulo "${m.title}" e todas as suas aulas?`)) return;
    startTransition(async () => {
      const result = await deleteModuleAction(m.id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      window.location.reload();
    });
  }

  return (
    <li
      ref={sortable.setNodeRef}
      style={style}
      className="rounded-md border border-border bg-card p-3"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Reordenar módulo"
          className="cursor-grab px-2 text-muted-foreground"
          {...sortable.attributes}
          {...sortable.listeners}
        >
          ⋮⋮
        </button>
        {editing ? (
          <Input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleRename();
              }
            }}
            className="flex-1"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex-1 text-left text-sm font-medium hover:underline"
          >
            {m.title}
          </button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={handleDelete} disabled={isPending}>
          Excluir
        </Button>
      </div>

      <LessonsSubpanel courseId={courseId} moduleId={m.id} lessons={m.lessons} />
    </li>
  );
}

function LessonsSubpanel({
  moduleId,
  lessons: initial,
}: {
  courseId: string;
  moduleId: string;
  lessons: LessonItem[];
}) {
  const [lessons, setLessons] = useState<LessonItem[]>(initial);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setLessons(initial);
  }, [initial]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = lessons.findIndex((l) => l.id === active.id);
    const newIndex = lessons.findIndex((l) => l.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(lessons, oldIndex, newIndex).map((l, idx) => ({ ...l, order: idx }));
    setLessons(next);
    startTransition(async () => {
      const result = await reorderLessonsAction(
        moduleId,
        next.map((l) => ({ id: l.id, order: l.order })),
      );
      if ("error" in result) {
        toast.error(result.error);
        setLessons(initial);
      }
    });
  }

  function handleDelete(id: string, title: string) {
    if (!window.confirm(`Excluir a aula "${title}"?`)) return;
    startTransition(async () => {
      const result = await deleteLessonAction(id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      window.location.reload();
    });
  }

  return (
    <div className="mt-3 space-y-2 pl-6">
      {lessons.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma aula neste módulo.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {lessons.map((l) => (
                <LessonRow
                  key={l.id}
                  lesson={l}
                  isEditing={editingId === l.id}
                  onEdit={() => setEditingId(l.id)}
                  onCancel={() => setEditingId(null)}
                  onDelete={() => handleDelete(l.id, l.title)}
                  moduleId={moduleId}
                  onSaved={() => setEditingId(null)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {creating ? (
        <div className="space-y-2">
          <LessonForm mode="create" moduleId={moduleId} onSaved={() => setCreating(false)} />
          <Button type="button" variant="ghost" size="sm" onClick={() => setCreating(false)}>
            Cancelar
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={() => setCreating(true)}>
          Nova aula
        </Button>
      )}
    </div>
  );
}

function LessonRow({
  lesson,
  isEditing,
  onEdit,
  onCancel,
  onDelete,
  moduleId,
  onSaved,
}: {
  lesson: LessonItem;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onDelete: () => void;
  moduleId: string;
  onSaved: () => void;
}) {
  const sortable = useSortable({ id: lesson.id });
  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  };

  return (
    <li
      ref={sortable.setNodeRef}
      style={style}
      className="rounded-md border border-border bg-background p-2"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Reordenar aula"
          className="cursor-grab px-1 text-muted-foreground"
          {...sortable.attributes}
          {...sortable.listeners}
        >
          ⋮⋮
        </button>
        <span className="flex-1 text-sm">{lesson.title}</span>
        {lesson.youtubeVideoId ? (
          <span className="text-xs text-muted-foreground">vídeo ✓ (YouTube)</span>
        ) : lesson.bunnyVideoId ? (
          <span className="text-xs text-amber-600">vídeo ✓ (Bunny — legado)</span>
        ) : (
          <span className="text-xs text-muted-foreground">sem vídeo</span>
        )}
        {isEditing ? (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Fechar
          </Button>
        ) : (
          <>
            <Button type="button" variant="outline" size="sm" onClick={onEdit}>
              Editar
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onDelete}>
              Excluir
            </Button>
          </>
        )}
      </div>
      {isEditing ? (
        <div className="mt-3">
          <LessonForm
            mode="edit"
            moduleId={moduleId}
            lessonId={lesson.id}
            defaults={{
              title: lesson.title,
              youtubeVideoId: lesson.youtubeVideoId,
              bunnyVideoId: lesson.bunnyVideoId,
              bunnyLibraryId: lesson.bunnyLibraryId,
              sidebarContent: lesson.sidebarContent,
              sidebarPdfUrl: lesson.sidebarPdfUrl,
            }}
            onSaved={onSaved}
          />
        </div>
      ) : null}
    </li>
  );
}
