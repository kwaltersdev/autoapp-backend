import AutoAppConnect from '../AutoAppConnect';
import { Pool, ResultSetHeader } from 'mysql2/promise';
import { convertMysqlDetailedVehicle, convertMysqlVehicle, json } from '../MysqlUtilities';
import { PostExists, GetSuccess, PostSuccess, PatchSuccess, DeleteSuccess } from '../../common/types/Results';
import { DetailedVehicle, GetVehiclesQuery, AddVehicleParam, CheckStock, NextStock, VehicleStatus, VehicleUpdate, VehiclePage } from '../../common/types/Vehicle';
import { InitialStageParam } from '../../common/types/StageAssignment';
import { assignStageMysql, completeStageAssignmentMysql } from './stageAsignments';
import { MysqlDetailedVehicle, MysqlVehicle } from 'mysql/mysqlTypes/MysqVehicle';
import { ListOrder, Page } from 'common/types/misc';

export async function createVehiclesTable(poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoAppConnect().createPool();
  try {
    const query = `CREATE TABLE IF NOT EXISTS vehicles (
      id INT PRIMARY KEY AUTO_INCREMENT,
      stock INT,
      year INT,
      makeId INT,
      makeName VARCHAR(255),
      modelId INT,
      modelName VARCHAR(255),
      trimId INT,
      trimName VARCHAR(255),
      notes VARCHAR(255),
      currentStageAssignmentId INT,
      currentStageStageId INT,
      currentStagePersonPlaceId INT,
      dateAdded BIGINT,
      status VARCHAR(255),
      dateForSale BIGINT,
      dateSold BIGINT,
      reconditionTime BIGINT,
      forSaleTime BIGINT,
      totalSellTime BIGINT,
      CONSTRAINT uc_stock UNIQUE(stock))`;
    await pool.query(query);
  } finally {
    !poolParam && await pool.end();
  }
}

