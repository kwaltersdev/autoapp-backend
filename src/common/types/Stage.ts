import { IdName } from './misc';

export interface BaseStageDoc {
  name: string;
  peoplePlaces: string[]; // string is the id, not the personPlaceName
  order: number;
}

export interface StageDoc extends BaseStageDoc {
  id: string;
}

export interface StageSummary {
  id: string;
  name: string;
  order: number;
}

export interface StageVehicleCount extends StageSummary {
  count: number;
}

export interface PersonPlaceVehicleCount {
  id: string;
  name: string;
  count: number;
}

export interface ExportStage {
  id: string;
  name: string;
  peoplePlaces: IdName[];
  order: number;
}

export interface UpdatedStageOrder {
  id: string;
  order: number;
}