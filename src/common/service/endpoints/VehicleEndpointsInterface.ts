import { AddVehicleParam, Vehicle, DetailedVehicle, NextStock, CheckStock, ModelDoc, VehicleStatus, VehiclePage } from '../../types/Vehicle';
import { IdName, ListOrder, Page } from '../../types/misc';
import { InitialStageParam } from '../../types/StageAssignment';
import { GetSuccess, PostSuccess, PostExists, PatchSuccess, DeleteSuccess } from '../../types/Results';

export interface VehicleEndpointsInterface {
  getVehiclesPaged(status: VehicleStatus, sort: ListOrder, perPage: number, page: Page, compare: number, query?: unknown, connection?: unknown): Promise<GetSuccess<VehiclePage>>;
  getVehicles(statusParams: string[], connection?: unknown): Promise<GetSuccess<Vehicle[]>>;
  getNextStock(connection?: unknown): Promise<GetSuccess<NextStock>>;
  checkStock(stock: string, connection?: unknown): Promise<GetSuccess<CheckStock>>;
  addVehicle(vehicleParam: AddVehicleParam, initialStageParam: InitialStageParam, connection?: unknown): Promise<PostSuccess<DetailedVehicle> | PostExists>;
  findVehicle(field: 'id' | 'stock', value: string, connection?: unknown): Promise<GetSuccess<DetailedVehicle | null>>;
  updateVehicle(vehicleId: string, update: object, connection?: unknown): Promise<PatchSuccess<object, DetailedVehicle>>;
  sellVehicle(vehicleId: string, stageAssignmentId: string, dateSold: number, connection?: unknown): Promise<PatchSuccess<object, DetailedVehicle>>;
  deleteVehicle(vehicleId: string, connection?: unknown): Promise<DeleteSuccess>;
  getMakes(connection?: unknown): Promise<GetSuccess<IdName[]>>;
  addMake(make: string, connection?: unknown): Promise<PostSuccess<IdName, IdName[]> | PostExists>;
  getModels(make: string, connection?: unknown): Promise<GetSuccess<IdName[]>>;
  addModel(makeId: string, model: string, connection?: unknown): Promise<PostSuccess<IdName, IdName[]> | PostExists>;
  getTrims(modelId: string, connection?: unknown): Promise<GetSuccess<IdName[]>>;
  addTrim(modelId: string, trim: string, connection?: unknown): Promise<PatchSuccess<IdName, ModelDoc, IdName[]> | PostExists>;
}