import { ObjectId } from 'mongodb';
import { IdName } from '../../common/types/misc';

export interface MongoCurrentStageSummary {
  _id: ObjectId,
  dateAssigned: number,
  tasks: string[],
  stage: IdName,
  personPlace: IdName,
  status: 'complete' | 'incomplete',
  dateCompleted: number,
  completeTime: number;
}

export interface MongoBaseStageAssignment {
  dateAssigned: number,
  tasks: string[],
  vehicleId: ObjectId,
  stage: IdName,
  personPlace: IdName,
  status: 'complete' | 'incomplete',
  dateCompleted: number,
  completeTime: number;
}

export interface MongoStageAssignment extends MongoBaseStageAssignment {
  _id: ObjectId;
}

export interface MongoAssignStageParam {
  stage: IdName,
  personPlace: IdName,
  tasks: string[],
  vehicleId: string | ObjectId,
  dateAssigned: number,
  dateForSale?: number,
}