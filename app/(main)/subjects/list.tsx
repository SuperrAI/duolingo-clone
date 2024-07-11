"use client";

import { useTransition } from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { upsertUserProgress } from "@/actions/user-progress";
import { subjects, userProgress } from "@/db/schema";

import { Card } from "./card";

type ListProps = {
  subjects: (typeof subjects.$inferSelect)[];
  activeSubjectId?: typeof userProgress.$inferSelect.activeSubjectId;
};

export const List = ({ subjects, activeSubjectId }: ListProps) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onClick = (id: number) => {
    if (pending) return;

    if (id === activeSubjectId) return router.push("/learn");

    startTransition(() => {
      upsertUserProgress(id).catch(() => toast.error("Something went wrong."));
    });
  };

  return (
    <div className="grid grid-cols-2 gap-4 pt-6 lg:grid-cols-[repeat(auto-fill,minmax(210px,1fr))]">
      {subjects.map((subject) => (
        <Card
          key={subject.id}
          id={subject.id}
          title={subject.title}
          imageSrc={subject.imageSrc}
          onClick={onClick}
          disabled={pending}
          isActive={subject.id === activeSubjectId}
        />
      ))}
    </div>
  );
};
