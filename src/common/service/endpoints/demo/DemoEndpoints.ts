import { DemoEndpointsInterface } from './DemoEndpointsInterface';
import { StageEndpointsInterface } from "../StageEndpointsInterface";
import { VehicleEndpointsInterface } from "../VehicleEndpointsInterface";
import { setDefaults, getDefaults, addVehicleDescriptors, addStages, generateVehicles } from './demoFunctions';
import { vehicleDescriptors } from "./demoData/demoVehicleDescriptors";
import { demoStages, demoPeoplePlaces } from './demoData/demoStagesPeoplePlaces';
import { DeleteSuccess } from '../../../types/Results';
import { DbSelection } from '../../../types/Demo';

export abstract class DemoEndpoints implements DemoEndpointsInterface {
  abstract clearDatabase(): Promise<DeleteSuccess>;
  readonly setDefaults;
  readonly getDefaults;
  readonly addVehicleDescriptors;
  readonly addStages;
  readonly generateVehicles;

  constructor(vehicleEndpoints: VehicleEndpointsInterface, stageEndpoints: StageEndpointsInterface, db: DbSelection) {
    this.setDefaults = setDefaults(stageEndpoints, db);
    this.getDefaults = getDefaults(stageEndpoints, db);
    this.addVehicleDescriptors = addVehicleDescriptors(vehicleEndpoints, vehicleDescriptors, db);
    this.addStages = addStages(stageEndpoints, demoStages, demoPeoplePlaces, db);
    this.generateVehicles = generateVehicles(vehicleEndpoints, stageEndpoints, db);
  };

}