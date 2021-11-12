import { StageSummary, StageVehicleCount, UpdatedStageOrder } from '../../common/types/Stage';
import { ResultSetHeader } from 'mysql2';
import { GetSuccess, PatchManyResult, PostExists, PostSuccess } from '../../common/types/Results';
import { MysqlStageSummary } from '../mysqlTypes/MysqlStage';
import AutoAppConnect from '../AutoAppConnect';
import { json, convertMysqlExportStage, convertMysqlStageSummary } from '../MysqlUtilities';
import { Pool } from 'mysql2/promise';

export async function createStagesTable(poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoAppConnect().createPool();
  try {
    const query = `CREATE TABLE IF NOT EXISTS stages (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      orderPosition INT NOT NULL,
      CONSTRAINT uc_all_fields UNIQUE( name, orderPosition))`;
    await pool.query(query);
  } finally {
    !poolParam && await pool.end();
  }
}

// INTERFACE EXPORTS  
export async function getStageVehicleCountsMysql(poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoAppConnect().createPool();
  try {
    const stagesTmp = (await getStagesMysql(pool)).data;
    const stageCounts: StageVehicleCount[] = [];
    for (let stage of stagesTmp) {
      const countQuery = `SELECT COUNT(id) AS count FROM vehicles WHERE status = 'active' AND currentStageStageId  = ?`;
      const count = json(await pool.execute(countQuery, [stage.id]))[0][0];
      stageCounts.push({ ...stage, ...count });
    }
    return new GetSuccess(stageCounts);
  } finally {
    !poolParam && await pool.end();
  }
}

export async function getStagesMysql(poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoAppConnect().createPool();
  try {
    const searchQuery = `SELECT * FROM stages ORDER BY orderPosition`;
    const stages: MysqlStageSummary[] = (json(await pool.execute(searchQuery)))[0];
    const result = stages.map(stage => convertMysqlStageSummary(stage));
    return new GetSuccess(result);
  } finally {
    !poolParam && await pool.end();
  }
}

export async function getPeoplePlacesMysql(stageId: string, poolParam?: Pool) {
  const id = parseInt(stageId);
  const detailedStage = await getExportStageMysql(id, poolParam);
  const peoplePlaces = detailedStage.peoplePlaces.sort((a, b) => {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });
  return new GetSuccess(peoplePlaces);
}

export async function addStageMysql(stageName: string, poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoAppConnect().createPool();
  try {
    // check if stage exists already
    const existsQuery = `SELECT name FROM stages WHERE name = ?`;
    const exists = json(await pool.execute(existsQuery, [stageName]))[0];
    if (exists.length >= 1) return new PostExists('name', stageName);
    let count;
    const countQuery = `SELECT COUNT(name) FROM stages`;
    const countTmp = json(await pool.execute(countQuery, [stageName]))[0][0]['COUNT(name)'];
    stageName === 'For Sale' ? count = 10000 : count = countTmp;
    const addStageQuery = `INSERT INTO stages(name, orderPosition) VALUES(?, ?)`;
    const addStageResult = (await pool.execute(addStageQuery, [stageName, count]))[0];
    const insertedId = (addStageResult as ResultSetHeader).insertId;
    const getStageQuery = `SELECT * FROM stages WHERE id = ?`;
    const insertedStage: StageSummary = convertMysqlStageSummary((json(await pool.execute(getStageQuery, [insertedId])))[0][0]);
    const stages = (await getStagesMysql(pool)).data;
    return new PostSuccess(insertedId.toString(), insertedStage, stages);
  } finally {
    !poolParam && await pool.end();
  }
}

export async function updateStageOrderMysql(updateStagesArray: UpdatedStageOrder[], poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoAppConnect().createPool();
  try {
    const stageUpdates = updateStagesArray.map(stage => {
      const updateQuery = `UPDATE stages SET orderPosition = ? WHERE id = ?`;
      return pool.execute(updateQuery, [stage.order, stage.id]);
    });
    const resultsTmp = await Promise.all(stageUpdates);
    const results = resultsTmp.map(result => json(result));
    const stagesTmp = await getStagesMysql(pool);
    return new PatchManyResult('success', results, stagesTmp.data);
  } finally {
    !poolParam && await pool.end();
  }
}

// HELPERS
export async function getExportStageMysql(stageId: number, poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoAppConnect().createPool();
  try {
    const stageInfoQuery = `SELECT * FROM stages WHERE id = ?`;
    const stageInfo = json(await pool.execute(stageInfoQuery, [stageId]))[0][0];
    const peoplePlacesQuery = `
      SELECT GROUP_CONCAT(CONCAT_WS('-', p.id, p.name)) AS peoplePlaces
      FROM stagePeoplePlacesJoin AS sp
      INNER JOIN peoplePlaces AS p ON sp.personPlaceId = p.id
      INNER JOIN stages AS s ON sp.stageId = s.id
      WHERE stageId = ?
      GROUP BY stageId`;
    const peoplePlaces = json(await pool.execute(peoplePlacesQuery, [stageId]))[0][0];
    const result = convertMysqlExportStage({
      ...stageInfo,
      peoplePlaces: peoplePlaces ? peoplePlaces.peoplePlaces : ''
    });
    return result;
  } finally {
    !poolParam && await pool.end();
  }
}