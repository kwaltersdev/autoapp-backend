import { MongoAssignStageParam } from './MongoStageAssignment';

export const mongoCheckAssignStageParam = (stageAssignmentParam: MongoAssignStageParam) => {
  const { vehicleId, stage, personPlace, tasks, dateAssigned } = stageAssignmentParam;
  if (!vehicleId || !stage || !personPlace || !tasks || !dateAssigned) {
    throw new Error('Missing required stage assignment parameters');
  }
  if (typeof vehicleId !== 'string' && typeof vehicleId !== 'object') {
    if (
      typeof stage !== 'string' ||
      typeof personPlace !== 'string' ||
      typeof tasks !== 'object' ||
      typeof dateAssigned !== 'number'
    ) {
      throw new Error('One or more stage assignment parameters are of the wrong type');
    }
  }
  return;
};