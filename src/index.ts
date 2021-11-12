import * as dotenv from 'dotenv';
import express, { Request, Response, Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ServiceAbstract } from './common/service/ServiceAbstract';
import { initializeRoutes } from './common/routes/initializeRoutes';
import { MongoService } from './mongoDb/service/MongoService';
import { MysqlService } from './mysql/service/MysqlService';
import { DbSelection } from './common/types/Demo';
import { SuccessResult } from './common/types/Results';
import { Server } from 'http';

dotenv.config();

if (!process.env.SELECT_PORT
  || !process.env.MAIN_PORT
  || !process.env.MONGO_URI
  || !process.env.MYSQL_HOST
  || !process.env.MYSQL_USER
  || !process.env.MYSQL_PASSWORD
  || !process.env.MYSQL_DATABASE) {
  process.exit(1);
}

const SELECT_PORT = process.env.SELECT_PORT;
const MAIN_PORT = process.env.MAIN_PORT;
const MONGO_URI = process.env.MONGO_URI;
const MYSQL_HOST = process.env.MYSQL_HOST;
const MYSQL_USER = process.env.MYSQL_USER;
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD;
const MYSQL_DATABASE = process.env.MYSQL_DATABASE;

// varieables used for storing selected service / server; will be reassigned each time database is changed
let currentSelection: DbSelection;
let service: ServiceAbstract;
let server: MainServer;

// express app used for selecting Database
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.listen(SELECT_PORT, () => console.log(`Selection Server listening on port ${SELECT_PORT}`));
app.post('/api/demo/select-db', async (req: Request, res: Response) => {
  const { dbSelection } = req.body;
  await selectService(dbSelection);
  const result = new SuccessResult();
  res.status(201).json(result);
});

async function selectService(dbSelection: DbSelection) {
  if (currentSelection === dbSelection) return;
  try {
    switch (dbSelection) {
      case 'mongodb':
        if (MONGO_URI) {
          server && await server.close();
          service = new MongoService();
          await service.initialize();
          server = new MainServer('MongoDB', service);
          await server.listen();
          currentSelection = dbSelection;
        } else {
          throw new Error(`MONGO_URI is not defined`);
        };
        break;
      case 'mysql':
        if (MYSQL_HOST && MYSQL_USER && MYSQL_PASSWORD && MYSQL_DATABASE) {
          server && await server.close();
          service = new MysqlService();
          await service.initialize();
          server = new MainServer('MySQL', service);
          await server.listen();
          currentSelection = dbSelection;
        } else {
          throw new Error('one or more MSQL environmeent variables are undefined');
        }
        break;
    };
  } catch (e) {
    console.error(e);
  };
};

// our server object
class MainServer {
  name: string;
  app: Express;
  server: Server | null = null;

  constructor(name: string, service: ServiceAbstract) {
    this.name = name;
    this.app = express();
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    initializeRoutes(this.app, service);
  }

  listen(): Promise<void> {
    return new Promise(resolve => {
      this.server = this.app.listen(MAIN_PORT, () => {
        console.log(`${this.name} server listening on port ${MAIN_PORT}`);
        resolve();
      });
    });
  }

  close(): Promise<void> {
    if (this.server) return new Promise(resolve => {
      this.server && this.server.close(() => {
        console.log(`${this.name} server closed`);
        resolve();
      });
    });
    return new Promise(resolve => resolve);
  }

}