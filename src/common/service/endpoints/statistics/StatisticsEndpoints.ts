import { getVehicleTurnStats, getStageStatistics, getPeoplePlacesStatistics } from './statisticsFunctions';
import { VehicleEndpointsInterface } from '../VehicleEndpointsInterface';
import { StageEndpointsInterface } from '../StageEndpointsInterface';
import { StatisticsEndpointsInterface } from './StatisticsEndpointsInterface';

export class StatisticsEndpoints implements StatisticsEndpointsInterface {
  getVehicleTurnStats;
  getStageStatistics;
  getPeoplePlacesStatistics;

  constructor(vehicleEndpoints: VehicleEndpointsInterface, stageEndpoints: StageEndpointsInterface) {
    this.getVehicleTurnStats = getVehicleTurnStats(vehicleEndpoints);
    this.getStageStatistics = getStageStatistics(stageEndpoints);
    this.getPeoplePlacesStatistics = getPeoplePlacesStatistics(stageEndpoints);
  };
}