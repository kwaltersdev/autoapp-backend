export interface MysqlStageAssignment {
  id: number;
  dateAssigned: number;
  tasks: string; // comma seperated list
  vehicleId: number;
  stageId: number;
  stageName: string;
  personPlaceId: number;
  personPlaceName: string;
  status: 'complete' | 'incomplete';
  dateCompleted: number;
  completeTime: number;
}