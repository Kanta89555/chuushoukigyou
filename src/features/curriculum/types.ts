export type CurriculumNode = {
  id: string;
  title: string;
  slug: string;
  type: string;
  article?: string;
  children?: CurriculumNode[];
};

export type CurriculumMatch = {
  node: CurriculumNode;
  ancestors: CurriculumNode[];
};
