import { CurrentStageSummary } from './StageAssignment';
import { IdName } from './misc';

export type VehicleStatus = 'active' | 'trash' | 'sold';

export interface BaseVehicle {
  stock: number;
  year: number;
  make: IdName;
  model: IdName;
  trim: IdName;
  notes: string;
  currentStage: {
    stageAssignmentId: string,
    stageId: string,
    personPlaceId: string;
  } | CurrentStageSummary,
  dateAdded: number;
  status: VehicleStatus;
  dateForSale?: number;
  dateSold?: number;
  reconditionTime?: number;
  forSaleTime?: number;
  totalSellTime?: number;
}

export interface Vehicle extends BaseVehicle {
  id: string;

}

export interface DetailedVehicle extends Vehicle {
  currentStage: CurrentStageSummary;
}

interface PageDetails {
  docStartNumber: number,
  docEndNumber: number,
  totalDocs: number,
}
export class VehiclePage {
  docStartNumber: number;
  docEndNumber: number;
  totalDocs: number;
  vehicles: DetailedVehicle[];

  constructor(pageDetails: PageDetails, vehicles: DetailedVehicle[]) {
    this.docStartNumber = pageDetails.docStartNumber;
    this.docEndNumber = pageDetails.docEndNumber;
    this.totalDocs = pageDetails.totalDocs;
    this.vehicles = vehicles;
  }
}

export interface AddVehicleParam {
  stock: number;
  year: number;
  make: IdName;
  model: IdName;
  trim: IdName;
  notes: string;
  dateAdded: number;
}

export interface NextStock {
  nextStock: number;
}

export interface CheckStock {
  exists: boolean;
  id?: string;
}

export interface BaseModelDoc {
  name: string;
  makeId: string;
  trims: IdName[];
}

export interface ModelDoc extends BaseModelDoc {
  id: string;
}

export interface VehicleUpdate {
  stock?: number;
  year?: number;
  make?: IdName;
  model?: IdName;
  trim?: IdName;
  notes?: string;
  currentStage?: {
    stageAssignmentId: string,
    stageId: string,
    personPlaceId: string;
  };
  dateAdded?: number;
  status?: VehicleStatus;
  dateForSale?: number;
  dateSold?: number;
  reconditionTime?: number;
  forSaleTime?: number;
  totalSellTime?: number;
}

export interface GetVehiclesQuery {
  forSale: 'true' | 'false';
  year: string; // string that can be parsed into a number representing the current year in 4 digits
  make: string; // {MAKE.NAME}-{make.id'}
  model: string; // {MODEL.NAME}-{model.id}
  trim: string; // {TRIM.NAME}-{trim.id}
  addedAfter: string; // string that can be parsed into a number, represents date in milliseconds
  addedBefore: string; // string that can be parsed into a number, represents date in milliseconds
  soldAfter: string; // string that can be parsed into a number, represents date in milliseconds
  soldBefore: string; // string that can be parsed into a number, reperesents date in milliseconds
  stageId: string;
  personPlaceId: string;
}
