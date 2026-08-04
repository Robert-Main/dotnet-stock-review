"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiError } from "@/lib/api";
import { commentService } from "@/services/commentService";
import { syncServerErrors, type ServerErrorSetter } from "@/lib/formErrors";
import { commentSchema, type CommentValues } from "@/lib/schemas";
import { Button, Input } from "@/components/ui";
import { useToast } from "@/components/Toast";
import type { CommentDto } from "@/lib/types";

interface CommentFormProps {
  /** Stock symbol — required in "create" mode. */
  symbol?: string;
  /** Existing comment — required in "edit" mode. */
  comment?: CommentDto;
  /** Compact inline styling for the edit-in-place form. */
  compact?: boolean;
  /** Called after a successful save (parent reloads the comment list). */
  onSaved?: () => void;
  /** Shown only in edit mode; clears the editing state. */
  onCancel?: () => void;
}

const FIELDS = ["title", "content"] as const;

export default function CommentForm({
  symbol,
  comment,
  compact = false,
  onSaved,
  onCancel,
}: CommentFormProps) {
  const toast = useToast();
  const [banner, setBanner] = useState<string | null>(null);
  const isEdit = !!comment;
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommentValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      title: comment?.title ?? "",
      content: comment?.content ?? "",
    },
  });

  const onSubmit = async (values: CommentValues) => {
    setBanner(null);
    try {
      if (isEdit && comment?.id != null) {
        await commentService.update(comment.id, {
          title: values.title,
          content: values.content,
        });
        toast.success("Review updated!");
      } else if (symbol) {
        await commentService.create(symbol, {
          title: values.title,
          content: values.content,
        });
        toast.success("Review posted!");
        reset();
      }
      onSaved?.();
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldMsg = syncServerErrors(
          err.errors,
          setError as unknown as ServerErrorSetter,
          [...FIELDS]
        );
        if (fieldMsg) {
          toast.error(fieldMsg);
        } else {
          toast.error(err.message);
          setBanner(err.message);
        }
      } else {
        toast.error("Could not save the review.");
        setBanner("Could not save the review.");
      }
    }
  };

  if (compact) {
    return (
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-3"
      >
        {banner && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {banner}
          </div>
        )}
        <div>
          <input
            id="edit-title"
            placeholder="Title"
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={errors.title ? "edit-title-error" : undefined}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/60"
            {...register("title")}
          />
          {errors.title && (
            <p id="edit-title-error" className="mt-1 text-xs text-red-400">
              {errors.title.message}
            </p>
          )}
        </div>
        <div>
          <textarea
            id="edit-content"
            placeholder="Your review…"
            rows={3}
            aria-invalid={errors.content ? true : undefined}
            aria-describedby={errors.content ? "edit-content-error" : undefined}
            className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/60"
            {...register("content")}
          />
          {errors.content && (
            <p id="edit-content-error" className="mt-1 text-xs text-red-400">
              {errors.content.message}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="submit" loading={isSubmitting} className="!px-3 !py-1.5 !text-xs">
            Save
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              className="!px-3 !py-1.5 !text-xs"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {banner && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {banner}
        </div>
      )}
      <Input
        id="comment-title"
        label="Title"
        placeholder="Great long-term pick"
        maxLength={100}
        error={errors.title?.message}
        {...register("title")}
      />
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-zinc-300">
          Review
        </span>
        <textarea
          id="comment-content"
          rows={5}
          maxLength={200}
          placeholder="Share your thoughts on this stock…"
          aria-invalid={errors.content ? true : undefined}
          aria-describedby={errors.content ? "comment-content-error" : undefined}
          className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
          {...register("content")}
        />
        {errors.content && (
          <span id="comment-content-error" className="mt-1 block text-xs text-red-400">
            {errors.content.message}
          </span>
        )}
      </label>
      <Button type="submit" loading={isSubmitting}>
        Post review
      </Button>
    </form>
  );
}
