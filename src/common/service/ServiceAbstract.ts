import { StageEndpointsInterface } from './endpoints/StageEndpointsInterface';
import { VehicleEndpointsInterface } from './endpoints/VehicleEndpointsInterface';
import { StatisticsEndpointsInterface } from './endpoints/statistics/StatisticsEndpointsInterface';
import { DemoEndpointsInterface } from './endpoints/demo/DemoEndpointsInterface';

export abstract class ServiceAbstract {
  readonly abstract vehicleEndpoints: VehicleEndpointsInterface;
  readonly abstract stageEndpoints: StageEndpointsInterface;
  readonly abstract statisticsEndpoints: StatisticsEndpointsInterface;
  readonly abstract demoEndpoints: DemoEndpointsInterface;
  async initialize() { };
}