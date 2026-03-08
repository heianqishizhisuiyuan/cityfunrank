export type Place = {
  name: string;
  lat: number;
  lng: number;
  rating: number;
  popularity: number;
  value: number;
  stability: number;
  category: string;
  score: number;
};

export type RouteStop = {
  type: 'eat' | 'play';
  name: string;
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
