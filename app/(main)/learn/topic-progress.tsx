import { cn } from "@/lib/utils";

interface TopicProgressProps {
  percentage: number;
}

export const TopicProgress = ({
  percentage,
}: TopicProgressProps) => {
  return (
    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-[calc(100%+40px)] flex items-center">
      <div className="h-2 w-full bg-gray-200 rounded-full">
        <div
          className={cn(
            "h-2 bg-green-500 rounded-full transition-all duration-300",
            percentage === 100 && "bg-orange-500"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span
        className={cn(
          "ml-2 text-sm font-medium text-gray-600",
          percentage === 100 && "text-orange-500"
        )}
      >
        {percentage}%
      </span>
    </div>
  );
};
