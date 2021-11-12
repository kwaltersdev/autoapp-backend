import { ResultSetHeader } from 'mysql2';
import { Pool } from 'mysql2/promise';
import { GetSuccess, PostExists, PostSuccess } from '../../common/types/Results';
import { IdName } from '../../common/types/misc';
import { MysqlIdName } from '../mysqlTypes/MysqlMisc';
import AutoAppConnect from '../AutoAppConnect';
import { convertMysqlIdName, json } from '../MysqlUtilities';
import { addStagePersonPlaceMysql } from './stages-peoplePlaces-join';
import { PersonPlaceVehicleCount } from 'common/types/Stage';

export async function createPeoplePlacesTable(poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoAppConnect().createPool();
  try {
    const query = `CREATE TABLE IF NOT EXISTS peoplePlaces (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      CONSTRAINT uc_all_fields UNIQUE(name))`;
    await pool.execute(query);
  } finally {
    !poolParam && await pool.end();
  }
}

// INTERFACE EXPORTS
export async function getPersonPlaceVehicleCountsMysql(poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoAppConnect().createPool();
  try {
    const peoplePlacesTmp = (await getAllPeoplePlacesMysql(pool)).data;
    const peoplePlacesCounts: PersonPlaceVehicleCount[] = [];
    for (let personPlace of peoplePlacesTmp) {
      const countQuery = `SELECT COUNT (id) AS count FROM vehicles WHERE status = 'active' AND currentStagePersonPlaceId = ?`;
      const count = json(await pool.execute(countQuery, [personPlace.id]))[0][0];
      peoplePlacesCounts.push({ ...personPlace, ...count });
    }
    return new GetSuccess(peoplePlacesCounts);
  } finally {
    !poolParam && await pool.end();
  }
}

export async function getAllPeoplePlacesMysql(poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoAppConnect().createPool();
  try {
    const peoplePlacesQuery = `SELECT * FROM peoplePlaces ORDER BY name`;
    const peoplePlacesTmp: MysqlIdName[] = json(await pool.execute(peoplePlacesQuery))[0];
    const peoplePlaces: IdName[] = peoplePlacesTmp.map(personPlace => convertMysqlIdName(personPlace));
    return new GetSuccess(peoplePlaces);
  } finally {
    !poolParam && await pool.end();
  }
}

export async function addPersonPlaceMysql(stageId: string, personPlace: string, poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoAppConnect().createPool();
  try {
    // check if personPlace already exists
    const existsQuery = `SELECT name from peoplePlaces WHERE name = ?`;
    const exists = json(await pool.execute(existsQuery, [personPlace]))[0];
    if (exists.length >= 1) return new PostExists('name', personPlace);
    const addPersonPlaceQuery = `INSERT INTO peoplePlaces(name) VALUES (?)`;
    const addPersonPlaceResult = (await pool.execute(addPersonPlaceQuery, [personPlace]))[0];
    const insertedId = (addPersonPlaceResult as ResultSetHeader).insertId;
    const allPeoplePlacesTmp = getAllPeoplePlacesMysql(pool);
    const newPersonPlaceTmp = addStagePersonPlaceMysql(stageId, insertedId.toString(), pool);
    const [allPeoplePlaces, newPersonPlace] = await Promise.all([allPeoplePlacesTmp, newPersonPlaceTmp]);
    return new PostSuccess(
      insertedId.toString(),
      { id: insertedId.toString(), name: personPlace },
      { peoplePlaces: newPersonPlace?.data, allPeoplePlaces: allPeoplePlaces.data }
    );
  } finally {
    !poolParam && await pool.end();
  }
}

