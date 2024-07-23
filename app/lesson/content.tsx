import { Dispatch, SetStateAction, useState } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type TextImageCardProps = {
  title: string;
  body: string;
};

const TextImageCard = ({ title, body }: TextImageCardProps) => {
  return (
    <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-2xl font-bold">{title}</h2>
      <p>{body}</p>
    </div>
  );
};

const NavigableContainer = ({
  data,
  setShowContent,
}: {
  data: TextImageCardProps[];
  setShowContent: Dispatch<SetStateAction<boolean>>;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!data) {
    return null;
  }

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : data.length - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex < data.length - 1 ? prevIndex + 1 : 0
    );
  };

  return (
    <>
      <div className="relative mx-auto h-full max-w-2xl p-6">
        <button
          onClick={goToPrevious}
          className="absolute left-2 top-1/2 -translate-y-1/2 transform rounded-full bg-gray-200 p-2 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
          aria-label="Previous item"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div className="px-8">{<TextImageCard {...data[currentIndex]} />}</div>

        <button
          onClick={goToNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 transform rounded-full bg-gray-200 p-2 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
          aria-label="Next item"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 transform space-x-2">
          {data.map((_, index) => (
            <span
              key={index}
              className={`h-2 w-2 rounded-full hover:cursor-pointer ${
                index === currentIndex ? "bg-blue-500" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
      <footer className={"h-[100px] border-t-2 lg:h-[140px]"}>
        <div className="mx-auto flex h-full max-w-[1140px] items-center justify-between px-6 lg:px-10">
          <Button
            className="ml-auto"
            onClick={() => setShowContent(false)}
            size={"lg"}
            variant={"secondary"}
          >
            Start Quiz
          </Button>
        </div>
      </footer>
    </>
  );
};

export default NavigableContainer;