// INTERFACE EXPORTS
export async function getVehiclesPagedMysql(status: VehicleStatus, sort: ListOrder, perPage: number, page: Page, compare: number, query: GetVehiclesQuery, poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoAppConnect().createPool();
  try {
    // MAIN STATUS QUERY
    // our  queyr arrays start with the top level match query for status
    const statusQuery = `v.status = ?`;
    // const whereQueries: string[] = [statusQuery];
    // const whereValues: [VehicleStatus | string | number] = [status];

    // QUERY FILTERS
    const filterQueries: string[] = [];
    const filterValues: (string | number)[] = [];
    // unless otherwise stated, in most cases we do not want to see 'For Sale' vehicles. The other conditions in this IF statement are those cases where we DO want to see them
    if (query.forSale !== 'true' && status !== 'sold' && status !== 'trash' && !query.stageId && !query.personPlaceId) {
      const forSaleId = json(await pool.execute(`SELECT id FROM stages WHERE name = 'For Sale'`))[0][0].id;
      filterQueries.push('currentStageStageId <> ?');
      filterValues.push(forSaleId);
    }
    if (query.year) { filterQueries.push('year = ?'); filterValues.push(query.year); }
    const makeTmp = query.make && query.make.split('-')[1]; // gets just the 'id' from the query
    if (makeTmp) { filterQueries.push('makeId = ?'); filterValues.push(makeTmp); }
    const modelTmp = query.model && query.model.split('-')[1]; // gets just the 'id' from the query
    if (modelTmp) { filterQueries.push('modelId = ?'); filterValues.push(modelTmp); }
    const trimTmp = query.trim && query.trim.split('-')[1]; // gets just the 'id' from the query
    if (trimTmp) { filterQueries.push('trimId = ?'); filterValues.push(trimTmp); }
    if (query.addedAfter) { filterQueries.push('dateAdded >= ?'); filterValues.push(query.addedAfter); }
    if (query.addedBefore) { filterQueries.push('dateAdded <= ?'); filterValues.push(query.addedBefore); }
    if (query.soldAfter) { filterQueries.push('dateSold >= ?'); filterValues.push(query.soldAfter); }
    if (query.soldBefore) { filterQueries.push('dateSold <= ?'); filterValues.push(query.soldBefore); }
    if (query.stageId) { filterQueries.push('currentStageStageId = ?'); filterValues.push(query.stageId); }
    if (query.personPlaceId) { filterQueries.push('currentStagePersonPlaceId = ?'); filterValues.push(query.personPlaceId); }


    // PAGINATION
    const paginationQueries: string[] = [];
    const paginationValues: (string | number)[] = [];
    if (sort === 'asc') {
      if (page === 'next') {
        paginationQueries.push('dateAdded > ? ');
      } else if (page === 'prev') {
        paginationQueries.push('dateAdded < ?');
      } else {
        paginationQueries.push('dateAdded > ?');
      }
      paginationValues.push(compare);
    } else if (sort === 'desc') {
      if (page === 'next') {
        paginationQueries.push('dateAdded < ?');
      } else if (page === 'prev') {
        paginationQueries.push('dateAdded > ?');
      } else {
        paginationQueries.push('dateAdded > ?');
      }
      paginationValues.push(compare);
    }
    const sortQuery = sort === 'asc'
      ? (page === 'first' || page === 'next')
        ? 'ORDER BY dateAdded ASC'
        : 'ORDER BY dateAdded DESC'
      : (page === 'last' || page === 'prev')
        ? 'ORDER BY dateAdded ASC'
        : 'ORDER BY date added DESC';
    // our limit has to adjust for the last page
    const countQuery = `SELECT COUNT(id) AS count FROM vehicles WHERE status = ? ${filterQueries.length > 0 ? `AND ${filterQueries.join(' AND ')}` : ''}`;
    const totalDocs = json(await pool.execute(countQuery, [status, ...filterValues]))[0][0].count;
    const lastPagePerPage = totalDocs - (Math.floor(totalDocs / perPage) * perPage);
    const limitTmp = page === 'last' ? lastPagePerPage ? lastPagePerPage : perPage : perPage;
    const limitQuery = `LIMIT ${limitTmp}`;

    // QUERY
    const allQueries = [statusQuery, ...filterQueries, ...paginationQueries];
    const whereQueryString = allQueries.join(' AND ');
    const mainQuery = `
      SELECT v.id as id, stock, year, makeId, makeName, modelId, modelName, trimId, trimName, notes,
        currentStageAssignmentId, 
        dateAssigned as currentStageDateAssigned,
        tasks as currentStageTasks,
        currentStageStageId, 
        stageName as currentStageStageName, 
        currentStagePersonPlaceId, 
        personPlaceName as currentStagePersonPlaceName, 
        sa.status as currentStageStatus,
        dateCompleted as currentStageDateCompleted,
        completeTime as currentStageCompleteTime,
        dateAdded, v.status, dateForSale, dateSold, reconditionTime, forSaleTime, totalSellTime
      FROM vehicles as v
      INNER JOIN stageAssignments as sa ON sa.id = v.currentStageAssignmentId
      WHERE ${whereQueryString}
      ${sortQuery}
      ${limitQuery}       
    `;

    const mysqlVehicles: MysqlDetailedVehicle[] = json(await pool.execute(mainQuery, [status, ...filterValues, ...paginationValues]))[0];
    const vehiclesTmp = mysqlVehicles.map(vehicle => convertMysqlDetailedVehicle(vehicle));
    // we have to reverse the array if we chose 'last' or 'prev' becasue we had to switch the order in our sortQuery. we are now switching the order back
    const vehiclesReturn = (page === 'last' || page === 'prev') ? vehiclesTmp.reverse() : vehiclesTmp;

    // PAGE DETAILS
    const returnedDocs = mysqlVehicles.length;
    // count of the documents that go before the start of the page
    const dateAddedComparison = sort === 'asc'
      ? page === 'next'
        ? 'dateAdded <= ?'
        : page === 'prev'
          ? 'dateAdded < ?'
          : ''
      : page === 'next'
        ? 'dateAdded >= ?'
        : page === 'prev'
          ? 'dateAdded > ?'
          : '';
    const priorDocCountQuery = `SELECT COUNT(id) AS count FROM vehicles WHERE status = ? AND ${dateAddedComparison} ${filterQueries.length > 0 ? `AND ${filterQueries.join(' AND ')}` : ''}`;
    const priorDocCount = page === 'first'
      ? 0
      : page === 'last'
        ? totalDocs - returnedDocs
        : page === 'next'
          ? json(await pool.execute(priorDocCountQuery, [status, compare, ...filterValues]))[0][0].count
          : json(await pool.execute(priorDocCountQuery, [status, compare, ...filterValues]))[0][0].count - perPage;

    const docStartNumber = !totalDocs ? 0 : priorDocCount + 1;
    const docEndNumber = priorDocCount + returnedDocs;
    const pageDetails = { docStartNumber, docEndNumber, totalDocs };
    return new GetSuccess(new VehiclePage(pageDetails, vehiclesReturn));


  } finally {
    !poolParam && await pool.end();
  }
}

