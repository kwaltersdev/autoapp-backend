import { ServiceAbstract } from '../../common/service/ServiceAbstract';
import { createStagesTable } from '../tableAPIs/stages';
import { createPeoplePlacesTable } from '../tableAPIs/peoplePlaces';
import { createStagesPeoplePlacesTable } from '../tableAPIs/stages-peoplePlaces-join';
import { MysqlStageEndpoints } from './endpoints/MysqlStageEndpoints';
import { MysqlVehicleEndpoints } from './endpoints/MysqlVehicleEndpoints';
import { MysqlDemoEndpoints } from './endpoints/MysqlDemoEndpoints';
import AutoAppConnect from '../AutoAppConnect';
import { createMakesTable } from '../tableAPIs/makes';
import { createModelsTable } from '../tableAPIs/models';
import { createTrimsTable } from '../tableAPIs/trims';
import { createVehiclesTable } from '../tableAPIs/vehicles';
import { createStageAssignmentsTable } from '../tableAPIs/stageAsignments';
import { StatisticsEndpoints } from '../../common/service/endpoints/statistics/StatisticsEndpoints';

export class MysqlService extends ServiceAbstract {
  stageEndpoints = new MysqlStageEndpoints();
  vehicleEndpoints = new MysqlVehicleEndpoints();
  statisticsEndpoints = new StatisticsEndpoints(this.vehicleEndpoints, this.stageEndpoints);
  demoEndpoints = new MysqlDemoEndpoints(this.vehicleEndpoints, this.stageEndpoints);

  async initialize(): Promise<void> {
    const pool = await new AutoAppConnect().createPool();
    try {
      // create tables
      await Promise.all([
        createStagesTable(pool),
        createStagesPeoplePlacesTable(pool),
        createPeoplePlacesTable(pool),
        createMakesTable(pool),
        createModelsTable(pool),
        createTrimsTable(pool),
        createVehiclesTable(pool),
        createStageAssignmentsTable(pool),
        this.demoEndpoints.setDefaults()
      ]);
    } finally {
      pool.end();
    }
  }
}