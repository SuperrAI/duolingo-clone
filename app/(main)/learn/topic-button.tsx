import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { TopicProgress } from "./topic-progress";

type TopicButtonProps = {
  id: number;
  index: number;
  totalCount: number;
  current?: boolean;
  percentage: number;
  locked?: boolean;
  name: string;
};

export const TopicButton = ({
  id,
  index,
  totalCount,
  current,
  percentage,
  locked,
  name,
}: TopicButtonProps) => {
  const topicNumber = index + 1;
  const isFirst = index === 0;
  const isLast = index === totalCount;

  return (
    <>
      {!isFirst && (
        <div
          className={cn(
            "h-20 w-0.5 bg-slate-200",
            locked && "bg-slate-100"
          )}
        />
      )}
      <div className="relative flex flex-col items-center">
        <div className="text-lm font-medium text-neutral-600 mb-2 text-center">{name}</div>
        <Button
          asChild
          disabled={locked}
          // variant={current ? "secondary" : "outline"}
          className={cn(
            "h-20 w-20 rounded-full border-8 p-0 hover:scale-110 transition-all",
            current && "border-blue-200 bg-blue-500 text-white hover:bg-blue-500/90",
            locked && "border-slate-200 bg-slate-100 hover:bg-slate-100"
          )}
        >
          <Link href={`/topic/${id}`}>
            {topicNumber}
          </Link>
        </Button>
        {current && (
          <TopicProgress
            percentage={percentage}
          />
        )}
      </div>
      {!isLast && (
        <div
          className={cn(
            "h-20 w-0.5 bg-slate-200",
            locked && "bg-slate-100"
          )}
        />
      )}
    </>
  );
};
