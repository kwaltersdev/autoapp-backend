import AutoAppClient, { AutoAppConnection } from '../AutoAppClient';
import { ObjectId } from 'mongodb';
import { BaseVehicle, GetVehiclesQuery, AddVehicleParam, NextStock, CheckStock, VehicleStatus, VehiclePage, DetailedVehicle } from '../../common/types/Vehicle';
import { InitialStageParam } from '../../common/types/StageAssignment';
import { MongoVehicle, MongoVehicleUpdate } from '../mongoTypes/MongoVehicle';
import { MongoAssignStageParam } from '../mongoTypes/MongoStageAssignment';
import { convertMongoVehicle, convertMongoDetailedVehicle, handleIdParam } from '../mongoUtilities';
import { assignStageMongo, completeStageAssignmentMongo } from './stageAssignments';
import { GetSuccess, PostSuccess, PostExists, PatchSuccess, DeleteSuccess, FailedResult } from '../../common/types/Results';
import { ListOrder, Page } from '../../common/types/misc';
import { getStagesMongo } from './stages';

// INTERFACE EXPORTS
export async function getVehiclesPagedMongo(status: VehicleStatus, sort: ListOrder, perPage: number, page: Page, compare: number, query: GetVehiclesQuery, connectionParam?: AutoAppConnection) {
  const client = new AutoAppClient();
  try {
    const connection = connectionParam ? connectionParam : await client.connect();
    const { vehicles } = connection;
    // TOP LEVEL MATCH CRITERIAN
    const statusTmp = { status: { $in: [status] } };
    const statusMatch = { $match: statusTmp };
    // QUERY FILTERS
    const { queries, queriesMatch } = await getQueriesMatch(status, query);
    // PAGINATION
    const dateAddedMatch = sort === 'asc'
      ? (page === 'next')
        ? { $match: { dateAdded: { $gt: compare } } }
        : (page === 'prev')
          ? { $match: { dateAdded: { $lt: compare } } }
          : { $match: { dateAdded: { $gt: 0 } } }
      : (page === 'next')
        ? { $match: { dateAdded: { $lt: compare } } }
        : (page === 'prev')
          ? { $match: { dateAdded: { $gt: compare } } }
          : { $match: { dateAdded: { $gt: 0 } } };
    // we have to .reverse() the final returned for certain sorts, because we reverse them here in order to get the
    // ones that we are looking for
    const sortTmp = sort === 'asc'
      ? (page === 'first' || page === 'next')
        ? { $sort: { dateAdded: 1 } }
        : { $sort: { dateAdded: -1 } }
      : (page === 'last' || page === 'prev')
        ? { $sort: { dateAdded: 1 } }
        : { $sort: { dateAdded: -1 } };
    // our limit has to adjust for the last page
    const totalDocs = (await vehicles.countDocuments({ ...statusTmp, ...queries })).valueOf();
    const lastPagePerPage = totalDocs - (Math.floor(totalDocs / perPage) * perPage);
    const limitTmp = page === 'last' ? lastPagePerPage ? lastPagePerPage : perPage : perPage;
    const limit = { $limit: limitTmp };
    const pagination = [dateAddedMatch, sortTmp, limit];
    // JOIN WITH CURRENT STAGE
    const lookup = {
      $lookup: {
        from: 'stageAssignments',
        localField: 'currentStage.stageAssignmentId',
        foreignField: '_id',
        as: 'currentStage'
      }
    };
    const unwind = { $unwind: { path: "$currentStage" } };
    const project = { $project: { "currentStage.vehicleId": 0 } };
    const currentStageJoin = [lookup, unwind, project];
    // AGGREGATE PIPELINE
    const args = [statusMatch, queriesMatch, ...pagination, ...currentStageJoin];
    const mongoVehicles = await vehicles.aggregate(args).toArray();
    const vehiclesTmp = mongoVehicles.map(vehicle => convertMongoDetailedVehicle(vehicle));
    // we have to reverse the array if we chose 'last' of 'prev' because we had to switch the order in the aggregate pipeline (args). We are now switching the order back
    const vehiclesReturn = (page === 'last' || page === 'prev') ? vehiclesTmp.reverse() : vehiclesTmp;
    // PAGE DETAILS
    const returnedDocs = mongoVehicles.length;
    // count of the documents that go before the start of the page
    const dateAddedComparison = sort === 'asc'
      ? page === 'next'
        ? { dateAdded: { $lte: compare } }
        : page === 'prev'
          ? { dateAdded: { $lt: compare } }
          : {}
      : page === 'next'
        ? { dateAdded: { $gte: compare } }
        : page === 'prev'
          ? { dateAdded: { $gt: compare } }
          : {};
    const priorDocCount = page === 'first'
      ? 0
      : page === 'last'
        ? totalDocs - returnedDocs
        : page === 'next'
          ? (await vehicles.countDocuments({ ...statusTmp, ...queries, ...dateAddedComparison })).valueOf()
          : (await vehicles.countDocuments({ ...statusTmp, ...queries, ...dateAddedComparison })).valueOf() - perPage;

    const docStartNumber = !totalDocs ? 0 : priorDocCount + 1;
    const docEndNumber = priorDocCount + returnedDocs;
    const pageDetails = { docStartNumber, docEndNumber, totalDocs };
    return new GetSuccess(new VehiclePage(pageDetails, vehiclesReturn));
  } finally {
    !connectionParam && await client.close();
  }
};


