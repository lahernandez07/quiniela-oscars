export type Match = {
  id: number;
  matchNumber: number;
  stage: "group";
  group: string;
  home: string;
  away: string;
  homeFlag: string;
  awayFlag: string;
  date: string;
  time: string;
  stadium: string;
  city: string;
  cut: string;
};

export const matches: Match[] = [];