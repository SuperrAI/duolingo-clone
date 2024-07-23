"use client";

import { useState, useTransition } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Confetti from "react-confetti";
import { useAudio, useWindowSize, useMount } from "react-use";
import { toast } from "sonner";

import { upsertChallengeProgress } from "@/actions/challenge-progress";
import { getNextChallenge } from "@/actions/get-next-challenge";
import { MAX_HEARTS } from "@/constants";
import {
  challengeOptions,
  challenges,
  contentBlocks,
  userSubscription,
} from "@/db/schema";
import { useHeartsModal } from "@/store/use-hearts-modal";
import { usePracticeModal } from "@/store/use-practice-modal";

import { Challenge } from "./challenge";
import NavigableContainer from "./content";
import { Footer } from "./footer";
import { Header } from "./header";
import { QuestionBubble } from "./question-bubble";
import { ResultCard } from "./result-card";

export const TOTAL_CHALLENGES = 5;

type QuizProps = {
  initialPercentage: number;
  initialHearts: number;
  initialLessonId: number;
  currentContentBlockOrder: number;
  contentBlockIds: number[];
  contentBlocks: (typeof contentBlocks.$inferSelect)[];
  initialLessonChallenges: (typeof challenges.$inferSelect & {
    completed: boolean;
    challengeOptions: (typeof challengeOptions.$inferSelect)[];
  })[];
  initialChallenge: typeof challenges.$inferSelect & {
    completed?: boolean;
    challengeOptions: (typeof challengeOptions.$inferSelect)[];
  };
  userSubscription:
    | (typeof userSubscription.$inferSelect & {
        isActive: boolean;
      })
    | null;
};

export const Quiz = ({
  initialPercentage,
  initialHearts,
  initialLessonId,
  contentBlocks,
  initialLessonChallenges,
  initialChallenge,
  userSubscription,
}: QuizProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [correctAudio, _c, correctControls] = useAudio({ src: "/correct.wav" });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [incorrectAudio, _i, incorrectControls] = useAudio({
    src: "/incorrect.wav",
  });
  const [finishAudio] = useAudio({
    src: "/finish.mp3",
    autoPlay: true,
  });
  const { width, height } = useWindowSize();

  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { open: openHeartsModal } = useHeartsModal();
  const { open: openPracticeModal } = usePracticeModal();

  useMount(() => {
    if (initialPercentage === 100) openPracticeModal();
  });

  const [lessonId] = useState(initialLessonId);
  const [hearts, setHearts] = useState(initialHearts);
  const [percentage, setPercentage] = useState(() => {
    return initialPercentage === 100 ? 0 : initialPercentage;
  });
  const [challenges] = useState(initialLessonChallenges);

  const [selectedOption, setSelectedOption] = useState<number>();
  const [status, setStatus] = useState<"none" | "wrong" | "correct">("none");

  const [currentChallenge, setCurrentChallenge] = useState(initialChallenge);
  const [showContent, setShowContent] = useState(true);

  const fetchNextChallenge = async () => {
    try {
      const nextChallenge = await getNextChallenge(lessonId);
      setCurrentChallenge(nextChallenge);
    } catch (error) {
      toast.error("Failed to fetch the next question. Please try again.");
    }
  };

  const options = currentChallenge?.challengeOptions ?? [];

  const onSelect = (id: number) => {
    if (status !== "none") return;

    setSelectedOption(id);
  };

  const onContinue = () => {
    if (!selectedOption) return;

    if (status === "wrong") {
      setStatus("none");
      setSelectedOption(undefined);
      return;
    }

    if (status === "correct") {
      void fetchNextChallenge();
      setStatus("none");
      setSelectedOption(undefined);
      return;
    }

    const correctOption = currentChallenge.challengeOptions.find(
      (option) => option.correct
    );

    if (!correctOption) return;

    const isCorrect = correctOption.id === selectedOption;

    startTransition(() => {
      upsertChallengeProgress(currentChallenge.id, isCorrect)
        .then((response) => {
          if (response?.error === "hearts") {
            openHeartsModal();
            return;
          }

          if (isCorrect) {
            void correctControls.play();
            setStatus("correct");
            setPercentage((prev) => prev + 100 / TOTAL_CHALLENGES); // You'll need to define totalChallenges

            if (initialPercentage === 100) {
              setHearts((prev) => Math.min(prev + 1, MAX_HEARTS));
            }
          } else {
            void incorrectControls.play();
            setStatus("wrong");

            if (!response?.error) setHearts((prev) => Math.max(prev - 1, 0));
          }
        })
        .catch(() => toast.error("Something went wrong. Please try again."));
    });
  };

  const filteredContentData = contentBlocks
    .filter((content) => content.type === "CONTENT")
    .map((content) => ({
      title: content.title ?? "",
      body: content.body ?? "",
    }));

  if (percentage === 0 && showContent) {
    return (
      <NavigableContainer
        data={filteredContentData}
        setShowContent={setShowContent}
      />
    );
  }

  if (!currentChallenge || percentage >= 100) {
    return (
      <>
        {finishAudio}
        <Confetti
          recycle={false}
          numberOfPieces={500}
          tweenDuration={10_000}
          width={width}
          height={height}
        />
        <div className="mx-auto flex h-full max-w-lg flex-col items-center justify-center gap-y-4 text-center lg:gap-y-8">
          <Image
            src="/finish.svg"
            alt="Finish"
            className="hidden lg:block"
            height={100}
            width={100}
          />

          <Image
            src="/finish.svg"
            alt="Finish"
            className="block lg:hidden"
            height={100}
            width={100}
          />

          <h1 className="text-lg font-bold text-neutral-700 lg:text-3xl">
            Great job! <br /> You&apos;ve completed the lesson.
          </h1>

          <div className="flex w-full items-center gap-x-4">
            <ResultCard variant="points" value={challenges.length * 10} />
            <ResultCard
              variant="hearts"
              value={userSubscription?.isActive ? Infinity : hearts}
            />
          </div>
        </div>

        <Footer
          lessonId={lessonId}
          status="completed"
          onCheck={() => router.push("/learn")}
        />
      </>
    );
  }

  const title =
    currentChallenge.type === "ASSIST"
      ? "Select the correct meaning"
      : `${currentChallenge.question} (Difficulty: ${currentChallenge.difficulty})`;

  return (
    <>
      {incorrectAudio}
      {correctAudio}
      <Header
        hearts={hearts}
        percentage={percentage}
        hasActiveSubscription={!!userSubscription?.isActive}
      />

      <div className="flex-1">
        <div className="flex h-full items-center justify-center">
          <div className="flex w-full flex-col gap-y-12 px-6 lg:min-h-[350px] lg:w-[600px] lg:px-0">
            <h1 className="text-center text-lg font-bold text-neutral-700 lg:text-start lg:text-3xl">
              {title}
            </h1>

            <div>
              {currentChallenge.type === "ASSIST" && (
                <QuestionBubble question={currentChallenge.question} />
              )}

              <Challenge
                options={options}
                onSelect={onSelect}
                status={status}
                selectedOption={selectedOption}
                disabled={pending}
                type={currentChallenge.type}
              />
            </div>
          </div>
        </div>
      </div>

      <Footer
        disabled={pending || !selectedOption}
        status={status}
        onCheck={onContinue}
      />
    </>
  );
};