export async function getVehiclesByStatusMongo(statusParams: string[], connectionParam?: AutoAppConnection) {
  const client = new AutoAppClient();
  try {
    const connection = connectionParam ? connectionParam : await client.connect();
    const { vehicles } = connection;
    const vehiclesTmp = await vehicles.find({ status: { $in: statusParams } }).toArray();
    const resultVehicles = vehiclesTmp.map(vehicle => convertMongoVehicle(vehicle));
    return new GetSuccess(resultVehicles);
  } finally {
    !connectionParam && await client.close();
  }
};

export async function getNextStockMongo(connectionParam?: AutoAppConnection) {
  const client = new AutoAppClient();
  try {
    const connection = connectionParam ? connectionParam : await client.connect();
    const { vehicles } = connection;
    const nextStocktmp = await vehicles.find()
      .sort({ stock: -1 })
      .limit(1)
      .project({ 'stock': 1, '_id': 0 })
      .toArray();
    const nextStock = (nextStocktmp.length > 0 ? nextStocktmp[0].stock + 1 : 21001);
    const stock: NextStock = {
      nextStock
    };
    return new GetSuccess(stock);
  } finally {
    !connectionParam && await client.close();
  }
};

export async function checkStockMongo(stock: string, connectionParam?: AutoAppConnection) {
  const client = new AutoAppClient();
  try {
    const connection = connectionParam ? connectionParam : await client.connect();
    const { vehicles } = connection;
    if (parseInt(stock) === 0) return new GetSuccess({ exists: false });
    let checkStock: CheckStock = { exists: false };
    const search = await vehicles.findOne({ stock: parseInt(stock) }, { projection: { '_id': 1 } });
    if (search) checkStock = { exists: true, id: search._id };
    return new GetSuccess(checkStock);
  } finally {
    !connectionParam && client.close();
  }
};

export async function addVehicleMongo(vehicleParam: AddVehicleParam, initialStageParam: InitialStageParam, connectionParam?: AutoAppConnection) {
  const assignInitialStage =
    async (initialStageParam: InitialStageParam, vehicleId: string | ObjectId, dateAssigned: number, connectionParam?: AutoAppConnection) => {
      const assignStageParam: MongoAssignStageParam = { ...initialStageParam, vehicleId, dateAssigned };
      // dateAssigned is passed as the dateAdded parameter for 'assignStage' here because in the initial stage
      // the stage's 'dateAssigned' and the vehicle's 'dateAdded' are equivalent
      const vehicle = await assignStageMongo(assignStageParam, undefined, true, dateAssigned, connectionParam);
      return vehicle;
    };
  // check if stock# is already in use
  const stockCheck = await checkStockMongo(vehicleParam.stock.toString(), connectionParam);
  if (stockCheck.data.exists) return new PostExists('stock', vehicleParam.stock.toString());
  const vehicleDoc = await writeVehicleDocMongo(vehicleParam, connectionParam);
  const updatedVehicle = await assignInitialStage(initialStageParam, vehicleDoc._id, vehicleDoc.dateAdded, connectionParam);
  return new PostSuccess(updatedVehicle.id, updatedVehicle.doc);
};

