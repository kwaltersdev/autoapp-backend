import { StageEndpointsInterface } from "../../../common/service/endpoints/StageEndpointsInterface";
import { addStageMysql, getPeoplePlacesMysql, getStagesMysql, getStageVehicleCountsMysql, updateStageOrderMysql } from '../../tableAPIs/stages';
import { addPersonPlaceMysql, getAllPeoplePlacesMysql, getPersonPlaceVehicleCountsMysql } from "../../tableAPIs/peoplePlaces";
import { addStagePersonPlaceMysql } from "../../tableAPIs/stages-peoplePlaces-join";
import { assignStageMysql, completeStageAssignmentMysql, findStageAssignmentMysql, getAllStageAssignmentsMysql, getStageHistoryMysql } from "../../tableAPIs/stageAsignments";

export class MysqlStageEndpoints implements StageEndpointsInterface {
  readonly getStageVehicleCounts = getStageVehicleCountsMysql;
  readonly getPersonPlaceVehicleCounts = getPersonPlaceVehicleCountsMysql;
  readonly assignStage = assignStageMysql;
  readonly findStageAssignment = findStageAssignmentMysql;
  readonly completeStageAssignment = completeStageAssignmentMysql;
  readonly getAllStageAssignments = getAllStageAssignmentsMysql;
  readonly getStageHistory = getStageHistoryMysql;
  readonly getStages = getStagesMysql;
  readonly addStage = addStageMysql;
  readonly getPeoplePlaces = getPeoplePlacesMysql;
  readonly updateStageOrder = updateStageOrderMysql;
  readonly addStagePersonPlace = addStagePersonPlaceMysql;
  readonly getAllPeoplePlaces = getAllPeoplePlacesMysql;
  readonly addPersonPlace = addPersonPlaceMysql;
}