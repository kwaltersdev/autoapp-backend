import AutoAppClient, { AutoAppConnection } from '../AutoAppClient';
import { ObjectId } from 'mongodb';
import { MongoIdName } from '../mongoTypes/mongoMisc';
import { IdName } from '../../common/types/misc';
import { PostSuccess, PostExists, GetSuccess } from '../../common/types/Results';
import { convertMongoMake } from '../mongoUtilities';

// INTERFACE EXPORTS
export async function getMakesMongo(connectionParam?: AutoAppConnection) {
  const client = new AutoAppClient();
  try {
    const connection = connectionParam ? connectionParam : await client.connect();
    const { makes } = connection;
    const mongoMakes: MongoIdName[] = await makes.find().project({ name: 1 }).sort({ name: 1 }).toArray();
    const makestmp: IdName[] = mongoMakes.map(make => convertMongoMake(make));
    return new GetSuccess(makestmp);
  } finally {
    !connectionParam && await client.close();
  }
};

export async function addMakeMongo(makeName: string, connectionParam?: AutoAppConnection) {
  const client = new AutoAppClient();
  try {
    const connection = connectionParam ? connectionParam : await client.connect();
    const { makes } = connection;
    const makeDoc = {
      name: makeName.toUpperCase(),
    };
    let insertedId: ObjectId;
    // check if Make already exists before inserting doc
    const exists = await makes.findOne({ name: makeName.toUpperCase() }, { projection: { '_id': 1 } });
    if (!exists) {
      const result = await makes.insertOne(makeDoc);
      if (result.result.ok !== 1) throw new Error(`Failed to add 'make' document`);
      insertedId = result.insertedId;
    } else {
      return new PostExists('make', makeDoc.name);
    }
    const addedMake: IdName = {
      id: insertedId.toHexString(),
      name: makeDoc.name
    };
    const makestmp = await getMakesMongo(connectionParam);
    return new PostSuccess(insertedId.toHexString(), addedMake, makestmp.data);
  } finally {
    !connectionParam && await client.close();
  }
};