export async function getVehiclesByStatusMysql(statusParams: string[], poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoAppConnect().createPool();
  try {
    // define explicitly to protect from SQL injection attacks
    const active = statusParams.includes('active') ? 'active' : '';
    const sold = statusParams.includes('sold') ? 'sold' : '';
    const trash = statusParams.includes('trash') ? 'trash' : '';
    const vehiclesQuery = `SELECT * FROM vehicles WHERE status IN (?, ?, ?)`;
    const vehiclesTmp: MysqlVehicle[] = json(await pool.execute(vehiclesQuery, [active, sold, trash]))[0];
    const vehicles = vehiclesTmp.map(vehicle => convertMysqlVehicle(vehicle));
    return new GetSuccess(vehicles);
  } finally {
    !poolParam && await pool.end();
  }
}

export async function getNextStockMysql(poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoAppConnect().createPool();
  try {
    const nextStockQuery = `SELECT MAX(stock) AS stock FROM vehicles`;
    const nextStockTmp = json(await pool.execute(nextStockQuery))[0][0].stock;
    const nextStock: NextStock = { nextStock: nextStockTmp ? nextStockTmp + 1 : 21001 };
    return new GetSuccess(nextStock);
  } finally {
    !poolParam && await pool.end();
  }
}

export async function checkStockMysql(stock: string, poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoAppConnect().createPool();
  try {
    if (parseInt(stock) === 0) return new GetSuccess({ exists: false });
    let checkStock: CheckStock = { exists: false };
    const query = `SELECT stock FROM vehicles WHERE stock = ?`;
    const result = json(await pool.execute(query, [parseInt(stock)]))[0];
    if (result.length >= 1) checkStock = { exists: true, id: result };
    return new GetSuccess(checkStock);
  } finally {
    !poolParam && await pool.end();
  }
}

export async function addVehicleMysql(vehicleParam: AddVehicleParam, initialStageParam: InitialStageParam, poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoAppConnect().createPool();
  try {
    const { stock, year, make, model, trim, notes, dateAdded } = vehicleParam;
    // check if stock # is already in use
    const stockCheck = await checkStockMysql(stock.toString(), pool);
    if (stockCheck.data.exists) return new PostExists('stock', vehicleParam.stock.toString());
    const addVehicleQuery = `INSERT INTO vehicles(
        stock, 
        year, 
        makeId, 
        makeName, 
        modelId, 
        modelName, 
        trimId, 
        trimName, 
        notes, 
        dateAdded, 
        status)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`;
    const addVehicleResult = (await pool.execute(addVehicleQuery, [
      stock,
      year,
      parseInt(make.id),
      make.name,
      parseInt(model.id),
      model.name,
      parseInt(trim.id),
      trim.name,
      notes,
      dateAdded
    ]))[0];
    const vehicleId = (addVehicleResult as ResultSetHeader).insertId;
    // in this situation the vehicle dateAdded value is equal to the inital stage dateAssigned value
    const assignStageParam = { ...initialStageParam, vehicleId: vehicleId.toString(), dateAssigned: dateAdded };
    const vehicle = await assignStageMysql(assignStageParam, undefined, true, dateAdded, pool);
    return new PostSuccess(vehicle.id, vehicle.doc);
  } finally {
    !poolParam && await pool.end();
  }
}

