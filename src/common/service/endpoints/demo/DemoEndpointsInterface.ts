import { GetSuccess, DeleteSuccess, SuccessResult } from "common/types/Results";
import { Defaults } from 'common/types/Demo';

export interface DemoEndpointsInterface {
  // default stage assignment, etc.
  setDefaults(): Promise<SuccessResult>;
  getDefaults(): Promise<GetSuccess<Defaults>>;
  clearDatabase(): Promise<DeleteSuccess>;
  addVehicleDescriptors(): Promise<SuccessResult>;
  addStages(): Promise<SuccessResult>;
  generateVehicles(addVehiclesAmount: number, monthsBack: number): Promise<SuccessResult>;
}