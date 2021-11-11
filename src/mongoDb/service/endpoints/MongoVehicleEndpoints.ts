import { VehicleEndpointsInterface } from '../../../common/service/endpoints/VehicleEndpointsInterface';
import {
  getVehiclesPagedMongo,
  getVehiclesByStatusMongo,
  getNextStockMongo,
  checkStockMongo,
  addVehicleMongo,
  findVehicleMongo,
  updateVehicleDocMongo,
  sellVehicleMongo,
  deleteVehicleDocMongo,
} from '../../collectionAPIs/vehicles';
import { getMakesMongo, addMakeMongo } from '../../collectionAPIs/makes';
import { getModelsMongo, addModelMongo, getTrimsMongo, addTrimMongo } from '../../collectionAPIs/models';

export class MongoVehicleEndpoints implements VehicleEndpointsInterface {
  readonly getVehiclesPaged = getVehiclesPagedMongo;
  readonly getVehicles = getVehiclesByStatusMongo;
  readonly getNextStock = getNextStockMongo;
  readonly checkStock = checkStockMongo;
  readonly addVehicle = addVehicleMongo;
  readonly findVehicle = findVehicleMongo;
  readonly updateVehicle = updateVehicleDocMongo;
  readonly sellVehicle = sellVehicleMongo;
  readonly deleteVehicle = deleteVehicleDocMongo;
  readonly getMakes = getMakesMongo;
  readonly addMake = addMakeMongo;
  readonly getModels = getModelsMongo;
  readonly addModel = addModelMongo;
  readonly getTrims = getTrimsMongo;
  readonly addTrim = addTrimMongo;
}