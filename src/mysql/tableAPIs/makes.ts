import { GetSuccess, PostExists, PostSuccess } from '../../common/types/Results';
import { Pool, ResultSetHeader } from 'mysql2/promise';
import AutoFlowConnect from '../AutoFlowConnect';
import { json, convertMysqlIdName } from '../MysqlUtilities';
import { MysqlIdName } from 'mysql/mysqlTypes/MysqlMisc';
import { IdName } from 'common/types/misc';

export async function createMakesTable(poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoFlowConnect().createPool();
  try {
    const query = `CREATE TABLE IF NOT EXISTS makes (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      CONSTRAINT uc_all_fields UNIQUE(name))`;
    await pool.query(query);
  } finally {
    !poolParam && await pool.end();
  }
}

// INTERFACE EXPORTS 
export async function getMakesMysql(poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoFlowConnect().createPool();
  try {
    const searchQuery = 'SELECT * FROM makes ORDER BY  name';
    const makes: MysqlIdName[] = (json(await pool.execute(searchQuery)))[0];
    const result = makes.map(make => convertMysqlIdName(make));
    return new GetSuccess(result);
  } finally {
    !poolParam && await pool.end();
  }
}

export async function addMakeMysql(makeName: string, poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoFlowConnect().createPool();
  try {
    // check if make already exists before inserting
    const existsQuery = 'SELECT name FROM makes WHERE name = ?';
    const exists = json(await pool.execute(existsQuery, [makeName]))[0];
    if (exists.length >= 1) return new PostExists('make', makeName);
    const addMakeQuery = 'INSERT INTO makes(name) VALUES(?)';
    const addMakeResult = (await pool.execute(addMakeQuery, [makeName]))[0];
    const insertedId = (addMakeResult as ResultSetHeader).insertId;
    const getMakeQuery = 'SELECT * FROM makes WHERE id = ?';
    const insertedMake: IdName = convertMysqlIdName((json(await pool.execute(getMakeQuery, [insertedId])))[0][0]);
    const makes = (await getMakesMysql(pool)).data;
    return new PostSuccess(insertedId.toString(), insertedMake, makes);
  } finally {
    !poolParam && pool.end();
  }
}


