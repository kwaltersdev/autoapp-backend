import AutoFlowConnect from '../AutoFlowConnect';
import { Pool, ResultSetHeader } from 'mysql2/promise';
import { convertMysqlStageAssignment, json } from '../MysqlUtilities';
import { PostExists, GetSuccess, PostSuccess, Result, PatchSuccess } from '../../common/types/Results';
import { AddVehicleParam } from '../../common/types/Vehicle';
import { AssignStageParam, CurrentStageSummary, InitialStageParam } from '../../common/types/StageAssignment';
import { findVehicleMysql } from './vehicles';
import { addStagePersonPlaceMysql } from './stages-peoplePlaces-join';
import { findStageAssignmentMongo } from 'mongoDb/collectionAPIs/stageAssignments';
import { MysqlStageAssignment } from 'mysql/mysqlTypes/MysqlStageAssignment';

export async function createStageAssignmentsTable(poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoFlowConnect().createPool();
  try {
    const query = `CREATE TABLE IF NOT EXISTS stageAssignments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      dateAssigned BIGINT,
      tasks VARCHAR(5000), 
      vehicleId INT,
      stageId INT,
      stageName VARCHAR(255),
      personPlaceId INT,
      personPlaceName VARCHAR(255),
      status VARCHAR(255),
      dateCompleted BIGINT,
      completeTime BIGINT )`;
    await pool.query(query);
  } finally {
    !poolParam && await pool.end();
  }
}

export async function assignStageMysql(assignStageParam: AssignStageParam, previousStage?: CurrentStageSummary, initialAssignment = false, dateAddedParam?: number, poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoFlowConnect().createPool();
  try {
    const { vehicleId, dateAssigned, stage, personPlace, tasks: tasksTmp, dateForSale } = assignStageParam;
    //convert tasks from string to array
    const tasks = tasksTmp ? tasksTmp.join(', ') : '';
    let dateAdded: number; // for recondition time calculation
    if (initialAssignment) {
      if (dateAddedParam) { dateAdded = dateAddedParam; } else throw new Error(`missing 'dateAddedParam'`);
    } else {
      const vehicle = await findVehicleMysql('id', vehicleId, pool);
      dateAdded = vehicle.data.dateAdded;
    }
    // we determine if we need a dateForSale and reconditionTime values
    // for our vehicleUpdate, and what they should be
    let dateForSaleTmp = 0;
    let reconditionTime = 0;
    if (stage.name === 'For Sale') {
      if (dateForSale) {
        dateForSaleTmp = dateForSale;
        reconditionTime = dateForSale - dateAdded;
      } else {
        dateForSaleTmp = dateAssigned;
        reconditionTime = dateAssigned - dateAdded;
      };
    };
    // FIX ME need to complete stage if teh previous stage was 'assign'
    if (previousStage?.stage.name === 'Assign') {
      await completeStageAssignmentMysql(previousStage.id, Date.now(), pool);
    }
    const insertQuery = `INSERT INTO stageAssignments(dateAssigned, tasks, vehicleId, stageId, stageName, personPlaceId, personPlaceName, status)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?)`;
    const insertResult = (await pool.execute(insertQuery, [dateAssigned, tasks, vehicleId, stage.id, stage.name, personPlace.id, personPlace.name, 'incomplete']))[0];
    const stageAssignmentId = (insertResult as ResultSetHeader).insertId;
    const updateVehicleQuery = `UPDATE vehicles 
      SET currentStageAssignmentId = ?, currentStageStageId = ?, currentStagePersonPlaceId = ?,
        dateAdded = ?, dateForSale = ?, reconditionTime = ?
      WHERE id = ?`;
    await pool.execute(updateVehicleQuery, [stageAssignmentId, stage.id, personPlace.id, dateAdded, dateForSaleTmp, reconditionTime, vehicleId]);
    const vehicle = await findVehicleMysql('id', vehicleId, pool);
    // checks if the personPlace has ever been assigned to this stage, if not it adds it to the stages-peoplePlaces-join table
    await addStagePersonPlaceMysql(stage.id, personPlace.id, pool);
    return new PostSuccess(stageAssignmentId.toString(), vehicle.data);
  } finally {
    !poolParam && await pool.end();
  }
}

export async function findStageAssignmentMysql(stageAssignmentId: string, poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoFlowConnect().createPool();
  try {
    const query = `SELECT * FROM stageAssignments WHERE id = ?`;
    const stageAssignmentTmp = json(await pool.execute(query, [parseInt(stageAssignmentId)]))[0][0];
    const stageAssignment = convertMysqlStageAssignment(stageAssignmentTmp);
    return new GetSuccess(stageAssignment);
  } finally {
    !poolParam && pool.end();
  }
}

// FIXME do we really need this?
export async function updateStageAssignmentMysql(stageAssignmentId: String, poolParam?: Pool) { }

export async function completeStageAssignmentMysql(stageAssignmentId: string, dateCompleted: number, poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoFlowConnect().createPool();
  try {
    const stageAssignment = await findStageAssignmentMysql(stageAssignmentId, pool);
    const completeTime = dateCompleted - stageAssignment.data.dateAssigned;
    const updateQuery = `UPDATE stageAssignments SET status = 'complete', dateCompleted = ?, completeTime = ? WHERE id = ?`;
    await pool.execute(updateQuery, [dateCompleted, completeTime, parseInt(stageAssignmentId)]);
    const updatedStageAssignment = await findStageAssignmentMysql(stageAssignmentId, pool);
    const updateDoc = { status: 'complete', dateCompleted, completeTime };
    let updatedVehicle;
    if (stageAssignment.data.stage.name !== 'Assign') updatedVehicle = await findVehicleMysql('id', updatedStageAssignment.data.vehicleId, pool);
    return new PatchSuccess(stageAssignmentId, updateDoc, updatedStageAssignment.data, updatedVehicle?.data);
  } finally {
    !poolParam && pool.end();
  }
}

export async function getAllStageAssignmentsMysql(poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoFlowConnect().createPool();
  try {
    const query = `SELECT * FROM stageAssignments WHERE status = 'complete'`;
    const mysqlAssignments: MysqlStageAssignment[] = json(await pool.execute(query))[0];
    const stageAssignments = mysqlAssignments.map(stageAssignment => convertMysqlStageAssignment(stageAssignment));
    return new GetSuccess(stageAssignments);
  } finally {
    !poolParam && pool.end();
  }
}

export async function getStageHistoryMysql(vehicleId: string, poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoFlowConnect().createPool();
  try {
    const query = `SELECT * FROM stageAssignments WHERE vehicleId = ?`;
    const mysqlAssignments: MysqlStageAssignment[] = json(await pool.execute(query, [parseInt(vehicleId)]))[0];
    const stageAssignments = mysqlAssignments.map(stageAssignment => convertMysqlStageAssignment(stageAssignment));
    return new GetSuccess(stageAssignments);
  } finally {
    !poolParam && pool.end();
  }
}
