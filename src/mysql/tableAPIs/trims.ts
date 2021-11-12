import AutoAppConnect from "../AutoAppConnect";
import { Pool, ResultSetHeader } from 'mysql2/promise';
import { convertMysqlIdName, json } from "../MysqlUtilities";
import { MysqlIdName } from "../mysqlTypes/MysqlMisc";
import { IdName } from '../../common/types/misc';
import { GetSuccess, PatchSuccess, PostExists } from "../../common/types/Results";
import { ModelDoc } from "../../common/types/Vehicle";

export async function createTrimsTable(poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoAppConnect().createPool();
  try {
    const query = `CREATE TABLE IF NOT EXISTS trims (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      modelId INT)`;
    await pool.query(query);
  } finally {
    !poolParam && await pool.end();
  }
}

// INTERFACE EXPORTS
export async function getTrimsMysql(modelId: string, poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoAppConnect().createPool();
  try {
    const searchQuery = 'SELECT id, name FROM trims WHERE modelId = ? ORDER BY name';
    const trimsTmp: MysqlIdName[] = json(await pool.execute(searchQuery, [parseInt(modelId)]))[0];
    const trims = trimsTmp.map(trim => convertMysqlIdName(trim));
    return new GetSuccess(trims);
  } finally {
    !poolParam && await pool.end();
  }
}

export async function addTrimMysql(modelId: string, trim: string, poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoAppConnect().createPool();
  try {
    // check if trim exists before inserting
    const existsQuery = 'SELECT name FROM trims WHERE name = ? AND modelId = ?';
    const exists = json(await pool.execute(existsQuery, [trim, parseInt(modelId)]))[0];
    if (exists.length >= 1) return new PostExists('trim', trim);
    const addTrimQuery = 'INSERT INTO trims(name, modelId) VALUES(?, ?)';
    const addTrimResult = (await pool.execute(addTrimQuery, [trim, parseInt(modelId)]))[0];
    const insertedId = (addTrimResult as ResultSetHeader).insertId;
    const addedTrim: IdName = { id: insertedId.toString(), name: trim };
    const trims = (await getTrimsMysql(modelId, pool)).data;
    const modelQuery = 'SELECT * FROM models WHERE id = ?';
    const model: ModelDoc = {
      id: modelId,
      ...json(await pool.execute(modelQuery, [parseInt(modelId)]))[0][0],
      trims
    };
    return new PatchSuccess(modelId, addedTrim, model, trims);
  } finally {
    !poolParam && await pool.end();
  }
}