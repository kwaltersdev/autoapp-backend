import { DemoEndpoints } from "../../../common/service/endpoints/demo/DemoEndpoints";
import AutoFlowConnect from "../../AutoFlowConnect";
import { createStagesTable } from '../../tableAPIs/stages';
import { createPeoplePlacesTable } from "../../tableAPIs/peoplePlaces";
import { createStagesPeoplePlacesTable } from '../../tableAPIs/stages-peoplePlaces-join';
import { DeleteSuccess } from "../../../common/types/Results";
import { VehicleEndpointsInterface } from "../../../common/service/endpoints/VehicleEndpointsInterface";
import { StageEndpointsInterface } from "../../../common/service/endpoints/StageEndpointsInterface";
import { createModelsTable } from "../../tableAPIs/models";
import { createTrimsTable } from "../../tableAPIs/trims";
import { createMakesTable } from "../../tableAPIs/makes";
import { createVehiclesTable } from "../../tableAPIs/vehicles";
import { createStageAssignmentsTable } from "../../tableAPIs/stageAsignments";

export class MysqlDemoEndpoints extends DemoEndpoints {
  async clearDatabase() {
    const pool = await new AutoFlowConnect().createPool();
    try {
      // drop tables
      await Promise.all([
        pool.execute(`DROP TABLE stages`),
        pool.execute(`DROP TABLE peoplePlaces`),
        pool.execute(`DROP TABLE stagePeoplePlacesJoin`),
        pool.execute(`DROP TABLE makes`),
        pool.execute(`DROP TABLE models`),
        pool.execute(`DROP TABLE trims`),
        pool.execute(`DROP TABLE vehicles`),
        pool.execute(`DROP TABLE stageAssignments`)
      ]);
      await Promise.all([
        createStagesTable(pool),
        createPeoplePlacesTable(pool),
        createStagesPeoplePlacesTable(pool),
        createMakesTable(pool),
        createModelsTable(pool),
        createTrimsTable(pool),
        createVehiclesTable(pool),
        createStageAssignmentsTable(pool),
      ]);
      await this.setDefaults();
      return new DeleteSuccess();
    } finally {
      await pool.end();
    }
  }

  constructor(vehicleEndpoints: VehicleEndpointsInterface, stageEndpoints: StageEndpointsInterface) {
    super(vehicleEndpoints, stageEndpoints, 'mysql');
  }
}