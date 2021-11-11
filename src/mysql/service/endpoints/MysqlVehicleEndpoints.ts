import { addMakeMysql, getMakesMysql } from '../../tableAPIs/makes';
import { VehicleEndpointsInterface } from '../../../common/service/endpoints/VehicleEndpointsInterface';
import { addModelMysql, getModelsMysql } from '../../tableAPIs/models';
import { addTrimMysql, getTrimsMysql } from '../../tableAPIs/trims';
import { addVehicleMysql, checkStockMysql, deleteVehicleMyql, findVehicleMysql, getNextStockMysql, getVehiclesByStatusMysql, getVehiclesPagedMysql, sellVehicleMysql, updateVehicleMysql } from '../../tableAPIs/vehicles';

export class MysqlVehicleEndpoints implements VehicleEndpointsInterface {
  readonly getVehiclesPaged = getVehiclesPagedMysql;
  readonly getVehicles = getVehiclesByStatusMysql;
  readonly checkStock = checkStockMysql;
  readonly getNextStock = getNextStockMysql;
  readonly addVehicle = addVehicleMysql;
  readonly findVehicle = findVehicleMysql;
  readonly updateVehicle = updateVehicleMysql;
  readonly sellVehicle = sellVehicleMysql;
  readonly deleteVehicle = deleteVehicleMyql;
  readonly getMakes = getMakesMysql;
  readonly addMake = addMakeMysql;
  readonly getModels = getModelsMysql;
  readonly addModel = addModelMysql;
  readonly getTrims = getTrimsMysql;
  readonly addTrim = addTrimMysql;
}