export async function findVehicleMongo(field: 'id' | 'stock', value: string | ObjectId, connectionParam?: AutoAppConnection) {
  const client = new AutoAppClient();
  try {
    const connection = connectionParam ? connectionParam : await client.connect();
    const { vehicles } = connection;
    let match;
    if (field === 'id') {
      // to handle both strings and ObjectId's as value params
      const idvalue = handleIdParam(value);
      match = { $match: { _id: idvalue } };
    } else {
      match = { $match: { stock: parseInt(value as string) } };
    };
    const lookup = {
      $lookup: {
        from: 'stageAssignments',
        localField: 'currentStage.stageAssignmentId',
        foreignField: '_id',
        as: 'currentStage'
      }
    };
    const unwind = {
      $unwind: {
        path: "$currentStage"
      }
    };
    const project = {
      $project: {
        "currentStage.vehicleId": 0
      },
    };
    const args = [match, lookup, unwind, project];
    const mongoVehicle = (await vehicles.aggregate(args).toArray())[0];
    if (!mongoVehicle) return new GetSuccess(null);
    const vehicle = convertMongoDetailedVehicle(mongoVehicle);
    return new GetSuccess(vehicle);
  } finally {
    !connectionParam && await client.close();
  }
};

export async function updateVehicleDocMongo(vehicleId: ObjectId | string, update: MongoVehicleUpdate, connectionParam?: AutoAppConnection) {
  const client = new AutoAppClient();
  try {
    const connection = connectionParam ? connectionParam : await client.connect();
    const { vehicles } = connection ? connection : await client.connect();
    // to handle both strings and ObjectId's as value params
    const vehicleIdtmp = handleIdParam(vehicleId);
    let updateDoc = { ...update };
    // check if any updates have to do with date or times, if so we must update any other fields that are based off them
    if (update.dateAdded || update.dateForSale || update.dateSold) {
      // we cannot use our 'findVehicle' function here because the 'lookup' aspect for currentStage breaks it (if we don'thave a current stage yet)
      // must use mongodb's 'findOne';
      const vehicle = await vehicles.findOne({ _id: vehicleIdtmp });
      const dateAdded = (update.dateAdded ? update.dateAdded : vehicle.dateAdded);
      const dateForSale = (update.dateForSale ? update.dateForSale : vehicle.dateForSale);
      const dateSold = (update.dateSold ? update.dateSold : vehicle.dateSold);
      const forSaleTime = dateSold && dateForSale && dateSold - dateForSale;
      const totalSellTime = dateSold && dateSold - dateAdded;
      // if the vehicle never made it to for sale, but is sold (has totalSellTime) then we want to make sure reconditionTime is recorded
      // though it was never completed. Client can tell if reconditioning was ever completed by checking for dateForSale  property
      const reconditionTime = dateForSale ? dateForSale - dateAdded : totalSellTime && totalSellTime;
      updateDoc = { ...update, reconditionTime, forSaleTime, totalSellTime };
    };
    const result = await vehicles.updateOne({ _id: vehicleIdtmp }, { $set: updateDoc });
    if (result.result.ok !== 1) throw new Error('Failed to update vehicle document');
    const updatedVehicle = await findVehicleMongo('id', vehicleId, connection) as GetSuccess<DetailedVehicle>;
    return new PatchSuccess(vehicleIdtmp.toHexString(), update, updatedVehicle.data);
  } finally {
    !connectionParam && await client.close();
  }
};

export async function sellVehicleMongo(vehicleId: string, stageAssignmentId: string, dateSold: number, connectionParam?: AutoAppConnection) {
  await completeStageAssignmentMongo(stageAssignmentId, dateSold, connectionParam);
  // updateVehicleDoc handles calculating the ForSaleTime, totalSellTime, and reconditionTime properties
  const soldVehicle = await updateVehicleDocMongo(vehicleId, { status: 'sold', dateSold }, connectionParam);
  return soldVehicle;
};

