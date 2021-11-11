import { IdName } from './misc';

export interface CurrentStageSummary {
  id: string,
  dateAssigned: number,
  tasks: string[],
  stage: IdName,
  personPlace: IdName,
  status: 'complete' | 'incomplete',
  dateCompleted: number,
  completeTime: number;
}

export interface BaseStageAssignment {
  dateAssigned: number,
  tasks: string[],
  vehicleId: string,
  stage: IdName,
  personPlace: IdName,
  status: 'complete' | 'incomplete',
  dateCompleted: number,
  completeTime: number;
}

export interface StageAssignment extends BaseStageAssignment {
  id: string,
}

export interface InitialStageParam {
  stage: IdName,
  personPlace: IdName,
  tasks: string[],
}

export interface AssignStageParam extends InitialStageParam {
  vehicleId: string,
  dateAssigned: number,
  dateForSale?: number,
}