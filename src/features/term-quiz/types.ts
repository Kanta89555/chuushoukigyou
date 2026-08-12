export type TermDictionaryEntry = {
  id: string;
  term: string;
  articleId: string;
  subjectId: string;
  categoryId: string;
  definition: string;
};

export type QuizChoice = { id: string; text: string };
export type TermQuiz = { termId: string; term: string; question: string; choices: QuizChoice[] };
