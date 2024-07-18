import { getLessonPage } from "../page";

type LessonIdPageProps = {
  params: {
    lessonId: number;
  };
};

const LessonIdPage = async ({ params }: LessonIdPageProps) => {
  return getLessonPage(params.lessonId);
};

export default LessonIdPage;
