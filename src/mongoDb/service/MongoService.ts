import { ServiceAbstract } from '../../common/service/ServiceAbstract';
import { MongoStageEndpoints } from './endpoints/MongoStageEndpoints';
import { MongoVehicleEndpoints } from './endpoints/MongoVehicleEndpoints';
import { StatisticsEndpoints } from '../../common/service/endpoints/statistics/StatisticsEndpoints';
import { MongoDemoEndpoints } from './endpoints/MongoDemoEndpoints';

export class MongoService extends ServiceAbstract {
  stageEndpoints = new MongoStageEndpoints();
  vehicleEndpoints = new MongoVehicleEndpoints();
  statisticsEndpoints = new StatisticsEndpoints(this.vehicleEndpoints, this.stageEndpoints);
  demoEndpoints = new MongoDemoEndpoints(this.vehicleEndpoints, this.stageEndpoints);
}