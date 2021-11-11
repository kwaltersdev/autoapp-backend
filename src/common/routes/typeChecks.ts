import { AddVehicleParam } from '../types/Vehicle';
import { InitialStageParam, AssignStageParam } from '../types/StageAssignment';
import { UpdatedStageOrder } from '../types/Stage';

export const checkAddVehicleParam = (addVehicleParam: AddVehicleParam) => {
  const { stock, year, make, model, trim, notes, dateAdded } = addVehicleParam;
  if (!year || !make || !model || !trim || addVehicleParam.hasOwnProperty(notes) || !dateAdded) {
    throw new Error('Missing required vehicle parameters');
  }
  if (
    typeof stock !== 'number' ||
    typeof year !== 'number' ||
    typeof make.name !== 'string' || typeof make.id !== 'string' ||
    typeof model.name !== 'string' || typeof model.id !== 'string' ||
    typeof trim.name !== 'string' || typeof trim.id !== 'string' ||
    typeof notes !== 'string' ||
    typeof dateAdded !== 'number'
  ) {
    throw new Error('One or more vehicle parameters are of the wrong type');
  }
  return;
};

export const checkInitialStageParam = (initialStageParam: InitialStageParam) => {
  const { stage, personPlace, tasks } = initialStageParam;
  if (!stage || !personPlace || !tasks) {
    throw new Error('Missing required initial stage assignment parameters');
  }
  if (
    typeof stage.name !== 'string' || typeof stage.id !== 'string' ||
    typeof personPlace.name !== 'string' || typeof personPlace.id !== 'string' ||
    typeof tasks !== 'object'
  ) {
    throw new Error('One or more initial stage assignment parameters are of the wrong type');
  }
  return;
};

export const checkAssignStageParam = (assignStageParam: AssignStageParam) => {
  const { vehicleId, stage, personPlace, tasks, dateAssigned } = assignStageParam;
  if (!vehicleId || !stage || !personPlace || !tasks || !dateAssigned) {
    throw new Error('Missing required stage assignment parameters');
  }
  if (
    typeof vehicleId !== 'string' ||
    typeof stage.name !== 'string' || typeof stage.id !== 'string' ||
    typeof personPlace.name !== 'string' || typeof personPlace.id !== 'string' ||
    typeof tasks !== 'object' ||
    typeof dateAssigned !== 'number'
  ) {
    throw new Error('One or more stage assignment parameters are of the wrong type');
  }
  return;
};

export const checkUpdateStageOrderParam = (updates: UpdatedStageOrder[]) => {
  updates.forEach(update => {
    const { id, order } = update;
    if (!id || !order) {
      throw new Error('Missing required update stage order parameters');
    }
    if (
      typeof id !== 'string' ||
      typeof order !== 'number'
    ) {
      throw new Error('One or more update stage order parameters are of the wrong type');
    }
  });
};