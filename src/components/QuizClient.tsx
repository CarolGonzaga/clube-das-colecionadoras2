import React, { useState, useEffect, useMemo } from "react";
import { useUI } from "@/components/UIProvider";
import { useRouter } from "@tanstack/react-router";
import { answerQuizAction, startQuizQuestionTimerAction } from "@/lib/actions";
import {
  ArrowLeft,
  Timer,
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lock,
  Hourglass,
  Brain,
  Lightbulb,
  Sparkles,
  Clock,
  ChevronRight,
  CircleDot,
  Circle,
  BicepsFlexed,
} from "lucide-react";

interface Question {
  sticker_number: number;
  slug: string;
  title: string;
  author: string | null;
  q_index: number;
  text: string;
  options: string[];
  errors: number;
  answered: boolean;
  correct: boolean;
  chosenIndex: number | null;
  correct_index: number | null;
  options_to_hide?: number[] | null;
}

interface QuizClientProps {
  diaAtual: number;
  tentativasHojeCount: number;
  perguntasRespondidasCorretasCount: number;
  initialQuestions: Question[];
}

export default function QuizClient({
  diaAtual,
  tentativasHojeCount,
  perguntasRespondidasCorretasCount,
  initialQuestions,
}: QuizClientProps) {
  const ui = useUI();
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [activeSession, setActiveSession] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answering, setAnswering] = useState<{ [key: number]: boolean }>({});
  const [timeLeft, setTimeLeft] = useState(180);

  const activeSessionRef = React.useRef(activeSession);
  const currentIndexRef = React.useRef(currentIndex);
  const questionsRef = React.useRef(questions);

  React.useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);
  React.useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);
  React.useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  // Leaving the page never resets or immediately fails a question. The timer
  // is stored in Supabase and remains authoritative across navigation.
  React.useEffect(() => {
    return undefined;
  }, []);

  // Alert on tab close/reload
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const active = activeSessionRef.current;
      const index = currentIndexRef.current;
      const qs = questionsRef.current;
      if (active && qs.length > 0 && index < qs.length) {
        const activeQ = qs[index];
        if (!activeQ.answered) {
          e.preventDefault();
          e.returnValue = "";
        }
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const currentQ = questions[currentIndex];
  const isCurrentQActive = currentQ && !currentQ.answered;

  const handleExitSession = async () => {
    if (isCurrentQActive) {
      // Mark as incorrect before exiting
      await handleAnswer(currentQ.sticker_number, currentQ.q_index, -1, currentQ.title);
    }
    setActiveSession(false);
  };

  // Sync questions from props
  useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions]);

  // Continuous hearts animation when quiz is completed
  useEffect(() => {
    if (perguntasRespondidasCorretasCount >= 20) {
      ui.triggerHearts();
      const intervalId = setInterval(() => {
        ui.triggerHearts();
      }, 2500);
      return () => clearInterval(intervalId);
    }
  }, [perguntasRespondidasCorretasCount]);

  // The client only renders the deadline. Supabase creates it once and never
  // extends it, so refreshes, navigation and closing the app cannot add time.
  useEffect(() => {
    if (!activeSession || questions.length === 0 || currentIndex >= questions.length) return;

    const currentQ = questions[currentIndex];

    // If already answered, do not tick
    if (currentQ.answered) {
      setTimeLeft(0);
      return;
    }

    let cancelled = false;
    let timerId: ReturnType<typeof setInterval> | undefined;

    const syncDeadline = async () => {
      const res = await startQuizQuestionTimerAction({
        stickerNumber: currentQ.sticker_number,
        qIndex: currentQ.q_index,
      });
      if (cancelled) return;

      if (!res.success || !res.data) {
        ui.toast(res.message || "Não foi possível iniciar o cronômetro.");
        return;
      }

      if (res.data.expired) {
        setTimeLeft(0);
        setQuestions((prev) =>
          prev.map((q) =>
            q.sticker_number === currentQ.sticker_number
              ? { ...q, answered: true, correct: false, chosenIndex: -1 }
              : q,
          ),
        );
        ui.toast("Tempo esgotado nesta pergunta! ⏳");
        router.invalidate();
        return;
      }

      const deadline = new Date(res.data.expires_at).getTime();
      const tick = () => {
        const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining === 0 && timerId) {
          clearInterval(timerId);
          handleAnswer(currentQ.sticker_number, currentQ.q_index, -1, currentQ.title);
        }
      };

      tick();
      timerId = setInterval(tick, 1000);
    };

    syncDeadline();

    return () => {
      cancelled = true;
      if (timerId) clearInterval(timerId);
    };
  }, [currentIndex, activeSession, questions.length]);

  const handleAnswer = async (
    stickerNumber: number,
    qIndex: number,
    chosenIndex: number,
    stickerTitle: string,
  ) => {
    if (answering[stickerNumber]) return;

    // Check if this question is already answered (prevents double submits)
    const currentQState = questions.find((q) => q.sticker_number === stickerNumber);
    if (currentQState?.answered) return;

    setAnswering((prev) => ({ ...prev, [stickerNumber]: true }));

    const res = await answerQuizAction({
      stickerNumber,
      qIndex,
      chosenIndex,
    });

    setAnswering((prev) => ({ ...prev, [stickerNumber]: false }));

    if (res.success && res.data) {
      // Update local state immediately so UI changes instantly
      setQuestions((prev) =>
        prev.map((q) => {
          if (q.sticker_number === stickerNumber) {
            return {
              ...q,
              answered: true,
              correct: res.data.correct,
              chosenIndex: chosenIndex,
              errors: res.data.correct ? q.errors : (res.data.errors ?? q.errors + 1),
            };
          }
          return q;
        }),
      );

      if (res.data.correct) {
        ui.triggerHearts();
        const isRare = res.data.reveals?.[0]?.isRare ?? false;

        setTimeout(() => {
          ui.showReveals(
            res.data.reveals,
            isRare ? "Figurinha Rara Desbloqueada! ✦" : "Figurinha Desbloqueada!",
          );
          router.invalidate();
        }, 500);
      } else {
        if (chosenIndex === -1) {
          ui.toast("Tempo esgotado nesta pergunta! ⏳");
        } else {
          ui.toast(`Quase lá! Essa pergunta voltará na sua sessão de amanhã.`);
        }
        router.invalidate();
      }
    } else {
      ui.toast(res.message || "Erro ao enviar resposta.");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Render Step Progress Bar
  const renderProgressBar = () => {
    const steps = [];
    for (let i = 0; i < 4; i++) {
      if (i < questions.length) {
        const q = questions[i];
        let statusClass =
          "bg-gray-100 border-gray-200 dark:bg-zinc-800 dark:border-zinc-700 text-gray-400 dark:text-gray-500";
        let icon: React.ReactNode = <Circle className="w-3.5 h-3.5" />;

        if (q.answered) {
          if (q.correct) {
            statusClass = "bg-emerald-500 border-emerald-600 text-white";
            icon = <CheckCircle2 className="w-3.5 h-3.5" />;
          } else {
            statusClass = "bg-rose-500 border-rose-600 text-white";
            icon = <XCircle className="w-3.5 h-3.5" />;
          }
        } else if (i === currentIndex) {
          statusClass =
            "bg-pink-100 border-pink-400 text-pink-700 dark:bg-pink-950/40 dark:border-pink-500 dark:text-pink-300 animate-pulse";
          icon = <CircleDot className="w-3.5 h-3.5" />;
        }

        steps.push(
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            disabled={isCurrentQActive}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl border text-xs font-black transition-all shadow-sm ${statusClass} ${isCurrentQActive ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-[1.02] active:scale-[0.98]"}`}
          >
            <span className="text-[9px] uppercase tracking-wider opacity-75 mb-0.5 font-sans">
              Etapa {i + 1}
            </span>
            <span className="text-sm leading-none font-sans flex items-center justify-center h-4">
              {icon}
            </span>
          </button>,
        );
      } else {
        steps.push(
          <div
            key={i}
            className="flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/20 text-gray-300 dark:text-zinc-600 text-xs select-none"
          >
            <span className="text-[9px] uppercase tracking-wider opacity-50 mb-0.5 font-sans">
              Etapa {i + 1}
            </span>
            <span className="text-sm leading-none font-sans">○</span>
          </div>,
        );
      }
    }
    return <div className="flex items-center justify-between gap-2 my-2 w-full px-1">{steps}</div>;
  };

  // Check if all available questions are answered
  const isSessionFinished = useMemo(() => {
    if (questions.length === 0) return true;
    return questions.every((q) => q.answered);
  }, [questions]);

  // LANDING PAGE SCREEN
  if (!activeSession || questions.length === 0) {
    const isCompleted = perguntasRespondidasCorretasCount >= 20;
    const isTodayBlocked = tentativasHojeCount >= 4;
    const hasNoPendingQuestions = questions.length === 0 && !isCompleted;

    return (
      <div className="screen px-4 pb-8 max-w-md mx-auto">
        <div className="text-center mt-6">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-pink-100 dark:bg-pink-950/40 flex items-center justify-center border border-pink-200/50 shadow-sm mb-3">
            <Trophy className="w-8 h-8 text-[#ff2c79]" />
          </div>
          <h1 className="text-2xl font-black text-[#5c0d2b] dark:text-pink-200 font-sans">
            Quiz Literário
          </h1>
          <p className="text-xs text-[#bf2a5e] dark:text-pink-400 font-medium mt-1">
            Responda e desbloqueie figurinhas sáficas exclusivas!
          </p>
        </div>

        {/* Double Progress Indicators */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-pink-200/60 dark:border-zinc-800 p-5 mt-6 shadow-sm space-y-5">
          <div>
            <div className="flex justify-between items-center mb-1.5 text-xs font-extrabold text-[#9e1b4a] dark:text-pink-300">
              <span>Desbloqueadas</span>
              <span>{perguntasRespondidasCorretasCount} / 20 Figurinhas</span>
            </div>
            <div className="w-full h-3 bg-pink-50 dark:bg-zinc-800 rounded-full overflow-hidden border border-pink-100/50 dark:border-zinc-700">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(perguntasRespondidasCorretasCount / 20) * 100}%`,
                  background: "var(--gradient-berry)",
                }}
              />
            </div>
          </div>

          <div className="border-t border-pink-100 dark:border-zinc-800 pt-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-pink-400 dark:text-zinc-500">
                Desbloqueios hoje
              </span>
              <span className="text-sm font-extrabold text-[#9e1b4a] dark:text-pink-300">
                {Math.max(0, 4 - tentativasHojeCount)} de 4 restantes hoje
              </span>
            </div>
          </div>
        </div>

        {/* Rules & Warnings */}
        <div className="bg-pink-50/20 dark:bg-zinc-900/30 border border-pink-100/40 dark:border-zinc-800/80 rounded-2xl p-4 mt-4 text-[11px] text-[#bf2a5e] dark:text-zinc-400 space-y-2">
          <p className="font-extrabold text-xs text-[#9e1b4a] dark:text-pink-300 mb-1.5 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" /> Informações do Jogo:
          </p>
          <div className="flex items-start gap-1 leading-relaxed">
            <ChevronRight className="w-3.5 h-3.5 text-[#ff2c79] shrink-0 mt-0.5" />
            <span>
              Você pode desbloquear até <b>4 figurinhas por dia</b> respondendo corretamente.
            </span>
          </div>
          <div className="flex items-start gap-1 leading-relaxed">
            <ChevronRight className="w-3.5 h-3.5 text-[#ff2c79] shrink-0 mt-0.5" />
            <span>Errou? A pergunta vai pro final da fila.</span>
          </div>
          <div className="flex items-start gap-1 leading-relaxed">
            <ChevronRight className="w-3.5 h-3.5 text-[#ff2c79] shrink-0 mt-0.5" />
            <span>As perguntas são sorteadas. Nada de decorar a resposta da coleguinha.</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8">
          {isCompleted ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-3xl p-5 text-center shadow-sm animate-pulse">
              <p className="text-base font-black text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-1.5 font-sans">
                <Trophy className="w-5 h-5 text-emerald-600" /> Parabéns! Quiz Concluído!
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 leading-relaxed font-sans">
                Você acertou todas as 20 perguntas do quiz! Compartilhe o seu feito com outras
                colecionadoras usando o poster exclusivo que acaba de ser desbloqueado para você na
                página inicial! 🌸✨
              </p>
            </div>
          ) : hasNoPendingQuestions ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-3xl p-5 text-center shadow-sm">
              <p className="text-sm font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-1.5 font-sans">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Nenhuma pergunta pendente
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-1.5 leading-relaxed font-sans">
                Todas as perguntas disponíveis para o seu álbum já foram respondidas ou desbloqueadas.
              </p>
            </div>
          ) : isTodayBlocked ? (
            <div className="bg-amber-50 dark:bg-zinc-900 border border-amber-200 dark:border-zinc-800 rounded-3xl p-5 text-center shadow-sm">
              <p className="text-sm font-extrabold text-amber-800 dark:text-amber-300 flex items-center justify-center gap-1.5 font-sans">
                <Hourglass className="w-4 h-4 text-amber-600 animate-pulse" /> Volte Amanhã!
              </p>
              <p className="text-[11px] text-amber-700 dark:text-zinc-400 font-medium mt-1.5 leading-relaxed font-sans">
                Você já usou suas 4 tentativas do dia. Suas perguntas serão resetadas amanhã!
              </p>
            </div>
          ) : (
            <button
              className="w-full py-4 rounded-2xl text-xs font-black text-white shadow-md hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all flex items-center justify-center gap-1.5 font-sans"
              style={{ background: "var(--gradient-berry)" }}
              onClick={() => {
                setActiveSession(true);
                setCurrentIndex(0);
              }}
            >
              Começar rodada <Brain className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ACTIVE QUIZ SESSION SCREEN
  const q = questions[currentIndex];
  const currentErrors = q.errors;
  const correctIdx = q.correct_index;

  const isAssistActive = currentErrors >= 3 && correctIdx !== null;

  return (
    <div className="screen px-4 pb-8 max-w-md mx-auto">
      {/* Top Header Controls */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={handleExitSession}
          className="w-9 h-9 rounded-full bg-white dark:bg-zinc-900 border border-pink-100 dark:border-zinc-800 flex items-center justify-center shadow-sm cursor-pointer hover:bg-pink-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#C2185B]" />
        </button>
        <span className="text-xs font-black text-[#9e1b4a] dark:text-pink-300 font-sans">
          Pergunta {String(currentIndex + 1).padStart(2, "0")} /{" "}
          {String(questions.length).padStart(2, "0")}
        </span>
        <div className="w-9 h-9 rounded-full bg-pink-50 dark:bg-zinc-800 flex items-center justify-center border border-pink-100/50 dark:border-zinc-700">
          <Clock className="w-4 h-4 text-[#ff2c79]" />
        </div>
      </div>

      {/* Marcador no Topo com 4 barras */}
      {renderProgressBar()}

      {/* Circular Timer Display */}
      <div className="flex flex-col items-center justify-center my-4">
        <div className="relative w-20 h-20 flex items-center justify-center bg-white dark:bg-zinc-900 rounded-full shadow-inner border border-pink-100 dark:border-zinc-800">
          <svg className="absolute w-full h-full -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="34"
              stroke="#fce4ec"
              strokeWidth="4.5"
              fill="transparent"
              className="dark:stroke-zinc-800"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              stroke="#ff2c79"
              strokeWidth="4.5"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 34}
              strokeDashoffset={(1 - (q.answered ? 0 : timeLeft) / 180) * (2 * Math.PI * 34)}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <span className="text-sm font-black text-[#5c0d2b] dark:text-pink-300 font-mono z-10">
            {q.answered ? (
              q.correct ? (
                <span className="text-emerald-500 font-bold font-sans">ACERTO</span>
              ) : (
                <span className="text-rose-500 font-bold font-sans">ERRO</span>
              )
            ) : (
              formatTime(timeLeft)
            )}
          </span>
        </div>
      </div>

      {/* Question Card Display */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-pink-200/60 dark:border-zinc-800 p-5 shadow-sm text-center">
        <span className="text-[10px] uppercase font-bold tracking-widest text-[#bf2a5e] dark:text-zinc-500">
          Pergunta do Quiz
        </span>
        <h2 className="text-sm font-extrabold text-[#5c0d2b] dark:text-pink-200 mt-2 leading-relaxed font-sans">
          {q.text}
        </h2>
      </div>

      {/* Wrong answer: hide question and show message only */}
      {q.answered && !q.correct && (
        <div className="mt-4 flex flex-col items-center gap-3">
          <div className="w-full bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-3xl p-6 text-center shadow-sm">
            <XCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <p className="text-sm font-black text-rose-700 dark:text-rose-300 font-sans mb-1">
              Resposta incorreta!
            </p>
            <p className="text-xs text-rose-600/80 dark:text-rose-400/80 font-medium leading-relaxed font-sans">
              Não se preocupe! Essa pergunta voltará numa próxima sessão e você terá outra chance de
              desbloquear a figurinha.{" "}
              <BicepsFlexed className="w-3.5 h-3.5 inline-block align-text-bottom text-rose-600 dark:text-rose-400" />
            </p>
          </div>
        </div>
      )}

      {/* Answers Options Grid 2x2 — hidden if answered wrong */}
      {(!q.answered || q.correct) && (
        <div className="grid grid-cols-2 gap-3.5 w-full mt-4">
          {[0, 1, 2, 3].map((oi) => {
            const label = q.options[oi];

            // Determine status styles
            const isChosen = q.chosenIndex === oi;
            const isCorrectChoice = q.correct && isChosen;
            const isCorrectOptionIndex = oi === correctIdx;

            let btnClass =
              "bg-white border-pink-200/60 text-[#5c0d2b] hover:bg-pink-50/40 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800/80";

            if (q.answered) {
              if (isCorrectChoice || (isAssistActive && isCorrectOptionIndex)) {
                btnClass =
                  "bg-emerald-500 border-emerald-600 text-white shadow-md shadow-emerald-100 dark:shadow-none";
              } else {
                btnClass =
                  "opacity-45 bg-gray-50 border-gray-100 dark:bg-zinc-900 dark:border-zinc-800 text-gray-400 dark:text-zinc-600";
              }
            } else {
              // Apply assist highlight if errors >= 3
              if (isAssistActive && isCorrectOptionIndex) {
                btnClass =
                  "bg-amber-100 border-amber-500 text-amber-900 font-black shadow-md dark:bg-amber-950/60 dark:border-amber-400 dark:text-amber-200 animate-pulse";
              }
            }

            return (
              <button
                key={oi}
                className={`py-4 px-3.5 rounded-2xl border text-center font-bold text-xs transition-all flex flex-col items-center justify-center gap-1.5 min-h-[82px] shadow-sm cursor-pointer ${btnClass}`}
                disabled={q.answered || answering[q.sticker_number]}
                onClick={() => handleAnswer(q.sticker_number, q.q_index, oi, q.title)}
              >
                <span className="text-[9px] uppercase tracking-wider opacity-65 font-sans">
                  Opção {["A", "B", "C", "D"][oi]}
                </span>
                <span className="break-words w-full text-center leading-tight font-sans">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Navigation Buttons: Prev / Next */}
      <div className="flex items-center justify-between w-full mt-6 gap-4">
        <button
          className="flex-1 py-3 px-4 rounded-full border border-pink-200 dark:border-zinc-800 text-xs font-bold text-[#9e1b4a] dark:text-pink-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-pink-50 dark:hover:bg-zinc-800 transition-colors font-sans"
          disabled={currentIndex === 0 || isCurrentQActive}
          onClick={() => setCurrentIndex((prev) => prev - 1)}
        >
          ← Anterior
        </button>

        <button
          className="flex-1 py-3 px-4 rounded-full border border-pink-200 dark:border-zinc-800 text-xs font-bold text-[#9e1b4a] dark:text-pink-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-pink-50 dark:hover:bg-zinc-800 transition-colors font-sans"
          disabled={currentIndex === questions.length - 1 || isCurrentQActive}
          onClick={() => setCurrentIndex((prev) => prev + 1)}
        >
          Próximo →
        </button>
      </div>

      {/* Final Completion Action Button */}
      {isSessionFinished && (
        <button
          className="w-full mt-6 py-4 rounded-2xl text-xs font-black text-white shadow-md cursor-pointer transition-transform active:scale-[0.98] animate-bounce flex items-center justify-center gap-2 font-sans"
          style={{ background: "var(--gradient-berry)" }}
          onClick={() => {
            setActiveSession(false);
            ui.toast("Quiz finalizado com sucesso! 🎉");
            router.invalidate();
          }}
        >
          <Trophy className="w-4 h-4 text-white inline animate-bounce" /> Finalizar Sessão de Hoje
        </button>
      )}
    </div>
  );
}
