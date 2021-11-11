import AutoFlowClient, { AutoFlowConnection } from '../AutoFlowClient';
import { ObjectId } from 'mongodb';
import { handleIdParam, convertMongoModel, convertMongoModelDoc } from '../mongoUtilities';
import { MongoIdName } from '../mongoTypes/mongoMisc';
import { IdName } from '../../common/types/misc';
import { MongoBaseModelDoc, MongoModelDoc } from '../mongoTypes/MongoVehicle';
import { GetSuccess, PatchSuccess, PostExists, PostSuccess } from '../../common/types/Results';

// INTERFACE EXPORTS
export async function getModelsMongo(makeId: string, connectionParam?: AutoFlowConnection) {
  const client = new AutoFlowClient();
  try {
    const connection = connectionParam ? connectionParam : await client.connect();
    const { models } = connection;
    const makeIdtmp = handleIdParam(makeId);
    const mongoModels: MongoIdName[] =
      await models.find({ makeId: makeIdtmp }).project({ name: 1 }).sort({ name: 1 }).toArray();
    const modelstmp: IdName[] = mongoModels.map(model => convertMongoModel(model));
    return new GetSuccess(modelstmp);
  } finally {
    !connectionParam && await client.close();
  }
};

export async function addModelMongo(makeId: string, modelName: string, connectionParam?: AutoFlowConnection) {
  const client = new AutoFlowClient();
  try {
    const connection = connectionParam ? connectionParam : await client.connect();
    const { models } = connection;
    const modeltmp = modelName.toUpperCase();
    const makeIdtmp = handleIdParam(makeId);
    // check if model exists/get make doc
    const { data: modelstmp }: GetSuccess<IdName[]> = await getModelsMongo(makeId, connection);
    if (modelstmp.find(model => model.name === modeltmp)) {
      return new PostExists('model', modeltmp);
    };
    const baseMongoModelDoc: MongoBaseModelDoc = {
      name: modeltmp,
      makeId: makeIdtmp,
      trims: []
    };
    const insertResult = await models.insertOne(baseMongoModelDoc);
    if (insertResult.result.ok !== 1) throw new Error('Failed to insert model doc');
    const insertedId: ObjectId = insertResult.insertedId;
    const addedModel: IdName = {
      id: insertedId.toHexString(),
      name: baseMongoModelDoc.name
    };
    const { data: updatedModels } = await getModelsMongo(makeId, connection);
    return new PostSuccess(insertResult.insertedId, addedModel, updatedModels);
  } finally {
    !connectionParam && await client.close();
  }
};

export async function getTrimsMongo(modelId: string, connectionParam?: AutoFlowConnection) {
  const client = new AutoFlowClient();
  try {
    const connection = connectionParam ? connectionParam : await client.connect();
    const { models } = connection;
    const modelIdtmp = handleIdParam(modelId);
    const mongoModel: MongoModelDoc = await models.findOne({ _id: modelIdtmp });
    const model = convertMongoModelDoc(mongoModel);
    return new GetSuccess(model.trims);
  } finally {
    !connectionParam && await client.close();
  }
};

export async function addTrimMongo(modelId: string | ObjectId, trimName: string, connectionParam?: AutoFlowConnection) {
  const client = new AutoFlowClient();
  try {
    const connection = connectionParam ? connectionParam : await client.connect();
    const { models } = connection;
    const modelIdtmp = handleIdParam(modelId);
    const trimId = new ObjectId();
    const trimtmp = trimName.toUpperCase();
    const queryFilter = { _id: modelIdtmp };
    const mongoModel: MongoModelDoc = await models.findOne(queryFilter);
    if (mongoModel.trims.find(trim => trim.name === trimtmp)) {
      return new PostExists('trim', trimtmp);
    };
    const trimUpdate = { trims: [{ _id: trimId, name: trimtmp }, ...mongoModel.trims] };
    const result = await models.updateOne(queryFilter, { $set: trimUpdate });
    if (result.result.ok !== 1) throw new Error('Failed to update model doc');
    const updatedMongoModel = await models.findOne(queryFilter);
    const updatedModel = convertMongoModelDoc(updatedMongoModel);
    const newTrim: IdName = {
      id: trimId.toHexString(),
      name: trimtmp
    };
    return new PatchSuccess(modelId.toString(), newTrim, updatedModel, updatedModel.trims);
  } finally {
    !connectionParam && await client.close();
  }
};