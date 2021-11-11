import AutoFlowConnect from '../AutoFlowConnect';
import { Pool, ResultSetHeader } from 'mysql2/promise';
import { convertMysqlIdName, json } from '../MysqlUtilities';
import { PostExists, GetSuccess, PostSuccess } from '../../common/types/Results';
import { MysqlIdName } from '../mysqlTypes/MysqlMisc';
import { IdName } from '../../common/types/misc';

export async function createModelsTable(poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoFlowConnect().createPool();
  try {
    const query = `CREATE TABLE IF NOT EXISTS models (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      makeId INT,
      CONSTRAINT uc_all_fields UNIQUE(name))`;
    await pool.query(query);
  } finally {
    !poolParam && await pool.end();
  }
}

// INTERFACE EXPORTS
export async function getModelsMysql(makeId: string, poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoFlowConnect().createPool();
  try {
    const searchQuery = 'SELECT id, name FROM models WHERE makeId = ? ORDER BY name';
    const modelsTmp: MysqlIdName[] = json(await pool.execute(searchQuery, [makeId]))[0];
    const models = modelsTmp.map(model => convertMysqlIdName(model));
    return new GetSuccess(models);
  } finally {
    !poolParam && await pool.end();
  }
}

export async function addModelMysql(makeId: string, modelName: string, poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoFlowConnect().createPool();
  try {
    // check if model exists before inserting
    const existsQuery = 'SELECT name FROM models WHERE name = ? AND makeId = ?';
    const exists = json(await pool.execute(existsQuery, [modelName, parseInt(makeId)]))[0];
    if (exists.length >= 1) return new PostExists('model', modelName);
    const addModelQuery = 'INSERT INTO models(name, makeId) VALUES(?, ?)';
    const addModelResult = (await pool.execute(addModelQuery, [modelName, parseInt(makeId)]))[0];
    const insertedId = (addModelResult as ResultSetHeader).insertId;
    const addedModel: IdName = { id: insertedId.toString(), name: modelName };
    const models = (await getModelsMysql(makeId, pool)).data;
    return new PostSuccess(insertedId.toString(), addedModel, models);
  } finally {
    !poolParam && await pool.end();
  }
}