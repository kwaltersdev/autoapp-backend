import AutoAppConnect from '../AutoAppConnect';
import { getExportStageMysql } from './stages';
import { json } from '../MysqlUtilities';
import { PatchSuccess } from '../../common/types/Results';
import { Pool } from 'mysql2/promise';

export async function createStagesPeoplePlacesTable(poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoAppConnect().createPool();
  try {
    // ID column is a concatination of [stageId][personPlaceId]. Each will be unique
    const query = `CREATE TABLE IF NOT EXISTS stagePeoplePlacesJoin (
    id VARCHAR(255) PRIMARY KEY,
    stageId INT NOT NULL,
    personPlaceId INT NOT NULL)`;
    await pool.query(query);
  } finally {
    !poolParam && await pool.end();
  }
}

export async function addStagePersonPlaceMysql(stageId: string, personPlaceId: string, poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoAppConnect().createPool();
  try {
    // make sure stage exists
    const existsQuery = 'SELECT name FROM stages WHERE id = ?';
    const exists = json(await pool.execute(existsQuery, [parseInt(stageId)]))[0];
    if (exists.length < 1) throw new Error(`the 'stage' provided does not exist`);
    // check if stage already includes personPlace before updating doc
    const id = stageId + '-' + personPlaceId;
    const includesQuery = 'SELECT id FROM stagePeoplePlacesJoin WHERE id = ?';
    const includes = json(await pool.execute(includesQuery, [id]))[0];
    if (includes.length < 1) {
      const insertQuery = `INSERT INTO stagePeoplePlacesJoin (id, stageId, personPlaceId) values(?, ?, ?)`;
      await pool.execute(insertQuery, [id, parseInt(stageId), parseInt(personPlaceId)]);
    };
    // if stage already includes personPlace, we don't need to take any action
    // vecause or result will still be the same
    const updatedStage = await getExportStageMysql(parseInt(stageId), pool);
    return new PatchSuccess(stageId, updatedStage.peoplePlaces, updatedStage, updatedStage.peoplePlaces);
  } finally {
    !poolParam && await pool.end();
  }
}