import { StageEndpointsInterface } from '../../../common/service/endpoints/StageEndpointsInterface';
import {
  assignStageMongo,
  findStageAssignmentMongo,
  completeStageAssignmentMongo,
  getAllStageAssignmentsMongo,
  getStageHistoryMongo
} from '../../collectionAPIs/stageAssignments';
import {
  getStageVehicleCountsMongo,
  getStagesMongo,
  addStageMongo,
  getPeoplePlacesMongo,
  updateStageOrderMongo,
  addStagePersonPlaceMongo
} from '../../collectionAPIs/stages';
import { getAllPeoplePlacesMongo, addPersonPlaceMongo, getPersonPlaceVehicleCountsMongo } from '../../collectionAPIs/peoplePlaces';

export class MongoStageEndpoints implements StageEndpointsInterface {
  readonly getStageVehicleCounts = getStageVehicleCountsMongo;
  readonly getPersonPlaceVehicleCounts = getPersonPlaceVehicleCountsMongo;
  readonly assignStage = assignStageMongo;
  readonly findStageAssignment = findStageAssignmentMongo;
  readonly completeStageAssignment = completeStageAssignmentMongo;
  readonly getAllStageAssignments = getAllStageAssignmentsMongo;
  readonly getStageHistory = getStageHistoryMongo;
  readonly getStages = getStagesMongo;
  readonly addStage = addStageMongo;
  readonly getPeoplePlaces = getPeoplePlacesMongo;
  readonly updateStageOrder = updateStageOrderMongo;
  readonly addStagePersonPlace = addStagePersonPlaceMongo;
  readonly getAllPeoplePlaces = getAllPeoplePlacesMongo;
  readonly addPersonPlace = addPersonPlaceMongo;
}