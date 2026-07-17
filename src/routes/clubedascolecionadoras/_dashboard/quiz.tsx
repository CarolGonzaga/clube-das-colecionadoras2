import { createFileRoute } from "@tanstack/react-router";
import QuizClient from "../../../components/QuizClient";
import { dbService } from "../../../lib/db";

export const Route = createFileRoute("/clubedascolecionadoras/_dashboard/quiz")({
  loader: async () => {
    const data = await dbService.getQuizQuestionsForToday();
    return {
      diaAtual: data.diaAtual,
      tentativasHojeCount: data.tentativasHojeCount,
      perguntasRespondidasCorretasCount: data.perguntasRespondidasCorretasCount,
      questions: data.questions,
    };
  },
  component: DashboardQuiz,
});

function DashboardQuiz() {
  const data = Route.useLoaderData();
  return (
    <QuizClient
      diaAtual={data.diaAtual}
      tentativasHojeCount={data.tentativasHojeCount}
      perguntasRespondidasCorretasCount={data.perguntasRespondidasCorretasCount}
      initialQuestions={data.questions}
    />
  );
}
