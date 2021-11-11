import { StageAssignment, AssignStageParam, CurrentStageSummary } from '../../types/StageAssignment';
import { StageSummary, ExportStage, UpdatedStageOrder, StageVehicleCount, PersonPlaceVehicleCount } from '../../types/Stage';
import { GetSuccess, PostSuccess, PostExists, PatchSuccess, PatchManyResult } from '../../types/Results';
import { IdName } from '../../types/misc';
import { DetailedVehicle } from '../../types/Vehicle';

export interface StageEndpointsInterface {
  getStageVehicleCounts(connection?: unknown): Promise<GetSuccess<StageVehicleCount[]>>;
  getPersonPlaceVehicleCounts(connection?: unknown): Promise<GetSuccess<PersonPlaceVehicleCount[]>>;
  assignStage(stageParam: AssignStageParam, previousStage?: CurrentStageSummary, initialAssignment?: boolean, dateAddedParam?: number, connection?: unknown): Promise<PostSuccess<DetailedVehicle>>;
  findStageAssignment(stageAssignmentId: string, connection?: unknown): Promise<GetSuccess<StageAssignment>>;
  completeStageAssignment(stageAssignmentId: string, dateCompleted: number, connection?: unknown): Promise<PatchSuccess<object, StageAssignment, DetailedVehicle>>;
  getAllStageAssignments(connection?: unknown): Promise<GetSuccess<StageAssignment[]>>;
  getStageHistory(vehicleId: string, connection?: unknown): Promise<GetSuccess<StageAssignment[]>>;
  getStages(connection?: unknown): Promise<GetSuccess<StageSummary[]>>;
  addStage(stage: string, connection?: unknown): Promise<PostSuccess<StageSummary, StageSummary[]> | PostExists>;
  getPeoplePlaces(stageId: string, connection?: unknown): Promise<GetSuccess<IdName[]>>;
  updateStageOrder(updatedStagesArray: UpdatedStageOrder[], connection?: unknown): Promise<PatchManyResult<StageSummary[]>>;
  addStagePersonPlace(stageId: string, personPlaceId: string, connection?: unknown): Promise<PatchSuccess<object, ExportStage, IdName[]>>;
  getAllPeoplePlaces(connection?: unknown): Promise<GetSuccess<IdName[]>>;
  addPersonPlace(stageId: string, personPlace: string, connection?: unknown): Promise<PostSuccess<IdName, { peoplePlaces: IdName[] | undefined, allPeoplePlaces: IdName[]; }> | PostExists>;
}