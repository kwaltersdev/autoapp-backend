import { ObjectId } from 'mongodb';
import { MongoIdName } from './mongoMisc';

export interface MongoBaseStageDoc {
  name: string,
  peoplePlaces: ObjectId[],
  order: number;
}

export interface MongoStageDoc extends MongoBaseStageDoc {
  _id: ObjectId,
}

export interface MongoExportStage {
  _id: ObjectId,
  name: string,
  peoplePlaces: MongoIdName[],
  order: number;
}