export type SceneTag = 'date' | 'family' | 'solo' | 'first';

export type Place = {
  name: string;
  address?: string;
  lat: number;
  lng: number;
  rating: number;
  popularity: number;
  value: number;
  stability: number;
  category: string;
  sceneTags?: SceneTag[];
  score: number;
};

export type RouteStop = {
  type: 'eat' | 'play';
  name: string;
  address?: string;
  lat: number;
  lng: number;
};

export type CityRanking = {
  name: string;
  slug: string;
  topFoods: Place[];
  topPlays: Place[];
  route: RouteStop[];
};

export type RankingData = {
  generatedAt: string;
  cities: CityRanking[];
};

export type LobsterStatus = 'idle' | 'running' | 'done' | 'error';

export type LobsterTimelineType = 'info' | 'success' | 'warning' | 'error';

export type LobsterTimelineItem = {
  time: string;
  label: string;
  type: LobsterTimelineType;
};

export type LobsterAgent = {
  id: string;
  name: string;
  status: LobsterStatus;
  currentTask: string;
  progress: number;
  updatedAt: string;
  timeline: LobsterTimelineItem[];
};

export type LobsterOpsBoard = {
  generatedAt: string;
  squadName: string;
  activeCount: number;
  lobsters: LobsterAgent[];
};
