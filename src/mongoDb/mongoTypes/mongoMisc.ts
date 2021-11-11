import { ObjectId } from 'mongodb';

export interface MongoIdName {
  _id: ObjectId;
  name: string;
}