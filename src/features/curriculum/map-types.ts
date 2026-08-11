export type UnitMapState = {
  completed: boolean;
  vocabularyCount: number;
  analysisCount: number;
  searchText: string;
};

export type LearningMapNode = {
  id: string;
  title: string;
  type: string;
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
  href?: string;
  subjectId?: string;
  state?: UnitMapState;
};

export type LearningMapEdge = {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
};

export type LearningMapData = {
  nodes: LearningMapNode[];
  edges: LearningMapEdge[];
  width: number;
  height: number;
  subjects: { id: string; title: string }[];
};
