import { useEffect, useState } from "react";

function Bone({ className = "" }: { className?: string }) {
  return <div className={`skeleton-bone rounded-lg ${className}`} />;
}

export type SkeletonVariant = "landing" | "auth" | "form" | "billing" | "dashboard";

export function PageSkeleton({ variant = "auth" }: { variant?: SkeletonVariant }) {
  if (variant === "landing") {
    return (
      <div className="app-page min-h-screen p-6">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-10 flex items-center justify-between gap-4">
            <Bone className="h-8 w-28" />
            <div className="hidden flex-1 justify-center gap-6 md:flex">
              <Bone className="h-4 w-24" />
              <Bone className="h-4 w-24" />
              <Bone className="h-4 w-20" />
              <Bone className="h-4 w-16" />
            </div>
            <div className="flex gap-2">
              <Bone className="h-8 w-8 rounded-full" />
              <Bone className="h-8 w-8 rounded-full" />
              <Bone className="h-8 w-8 rounded-full" />
              <Bone className="h-8 w-32" />
            </div>
          </div>
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 py-16">
            <Bone className="h-6 w-64 rounded-full" />
            <Bone className="h-12 w-full max-w-xl" />
            <Bone className="h-12 w-full max-w-lg" />
            <Bone className="h-4 w-full max-w-md" />
            <Bone className="h-4 w-3/4 max-w-sm" />
            <div className="mt-4 flex gap-3">
              <Bone className="h-12 w-48 rounded-xl" />
              <Bone className="h-12 w-52 rounded-xl" />
            </div>
          </div>
          <Bone className="mx-auto mt-8 h-64 w-full max-w-5xl rounded-2xl" />
        </div>
      </div>
    );
  }

  if (variant === "dashboard") {
    return (
      <div className="app-page min-h-screen">
        <div className="border-b border-outline-variant/40 px-6 py-5">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
            <div className="space-y-2">
              <Bone className="h-6 w-40" />
              <Bone className="h-3 w-56" />
            </div>
            <div className="flex gap-2">
              <Bone className="h-9 w-24" />
              <Bone className="h-9 w-24" />
              <Bone className="h-9 w-28" />
            </div>
          </div>
        </div>
        <div className="mx-auto grid max-w-[1440px] gap-5 px-6 py-6 lg:grid-cols-[340px_1fr]">
          <div className="space-y-4">
            <Bone className="h-52 w-full rounded-2xl" />
            <Bone className="h-44 w-full rounded-2xl" />
            <Bone className="h-48 w-full rounded-2xl" />
          </div>
          <div className="space-y-5">
            <Bone className="h-72 w-full rounded-2xl" />
            <Bone className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "billing") {
    return (
      <div className="app-page mx-auto max-w-5xl px-4 py-12">
        <Bone className="mb-2 h-3 w-24" />
        <Bone className="mb-3 h-10 w-64" />
        <Bone className="mb-8 h-4 w-80" />
        <div className="grid gap-4 md:grid-cols-3">
          <Bone className="h-64 rounded-2xl" />
          <Bone className="h-64 rounded-2xl" />
          <Bone className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div className="app-page mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Bone className="h-4 w-20" />
          <Bone className="h-9 w-72" />
          <Bone className="h-4 w-56" />
        </div>
        <Bone className="h-[420px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="app-page flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4">
        <div className="flex flex-col items-center gap-2">
          <Bone className="h-4 w-24" />
          <Bone className="h-8 w-48" />
          <Bone className="h-4 w-56" />
        </div>
        <Bone className="mx-auto h-8 w-28" />
        <Bone className="h-72 w-full rounded-2xl" />
      </div>
    </div>
  );
}

/** Shows skeleton until `ready` and a short minimum display time elapses. */
export function usePageSkeleton(ready = true, minMs = 450): boolean {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (!ready) {
      setShow(true);
      return;
    }
    const timer = window.setTimeout(() => setShow(false), minMs);
    return () => window.clearTimeout(timer);
  }, [ready, minMs]);

  return show;
}
