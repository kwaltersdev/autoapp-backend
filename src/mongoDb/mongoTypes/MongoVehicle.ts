import { ObjectId } from 'mongodb';
import { BaseVehicle, VehicleStatus } from '../../common/types/Vehicle';
import { MongoIdName } from './mongoMisc';
import { MongoCurrentStageSummary } from './MongoStageAssignment';
import { IdName } from '../../common/types/misc';

export interface MongoVehicle extends BaseVehicle {
  _id: ObjectId,
}

export interface MongoDetailedVehicle {
  _id: ObjectId;
  stock: number;
  year: number;
  make: MongoIdName;
  model: MongoIdName;
  trim: MongoIdName;
  notes: string;
  currentStage: MongoCurrentStageSummary;
  dateAdded: number;
  status: VehicleStatus;
  dateForSale?: number;
  dateSold?: number;
}

export interface MongoBaseModelDoc {
  name: string;
  makeId: ObjectId;
  trims: MongoIdName[];
}

export interface MongoModelDoc extends MongoBaseModelDoc {
  _id: ObjectId;
}

export interface MongoVehicleUpdate {
  stock?: number;
  year?: number;
  make?: IdName | MongoIdName;
  model?: IdName | MongoIdName;
  trim?: IdName | MongoIdName;
  notes?: string;
  currentStage?: {
    stageAssignmentId: ObjectId | string,
    stageId: ObjectId | string,
    personPlaceId: ObjectId | string;
  } | ObjectId;
  dateAdded?: number;
  status?: VehicleStatus;
  dateForSale?: number;
  dateSold?: number;
  reconditionTime?: number;
  forSaleTime?: number;
  totalSellTime?: number;
}