export async function findVehicleMysql(field: 'id' | 'stock', value: string, poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoAppConnect().createPool();
  try {
    // to protect from SQL injection attack, we explicitly assign this whereValue, not from paramater
    const whereValue = field === 'id' ? 'id' : field === 'stock' ? 'stock' : '';
    const vehicleQuery = `
        SELECT v.id as id, stock, year, makeId, makeName, modelId, modelName, trimId, trimName, notes,
          currentStageAssignmentId, 
          dateAssigned as currentStageDateAssigned,
          tasks as currentStageTasks,
          currentStageStageId, 
          stageName as currentStageStageName, 
          currentStagePersonPlaceId, 
          personPlaceName as currentStagePersonPlaceName, 
          sa.status as currentStageStatus,
          dateCompleted as currentStageDateCompleted,
          completeTime as currentStageCompleteTime,
          dateAdded, v.status, dateForSale, dateSold, reconditionTime, forSaleTime, totalSellTime
        FROM vehicles as v
        INNER JOIN stageAssignments as sa ON sa.id = v.currentStageAssignmentId
        WHERE v.${whereValue} = ?
        `;
    const mysqlVehicle = json(await pool.execute(vehicleQuery, [parseInt(value)]))[0][0];
    if (!mysqlVehicle) return new GetSuccess(null);
    const vehicle = convertMysqlDetailedVehicle(mysqlVehicle);
    return new GetSuccess(vehicle);
  } finally {
    !poolParam && await pool.end();
  }
}

