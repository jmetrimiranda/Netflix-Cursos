"use client";

import { ThumbnailUpload } from "@/components/admin/thumbnail-upload";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCentsToBRL, parseBRLToCents } from "@/lib/money";
import { slugify } from "@/lib/slug";
import {
  COURSE_CATEGORIES,
  COURSE_CATEGORY_LABELS,
  type CourseInput,
  courseInputSchema,
} from "@/lib/validations/course";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { type ActionResult, createCourseAction, updateCourseAction } from "../actions";

type CourseFormProps = {
  mode: "create" | "edit";
  courseId?: string;
  defaults?: Partial<CourseInput>;
  slugLocked?: boolean;
};

const EMPTY_DEFAULTS: CourseInput = {
  title: "",
  slug: "",
  description: "",
  category: "civil",
  priceCents: 0,
  workloadHours: 1,
  examQuestionsCount: 10,
  examPassScore: 7.0,
  thumbnailUrl: undefined,
  featured: false,
  published: false,
};

export function CourseForm({ mode, courseId, defaults, slugLocked }: CourseFormProps) {
  const form = useForm<CourseInput>({
    resolver: zodResolver(courseInputSchema),
    defaultValues: { ...EMPTY_DEFAULTS, ...defaults },
  });
  const [isPending, startTransition] = useTransition();

  const titleValue = form.watch("title");
  useEffect(() => {
    if (mode !== "create") return;
    const currentSlug = form.getValues("slug");
    const expected = slugify(titleValue);
    const slugIsAuto =
      currentSlug === "" ||
      currentSlug === slugify(form.formState.defaultValues?.title ?? "") ||
      slugify(currentSlug) === slugify(titleValue);
    if (!form.formState.dirtyFields.slug || slugIsAuto) {
      form.setValue("slug", expected, { shouldValidate: false });
    }
  }, [titleValue, form, mode]);

  const onSubmit = form.handleSubmit((values) => {
    const fd = new FormData();
    fd.set("title", values.title);
    fd.set("slug", values.slug);
    fd.set("description", values.description);
    fd.set("category", values.category);
    fd.set("priceCents", String(values.priceCents));
    fd.set("workloadHours", String(values.workloadHours));
    fd.set("examQuestionsCount", String(values.examQuestionsCount));
    fd.set("examPassScore", String(values.examPassScore));
    if (values.thumbnailUrl) fd.set("thumbnailUrl", values.thumbnailUrl);
    fd.set("featured", values.featured ? "on" : "");
    fd.set("published", values.published ? "on" : "");

    startTransition(async () => {
      try {
        let result: ActionResult;
        if (mode === "create") {
          result = await createCourseAction({ success: true } as ActionResult, fd);
        } else if (mode === "edit" && courseId) {
          result = await updateCourseAction(courseId, { success: true } as ActionResult, fd);
        } else {
          result = { error: "Modo inválido" };
        }
        if ("error" in result) {
          toast.error(result.error);
        } else if (mode === "edit") {
          toast.success("Curso atualizado");
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) return;
        toast.error("Erro inesperado ao salvar");
      }
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Título</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input {...field} disabled={slugLocked} />
                </FormControl>
                {slugLocked ? (
                  <p className="text-xs text-muted-foreground">
                    Slug travado: existem matrículas associadas.
                  </p>
                ) : null}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {COURSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {COURSE_CATEGORY_LABELS[cat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea rows={6} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Controller
            control={form.control}
            name="priceCents"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Preço (BRL)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="R$ 0,00"
                    defaultValue={field.value ? formatCentsToBRL(field.value) : ""}
                    onBlur={(e) => {
                      const cents = parseBRLToCents(e.target.value);
                      if (Number.isFinite(cents)) {
                        field.onChange(cents);
                        e.target.value = formatCentsToBRL(cents);
                      } else if (e.target.value.trim() === "") {
                        field.onChange(0);
                        e.target.value = formatCentsToBRL(0);
                      }
                    }}
                  />
                </FormControl>
                {fieldState.error ? (
                  <p className="text-sm text-destructive">{fieldState.error.message}</p>
                ) : null}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="workloadHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carga horária (horas)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="examQuestionsCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Questões na prova</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="examPassScore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nota mínima (0-10)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    step={0.1}
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Controller
          control={form.control}
          name="thumbnailUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Thumbnail</FormLabel>
              <FormControl>
                <ThumbnailUpload
                  value={field.value ?? ""}
                  onChange={(url) => field.onChange(url || undefined)}
                  prefix="thumbnails"
                  accept="image/*"
                  label="thumbnail"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-wrap gap-6">
          <Controller
            control={form.control}
            name="featured"
            render={({ field }) => (
              <div className="flex items-center gap-2 text-sm">
                <Checkbox
                  id="course-featured"
                  checked={field.value ?? false}
                  onCheckedChange={(v) => field.onChange(v === true)}
                />
                <label htmlFor="course-featured">Em destaque na home</label>
              </div>
            )}
          />
          <Controller
            control={form.control}
            name="published"
            render={({ field }) => (
              <div className="flex items-center gap-2 text-sm">
                <Checkbox
                  id="course-published"
                  checked={field.value ?? false}
                  onCheckedChange={(v) => field.onChange(v === true)}
                />
                <label htmlFor="course-published">Publicado</label>
              </div>
            )}
          />
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando..." : mode === "create" ? "Criar curso" : "Salvar alterações"}
        </Button>
      </form>
    </Form>
  );
}
