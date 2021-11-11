import { VehicleTurnStats, StageAssignmentStats, StageAssignmentStatsInclPercentile } from '../../../types/Statistics';
import { GetSuccess } from '../../../types/Results';

export interface StatisticsEndpointsInterface {
  getVehicleTurnStats(): Promise<GetSuccess<VehicleTurnStats>>;
  getStageStatistics(): Promise<GetSuccess<StageAssignmentStats>>;
  getPeoplePlacesStatistics(): Promise<GetSuccess<StageAssignmentStatsInclPercentile>>;
}