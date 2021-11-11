import { MysqlExportStage, MysqlStageSummary } from './mysqlTypes/MysqlStage';
import { MysqlIdName } from './mysqlTypes/MysqlMisc';
import { ExportStage, StageSummary } from "../common/types/Stage";
import { RowDataPacket, OkPacket, ResultSetHeader, FieldPacket } from "mysql2";
import { IdName } from '../common/types/misc';
import { MysqlDetailedVehicle, MysqlVehicle } from './mysqlTypes/MysqVehicle';
import { DetailedVehicle, Vehicle } from '../common/types/Vehicle';
import { MysqlStageAssignment } from './mysqlTypes/MysqlStageAssignment';
import { StageAssignment } from '../common/types/StageAssignment';

export function json(result: [RowDataPacket[] | RowDataPacket[][] | OkPacket | OkPacket[] | ResultSetHeader, FieldPacket[]]) {
  return JSON.parse(JSON.stringify(result));
}

export function convertMysqlIdName(idName: MysqlIdName): IdName {
  const newIdName = { id: idName.id.toString(), name: idName.name };
  return newIdName;
}

export function convertMysqlStageSummary(stageParam: MysqlStageSummary): StageSummary {
  const stageTmp: StageSummary = {
    id: stageParam.id.toString(),
    name: stageParam.name,
    order: stageParam.orderPosition
  };
  return stageTmp;
}

export function convertMysqlExportStage(stageParam: MysqlExportStage): ExportStage {
  const peoplePlacesTmp = stageParam.peoplePlaces
    ? stageParam.peoplePlaces.split(',').map(personPlace => {
      const personPlaceArray = personPlace.split('-');
      return { id: personPlaceArray[0].toString(), name: personPlaceArray[1] };
    })
    : [];
  const stageTmp: ExportStage = {
    id: stageParam.id.toString(),
    name: stageParam.name,
    peoplePlaces: peoplePlacesTmp,
    order: stageParam.orderPosition
  };
  return stageTmp;
}

export function convertMysqlStageAssignment(MysqlStageAssignment: MysqlStageAssignment): StageAssignment {
  const { id, dateAssigned, tasks, vehicleId, stageId, stageName, personPlaceId, personPlaceName, status, dateCompleted, completeTime } = MysqlStageAssignment;
  const stageAssignment: StageAssignment = {
    id: id.toString(),
    dateAssigned,
    tasks: tasks ? tasks.split(',') : [],
    vehicleId: vehicleId.toString(),
    stage: { id: stageId.toString(), name: stageName },
    personPlace: { id: personPlaceId.toString(), name: personPlaceName },
    status,
    dateCompleted,
    completeTime
  };
  return stageAssignment;
}

export function convertMysqlVehicle(vehicle: MysqlVehicle): Vehicle {
  const {
    id,
    stock,
    year,
    makeId,
    makeName,
    modelId,
    modelName,
    trimId,
    trimName,
    notes,
    currentStageAssignmentId,
    currentStageStageId,
    currentStagePersonPlaceId,
    dateAdded,
    status,
    dateForSale,
    dateSold,
    reconditionTime,
    forSaleTime,
    totalSellTime
  } = vehicle;
  const vehicleTmp: Vehicle = {
    id: id.toString(),
    stock,
    year,
    make: { id: makeId.toString(), name: makeName },
    model: { id: modelId.toString(), name: modelName },
    trim: { id: trimId.toString(), name: trimName },
    notes,
    currentStage: {
      stageAssignmentId: currentStageAssignmentId.toString(),
      stageId: currentStageStageId.toString(),
      personPlaceId: currentStagePersonPlaceId.toString(),
    },
    dateAdded,
    status,
    dateForSale,
    dateSold,
    reconditionTime,
    forSaleTime,
    totalSellTime
  };
  return vehicleTmp;
}

export function convertMysqlDetailedVehicle(vehicle: MysqlDetailedVehicle): DetailedVehicle {
  const {
    id,
    stock,
    year,
    makeId,
    makeName,
    modelId,
    modelName,
    trimId,
    trimName,
    notes,
    currentStageAssignmentId,
    currentStageStageId,
    currentStageStageName,
    currentStagePersonPlaceId,
    currentStagePersonPlaceName,
    currentStageDateAssigned,
    currentStageTasks,
    currentStageStatus,
    currentStageDateCompleted,
    currentStageCompleteTime,
    dateAdded,
    status,
    dateForSale,
    dateSold,
    reconditionTime,
    forSaleTime,
    totalSellTime
  } = vehicle;
  const detailedVehicle: DetailedVehicle = {
    id: id.toString(),
    stock,
    year,
    make: { id: makeId.toString(), name: makeName },
    model: { id: modelId.toString(), name: modelName },
    trim: { id: trimId.toString(), name: trimName },
    notes,
    currentStage: {
      id: currentStageAssignmentId.toString(),
      dateAssigned: currentStageDateAssigned,
      tasks: currentStageTasks ? currentStageTasks.split(',') : [],
      stage: { id: currentStageStageId.toString(), name: currentStageStageName },
      personPlace: { id: currentStagePersonPlaceId.toString(), name: currentStagePersonPlaceName },
      status: currentStageStatus,
      dateCompleted: currentStageDateCompleted,
      completeTime: currentStageCompleteTime
    },
    dateAdded,
    status,
    dateForSale,
    dateSold,
    reconditionTime,
    forSaleTime,
    totalSellTime
  };
  return detailedVehicle;
}