import { MongoClient, Db, Collection } from "mongodb";

export interface AutoAppConnection {
  db: Db,
  vehicles: Collection,
  stageAssignments: Collection,
  stages: Collection,
  peoplePlaces: Collection,
  makes: Collection,
  models: Collection;
}

export default class AutoAppClient {
  readonly client: MongoClient;

  constructor() {
    let URI = process.env.MONGO_URI ? process.env.MONGO_URI : '';
    this.client = new MongoClient(URI, { useUnifiedTopology: true });
  }

  async connect(): Promise<AutoAppConnection> {
    await this.client.connect();
    const db = this.client.db(process.env.MONGO_DATABASE);
    return {
      db,
      vehicles: db.collection('vehicles'),
      stageAssignments: db.collection('stageAssignments'),
      stages: db.collection('stages'),
      peoplePlaces: db.collection('peoplePlaces'),
      makes: db.collection('makes'),
      models: db.collection('models'),
    };
  }

  close() {
    return this.client.close();
  }
}

