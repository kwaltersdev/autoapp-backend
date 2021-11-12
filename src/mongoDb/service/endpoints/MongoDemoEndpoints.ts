import { StageEndpointsInterface } from '../../../common/service/endpoints/StageEndpointsInterface';
import { VehicleEndpointsInterface } from '../../../common/service/endpoints/VehicleEndpointsInterface';
import { DemoEndpoints } from '../../../common/service/endpoints/demo/DemoEndpoints';
import AutoAppClient from '../../AutoAppClient';
import { DeleteSuccess } from '../../../common/types/Results';

export class MongoDemoEndpoints extends DemoEndpoints {
  async clearDatabase() {
    const client = new AutoAppClient();
    try {
      const { db } = await client.connect();
      await db.dropDatabase();
      await this.setDefaults();
      return new DeleteSuccess;
    } finally {
      await client.close();
    }
  }

  constructor(vehicleEndpoints: VehicleEndpointsInterface, stageEndpoints: StageEndpointsInterface) {
    super(vehicleEndpoints, stageEndpoints, 'mongodb');
  }
}
