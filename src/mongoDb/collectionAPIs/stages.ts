import { ObjectId } from 'mongodb';
import AutoFlowClient, { AutoFlowConnection } from '../AutoFlowClient';
import { StageSummary, UpdatedStageOrder, StageVehicleCount } from '../../common/types/Stage';
import { GetSuccess, PostSuccess, PostExists, PatchSuccess, PatchManyResult, FailedResult } from '../../common/types/Results';
import { handleIdParam, convertMongoStageSummary, convertMongoExportStage } from '../mongoUtilities';
import { MongoBaseStageDoc, MongoStageDoc } from '../mongoTypes/MongoStage';

// INTERFACE EXPORTS
export async function getStageVehicleCountsMongo(connectionParam?: AutoFlowConnection) {
  const client = new AutoFlowClient();
  try {
    const connection = connectionParam ? connectionParam : await client.connect();
    const { vehicles } = connection;
    const stagesTmp = (await getStagesMongo(connection)).data;
    const stageCounts: StageVehicleCount[] = [];
    for (let stage of stagesTmp) {
      const count = (await vehicles.countDocuments({ status: { $in: ['active'] }, 'currentStage.stageId': { $eq: stage.id } })).valueOf();
      stageCounts.push({ ...stage, count });
    }
    return new GetSuccess(stageCounts);
  } finally {
    !connectionParam && await client.close();
  }
}

export async function getStagesMongo(connectionParam?: AutoFlowConnection) {
  const client = new AutoFlowClient();
  try {
    const connection = connectionParam ? connectionParam : await client.connect();
    const { stages } = connection;
    const mongoStagesTmp = await stages.find().project({ name: 1, order: 1 }).sort({ order: 1 }).toArray();
    const stagesTmp = mongoStagesTmp.map(stage => convertMongoStageSummary(stage));
    return new GetSuccess(stagesTmp);
  } finally {
    !connectionParam && await client.close();
  }
}

export async function getPeoplePlacesMongo(stageId: string, connectionParam?: AutoFlowConnection) {
  const id = handleIdParam(stageId);
  const detailedStage = await getExportStageMongo(id, connectionParam);
  const peoplePlaces = detailedStage.peoplePlaces.sort((a, b) => {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });
  return new GetSuccess(peoplePlaces);
}

export async function addStageMongo(stageName: string, connectionParam?: AutoFlowConnection) {
  const client = new AutoFlowClient();
  try {
    const connection = connectionParam ? connectionParam : await client.connect();
    const { stages } = connection;
    // check if stage exists already
    const search = await stages.findOne({ stageName: stageName });
    if (search) return new PostExists('stage', stageName);
    // if stageName === 'For Sale' then set order to 10000 (always last)
    // if not assign 'order' value to the count
    let count;
    stageName === 'For Sale' ? count = 10000 : count = await stages.countDocuments();
    const stageDoc: MongoBaseStageDoc = {
      name: stageName,
      order: count,
      peoplePlaces: []
    };
    const { insertedId } = await stages.insertOne(stageDoc);
    const insertedStage: StageSummary = { id: insertedId.toString(), name: stageName, order: count };
    const stagestmp = await getStagesMongo(connection);
    return new PostSuccess(insertedId.toString(), insertedStage, stagestmp.data);
  } finally {
    !connectionParam && await client.close();
  }
};

export async function updateStageOrderMongo(updateStagesArray: UpdatedStageOrder[], connectionParam?: AutoFlowConnection) {
  const stageUpdates = updateStagesArray.map(stage => updateStageDocMongo(stage.id, { order: stage.order }, connectionParam));
  const results = await Promise.all(stageUpdates);
  const checkFailed = results.find(result => result.status === 'failed');
  if (checkFailed) {
    throw new Error(`One or more 'stage' docs failed to update`);
  }
  const stagestmp = await getStagesMongo(connectionParam);
  return new PatchManyResult('success', results, stagestmp.data);
}

export async function addStagePersonPlaceMongo(stageId: string, personPlaceId: string, connectionParam?: AutoFlowConnection) {
  const client = new AutoFlowClient();
  try {
    const connection = connectionParam ? connectionParam : await client.connect();
    const { stages } = connection;
    const stageIdtmp = handleIdParam(stageId);
    const personPlaceIdtmp = handleIdParam(personPlaceId);
    const filter = { _id: stageIdtmp };
    const stage: MongoStageDoc = await stages.findOne(filter);
    if (!stage) throw new Error(`the 'stage' provided does not exist`);
    const update = { peoplePlaces: [...stage.peoplePlaces, personPlaceIdtmp] };
    // check if stage already includes personPlace before updating doc
    if (!stage.peoplePlaces.find(personPlace => personPlace.equals(personPlaceIdtmp))) {
      await stages.updateOne(filter, { $set: update });
    };
    // if stage already includes personPlace, we don't need to take any action
    // because our result will still be the same
    const updatedStage = await getExportStageMongo(stageIdtmp, connection);
    return new PatchSuccess(stageId, update, updatedStage, updatedStage.peoplePlaces);
  } finally {
    !connectionParam && await client.close();
  }
};

// HELPERS
export async function updateStageDocMongo(stageId: string, update: object, connectionParam?: AutoFlowConnection) {
  const client = new AutoFlowClient();
  try {
    const connection = connectionParam ? connectionParam : await client.connect();
    const { stages } = connection;
    const id = new ObjectId(stageId);
    const result = await stages.updateOne({ _id: id }, { $set: update });
    if (result.result.ok === 1) return new PatchSuccess(stageId, update, null);
    return new FailedResult();
  } finally {
    !connectionParam && await client.close();
  }
};

interface MatchParam {
  $match: object;
}
async function getExportStagesMongo(matchParam?: MatchParam, connectionParam?: AutoFlowConnection) {
  const client = new AutoFlowClient();
  try {
    const connection = connectionParam ? connectionParam : await client.connect();
    const { stages } = connection;
    const mongoStages = await stages.aggregate([
      {
        $lookup: {
          from: 'peoplePlaces',
          localField: 'peoplePlaces',
          foreignField: '_id',
          as: 'peoplePlaces'
        }
      },
      matchParam ? matchParam : {}
    ]).toArray();
    const exportStages = mongoStages.map(stage => convertMongoExportStage(stage));
    return exportStages;
  } finally {
    !connectionParam && await client.close();
  }
}

async function getExportStageMongo(stageId: ObjectId, connectionParam?: AutoFlowConnection) {
  const stagestmp = await getExportStagesMongo({ $match: { _id: stageId } }, connectionParam);
  const stage = stagestmp[0];
  return stage;
};
