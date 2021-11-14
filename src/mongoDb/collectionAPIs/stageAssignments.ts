import AutoAppClient, { AutoAppConnection } from '../AutoAppClient';
import { AssignStageParam, CurrentStageSummary } from '../../common/types/StageAssignment';
import { GetSuccess, PostSuccess, PatchSuccess } from '../../common/types/Results';
import { MongoBaseStageAssignment, MongoAssignStageParam } from '../mongoTypes/MongoStageAssignment';
import { ObjectId } from 'mongodb';
import { mongoCheckAssignStageParam } from '../mongoTypes/mongoTypeChecks';
import { handleIdParam, convertMongoStageAssignment } from '../mongoUtilities';
import { updateVehicleDocMongo, findVehicleMongo } from './vehicles';
import { addStagePersonPlaceMongo } from './stages';
import { DetailedVehicle } from 'common/types/Vehicle';

// INTERFACE EXPORTS
export async function assignStageMongo(assignStageParam: AssignStageParam | MongoAssignStageParam, previousStage?: CurrentStageSummary, initialAssignment = false, dateAddedParam?: number, connectionParam?: AutoAppConnection) {
  const { stage, personPlace, dateAssigned, vehicleId, dateForSale } = assignStageParam;
  let dateAdded: number; // for recondition time calculation
  if (initialAssignment) {
    if (dateAddedParam) {
      dateAdded = dateAddedParam;
    } else {
      throw new Error(`missing 'dateAddedParam'`);
    };
  } else {
    const vehicle = await findVehicleMongo('id', vehicleId, connectionParam) as GetSuccess<DetailedVehicle>;
    dateAdded = vehicle.data.dateAdded;
  };
  // we determine if we need a dateForSale and reconditionTime values
  // for our vehicleUpdate, and what they should be
  let dateForSaletmp = 0;
  let reconditionTime = 0;
  if (stage.name === 'For Sale') {
    if (dateForSale) {
      dateForSaletmp = dateForSale;
      reconditionTime = dateForSale - dateAdded;
    } else {
      dateForSaletmp = dateAssigned;
      reconditionTime = dateAssigned - dateAdded;
    };
  };
  // If the previous stage was 'assign' we complete it
  if (previousStage?.stage.name === 'Assign') {
    completeStageAssignmentMongo(previousStage.id, Date.now(), connectionParam);
  };
  const stageAssignmentId = await writeStageAssignmentDocMongo(assignStageParam, connectionParam);
  const currentStage = { stageAssignmentId, stageId: stage.id, personPlaceId: personPlace.id };
  const vehicleUpdate = { currentStage, dateAdded, dateForSale: dateForSaletmp, reconditionTime };
  const updatedVehicle = await updateVehicleDocMongo(vehicleId, vehicleUpdate, connectionParam);
  // checks if the personPlace has ever been assigned to this stage, if not it adds it to its array to be remembered
  await addStagePersonPlaceMongo(stage.id, personPlace.id, connectionParam);
  return new PostSuccess(stageAssignmentId.toHexString(), updatedVehicle.doc);
};

export async function findStageAssignmentMongo(stageId: string | ObjectId, connectionParam?: AutoAppConnection) {
  const client = new AutoAppClient();
  try {
    const connection = connectionParam ? connectionParam : await client.connect();
    const { stageAssignments } = connection;
    const stageIdtmp = handleIdParam(stageId);
    const mongoStageAssignment = await stageAssignments.findOne({ _id: stageIdtmp });
    const stageAssignment = convertMongoStageAssignment(mongoStageAssignment);
    return new GetSuccess(stageAssignment);
  } finally {
    !connectionParam && await client.close();
  }
};

export async function completeStageAssignmentMongo(stageAssignmentId: string, dateCompleted: number, connectionParam?: AutoAppConnection) {
  const stageAssignment = await findStageAssignmentMongo(stageAssignmentId, connectionParam);
  const completeTime = dateCompleted - stageAssignment.data.dateAssigned;
  const updateDoc = { status: 'complete', dateCompleted, completeTime };
  const updatedStageAssignment = await updateStageAssignmentMongo(stageAssignmentId, updateDoc, connectionParam);
  let updatedVehicle;
  if (stageAssignment.data.stage.name !== 'Assign') {
    updatedVehicle = await findVehicleMongo('id', updatedStageAssignment.doc.vehicleId, connectionParam) as GetSuccess<DetailedVehicle>;
  }
  return new PatchSuccess(stageAssignmentId, updateDoc, updatedStageAssignment.doc, updatedVehicle?.data);
};

export async function getAllStageAssignmentsMongo(connectionParam?: AutoAppConnection) {
  const client = new AutoAppClient();
  try {
    const connection = connectionParam ? connectionParam : await client.connect();
    const { stageAssignments } = connection;
    const mongoAssignments = await stageAssignments.find({ status: 'complete' }).toArray();
    const stageAssignmentstmp = mongoAssignments.map(assignment => convertMongoStageAssignment(assignment));
    return new GetSuccess(stageAssignmentstmp);
  } finally {
    !connectionParam && await client.connect();
  }
}

export async function getStageHistoryMongo(vehicleId: string | ObjectId, connectionParam?: AutoAppConnection) {
  const client = new AutoAppClient();
  try {
    const connection = connectionParam ? connectionParam : await client.connect();
    const { stageAssignments } = connection;
    const vehicleIdtmp = handleIdParam(vehicleId);
    const mongoAssignments = await stageAssignments.find({ vehicleId: vehicleIdtmp }).toArray();
    const stageAssignmentstmp = mongoAssignments.map(assignment => convertMongoStageAssignment(assignment));
    return new GetSuccess(stageAssignmentstmp);
  } finally {
    !connectionParam && await client.close();
  }
};

// HELPERS
export async function writeStageAssignmentDocMongo(assignStageParam: MongoAssignStageParam, connectionParam?: AutoAppConnection) {
  const client = new AutoAppClient();
  try {
    const connection = connectionParam ? connectionParam : await client.connect();
    const { stageAssignments } = connection;
    // typecheck 'assignStageParam'
    mongoCheckAssignStageParam(assignStageParam);
    // we create our stageAssignment doc
    const stageAssignmenttmp: any = {
      ...assignStageParam,
      status: 'incomplete',
      dateCompleted: 0,
      completeTime: 0,
    };
    // we convert stageAssignment.vehicleId from type 'string' to 'ObjectId'
    delete stageAssignmenttmp.vehicleId;
    const { vehicleId } = assignStageParam;
    const vehicleIdtmp = handleIdParam(vehicleId);
    const stageAssignment: MongoBaseStageAssignment = { vehicleId: vehicleIdtmp, ...stageAssignmenttmp };

    const response = await stageAssignments.insertOne(stageAssignment);
    const insertedId: ObjectId = response.insertedId;
    return insertedId;
  } finally {
    !connectionParam && await client.close();
  }
};

async function updateStageAssignmentMongo(stageAssignmentId: string | ObjectId, update: object, connectionParam?: AutoAppConnection) {
  const client = new AutoAppClient();
  try {
    const connection = connectionParam ? connectionParam : await client.connect();
    const { stageAssignments } = connection;
    const updateId = handleIdParam(stageAssignmentId);
    const result = await stageAssignments.updateOne({ _id: updateId }, { $set: update });
    if (result.result.ok !== 1) throw new Error('Failed to update stageAssignment document');
    const updatedStageAssignment = await findStageAssignmentMongo(stageAssignmentId, connection);
    return new PatchSuccess(updateId.toHexString(), update, updatedStageAssignment.data);
  } finally {
    !connectionParam && await client.close();
  }
};