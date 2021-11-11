import { VehicleStatus } from '../../common/types/Vehicle';

export interface MysqlBaseVehicle {
  stock: number;
  year: number;
  makeId: number;
  makeName: string;
  modelId: number;
  modelName: string;
  trimId: number;
  trimName: string;
  notes: string;
  currentStageAssignmentId: number;
  currentStageStageId: number;
  currentStagePersonPlaceId: number;
  dateAdded: number;
  status: VehicleStatus;
  dateForSale?: number;
  dateSold?: number;
  reconditionTime?: number;
  forSaleTime?: number;
  totalSellTime?: number;
}

export interface MysqlVehicle extends MysqlBaseVehicle {
  id: number;
}

export interface MysqlDetailedVehicle extends MysqlVehicle {
  currentStageDateAssigned: number;
  currentStageTasks: string; // comma seperated list
  currentStageStageName: string;
  currentStagePersonPlaceName: string;
  currentStageStatus: 'complete' | 'incomplete';
  currentStageDateCompleted: number,
  currentStageCompleteTime: number;
}