export async function updateVehicleMysql(vehicleId: string, update: VehicleUpdate, poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoAppConnect().createPool();
  try {
    let updateDoc = { ...update };
    // check if any updates have to do with date or times, if so we must update any other fields that are based off them
    if (update.dateAdded || update.dateForSale || update.dateSold) {
      const vehicleQuery = `SELECT * FROM vehicles WHERE id = ?`;
      const vehicle = json(await pool.execute(vehicleQuery, [parseInt(vehicleId)]))[0][0];
      const dateAdded = (update.dateAdded ? update.dateAdded : vehicle.dateAdded);
      const dateForSale = (update.dateForSale ? update.dateForSale : vehicle.dateForSale);
      const dateSold = (update.dateSold ? update.dateSold : vehicle.dateSold);
      const forSaleTime = dateSold && dateForSale && dateSold - dateForSale;
      const totalSellTime = dateSold && dateSold - dateAdded;
      // if the vehicle never made it to for sale, but is sold (has totalSellTime) then we want to make sure reconditionTime is recorded
      // though it was never completed. Client can tell if reconditioning was ever completed by checking for dateForSale  property
      const reconditionTime = dateForSale ? dateForSale - dateAdded : totalSellTime && totalSellTime;
      updateDoc = { ...update, reconditionTime, forSaleTime, totalSellTime };
    }
    const updateQueryArray = [];
    const updateQueryValues = [];
    if (updateDoc.stock) {
      updateQueryArray.push('stock = ?');
      updateQueryValues.push(updateDoc.stock);
    }
    if (updateDoc.year) {
      updateQueryArray.push('year = ?');
      updateQueryValues.push(updateDoc.year);
    }
    if (updateDoc.make) {
      updateQueryArray.push('makeId = ?', 'makeName = ?');
      updateQueryValues.push(parseInt(updateDoc.make.id), updateDoc.make.name);
    }
    if (updateDoc.model) {
      updateQueryArray.push('modelId = ?', 'modelName = ?');
      updateQueryValues.push(parseInt(updateDoc.model.id), updateDoc.model.name);
    }
    if (updateDoc.trim) {
      updateQueryArray.push('trimId = ?', 'trimName = ?');
      updateQueryValues.push(parseInt(updateDoc.trim.id), updateDoc.trim.name);
    }
    if (updateDoc.notes) {
      updateQueryArray.push('notes = ?');
      updateQueryValues.push(updateDoc.notes);
    }
    if (updateDoc.currentStage) {
      const { stageAssignmentId, stageId, personPlaceId } = updateDoc.currentStage;
      updateQueryArray.push('currentStageAssignmentId = ?', 'currentStageStageId = ?', 'currentStagePersonPlace = ?');
      updateQueryValues.push(stageAssignmentId, stageId, personPlaceId);
    }
    if (updateDoc.dateAdded) {
      updateQueryArray.push('dateAdded = ?');
      updateQueryValues.push(updateDoc.dateAdded);
    }
    if (updateDoc.status) {
      updateQueryArray.push('status = ?');
      updateQueryValues.push(updateDoc.status);
    }
    if (updateDoc.dateForSale) {
      updateQueryArray.push('dateForSale = ?');
      updateQueryValues.push(updateDoc.dateForSale);
    }
    if (updateDoc.dateSold) {
      updateQueryArray.push('dateSold = ?');
      updateQueryValues.push(updateDoc.dateSold);
    }
    if (updateDoc.reconditionTime) {
      updateQueryArray.push('reconditionTime = ?');
      updateQueryValues.push(updateDoc.reconditionTime);
    }
    if (updateDoc.forSaleTime) {
      updateQueryArray.push('forSaleTime = ?');
      updateQueryValues.push(updateDoc.forSaleTime);
    }
    if (updateDoc.totalSellTime) {
      updateQueryArray.push('totalSellTime = ?');
      updateQueryValues.push(updateDoc.totalSellTime);
    }
    const updateQueryString = updateQueryArray.join(', ');
    const queryString = `UPDATE vehicles SET ${updateQueryString} WHERE id = ?`;
    await pool.query(queryString, [...updateQueryValues, parseInt(vehicleId)]);
    const updateVehicle = (await findVehicleMysql('id', vehicleId, pool) as GetSuccess<DetailedVehicle>).data;
    return new PatchSuccess(vehicleId, updateDoc, updateVehicle);
  } finally {
    !poolParam && await pool.end();
  }
}

export async function sellVehicleMysql(vehicleId: string, stageAssignmentId: string, dateSold: number, poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoAppConnect().createPool();
  try {
    await completeStageAssignmentMysql(stageAssignmentId, dateSold, pool);
    // updateVehicleDoc handles calculating forSaleTime, totalSellTime, and reconditionTime
    await updateVehicleMysql(vehicleId, { status: 'sold', dateSold }, poolParam);
    const vehicle = (await findVehicleMysql('id', vehicleId, pool) as GetSuccess<DetailedVehicle>).data;
    return new PatchSuccess(vehicleId, { status: 'sold', dateSold }, vehicle);
  } finally {
    !poolParam && await pool.end();
  }
}

export async function deleteVehicleMyql(vehicleId: string, poolParam?: Pool) {
  const pool = poolParam ? poolParam : await new AutoAppConnect().createPool();
  try {
    const deleteQuery = `DELETE FROM vehicles WHERE id = ?`;
    await pool.execute(deleteQuery, [vehicleId]);
    return new DeleteSuccess();
  } finally {
    !poolParam && await pool.end();
  }
}