export async function deleteVehicleDocMongo(vehicleId: string, connectionParam?: AutoAppConnection) {
  const client = new AutoAppClient();
  try {
    const connection = connectionParam ? connectionParam : await client.connect();
    const { vehicles } = connection;
    await vehicles.deleteOne({ _id: new ObjectId(vehicleId) });
    return new DeleteSuccess();
  } finally {
    !connectionParam && await client.close();
  }
};

// HELPERS
export async function writeVehicleDocMongo(vehicleParam: AddVehicleParam, connectionParam?: AutoAppConnection) {
  const client = new AutoAppClient();
  try {
    const connection = connectionParam ? connectionParam : await client.connect();
    const { vehicles } = connection;
    const vehicleDoc: BaseVehicle = { ...vehicleParam, currentStage: { stageAssignmentId: '', stageId: '', personPlaceId: '' }, status: 'active' };
    let result = await vehicles.insertOne(vehicleDoc);
    let vehicle: MongoVehicle = result.ops[0];
    return vehicle;
  } finally {
    !connectionParam && await client.close();
  }
};

async function getQueriesMatch(status: VehicleStatus, query: GetVehiclesQuery, connectionParam?: AutoAppConnection) {
  // unless otherwise stated, in most cases we do not want to see 'For Sale' vehicles
  const stagesTmp = (await getStagesMongo(connectionParam)).data;
  const forSaleId = (stagesTmp.find(stage => stage.name === 'For Sale'))?.id;
  let forSaleQuery;
  if (query.forSale !== 'true') forSaleQuery = { 'currentStage.stageId': { $ne: forSaleId } };
  if (query.forSale === 'true' || status === 'sold' || status === 'trash') forSaleQuery = {};

  let yearQuery;
  if (query.year) yearQuery = { year: { $eq: parseInt(query.year) } };
  let makeQuery;
  const makeTmp = query.make && query.make.split('-')[1]; // gets just the 'id' from the query
  if (makeTmp) makeQuery = { 'make.id': { $eq: makeTmp } };
  let modelQuery;
  const modelTmp = query.model && query.model.split('-')[1]; // gets just the 'id' from the query
  if (modelTmp) modelQuery = { 'model.id': { $eq: modelTmp } };
  let trimQuery;
  const trimTmp = query.trim && query.trim.split('-')[1]; // gets just the 'id' from the query
  if (trimTmp) trimQuery = { 'trim.id': { $eq: trimTmp } };

  let addedAfter, addedBefore, addedRange;
  if (query.addedAfter) addedAfter = { $gte: parseFloat(query.addedAfter) };
  if (query.addedBefore) addedBefore = { $lte: parseFloat(query.addedBefore) };
  if (query.addedAfter || query.addedBefore) {
    addedRange = { dateAdded: { ...addedAfter, ...addedBefore } };
  }
  let soldAfter, soldBefore, soldRange;
  if (query.soldAfter) soldAfter = { $gte: parseFloat(query.soldAfter) };
  if (query.soldBefore) soldBefore = { $lte: parseFloat(query.soldBefore) };
  if (query.soldAfter || query.soldBefore) {
    soldRange = { dateSold: { ...soldAfter, ...soldBefore } };
  }

  let stageIdQuery;
  if (query.stageId) {
    forSaleQuery = {}; // have to cancel out our negative 'for sale' query for this query
    stageIdQuery = { 'currentStage.stageId': { $eq: query.stageId } };
  }
  let personPlaceIdQuery;
  if (query.personPlaceId) {
    forSaleQuery = {}; // have to cancel out our negative 'for sale' query for this query
    personPlaceIdQuery = { 'currentStage.personPlaceId': { $eq: query.personPlaceId } };
  }
  const queries = { ...forSaleQuery, ...yearQuery, ...makeQuery, ...modelQuery, ...trimQuery, ...addedRange, ...soldRange, ...stageIdQuery, ...personPlaceIdQuery };
  const queriesMatch = { $match: queries };
  return { queries, queriesMatch };
};
