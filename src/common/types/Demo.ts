export interface Defaults {
  defaultStageAssignment: {
    stage: {
      id: string;
      name: string;
    };
    personPlace: {
      id: string;
      name: string;
    };
  };
};

export type VehicleDescriptors = { make: string, models: { model: string, trims: string[]; }[]; }[];

export type ModelQueryResult = {
  id: string;
  model: string;
  trims: { id: string, trim: string; }[];
}[];

export type VehicleDescriptorsQueryResult = {
  id: string;
  make: string;
  models: ModelQueryResult;
}[];

export type Stages = string[];

export type PeoplePlaces = { name: string, stages: string[]; }[];

export type DbSelection = 'mongodb' | 'mysql';

export interface UserSettings {
  user: string,
  simulatedLoadingDelay: number; // milliseconds
}