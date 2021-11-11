# AutoFlow Back End Demo
Written in TypeScript/Node/Express, this back end application is meant for use with [autoflow-front-end-demo](https://github.com/kwaltersdev/autoflow-front-end-demo).

The higher level structure of this application is built on the Object Oriented paradigm. Through an express endpoint, consumers can switch which database (MongoDB or MySQL) the server is communicating with. Aside from the service broadcasting which database it is currently working with, the consumer would have no idea which database it is utlimately talking to (and it shouldn't). All endpoints remain the exact same on the exact same port, and all requests and responses are of the exact same types. Polymorphism makes this possible.

The lower level structure of this application, the 'how', is built with a more 'Functional' style of programming. The implementation details are coded into low level 'do only one thing' functions which can be used in any context, so long as the required parameters are supplied. If you dive into the source code, you will notice folders like 'collectionAPIs' and 'tableAPIs' which contain these functions. These functions are then imported and used in the definitions of the objects used in the Object Oriented structure. This allowed me to break free from the sometimes too 'rigid' of a structure that OOP can cause while at the same time preserving the power of OOP.

One cool feature of these 'Functional' styled functions are that they are smart enough to recycle database connections until the end of a given chain of functions is met, at which point the connections are ended. These 'Functinonal' functions can still be used in any order, and they don't care what comes before or what comes after their execution. This feature improves the efficiency of the application because it prevents unnecessary connecting, disconnecting, and reconnecting while also preventing too many connections or leaving connections open.

Another cool feature of this app is its use of generator functions to create demo data. These generator functions 'step through' the creation and completion of vehicles and stage assignments to simulate as if a user were actually using the application. This results in realistic, 'makes real world sense', data.

The app is close to being production level but falls short in the following ways:
- There are no notions of seperate users or authentication methods
- the 'statistics' endpoints are not optimized for massive amounts of data (though they work fine with 10,000+ vehicles)
  - this is because the 'statistics' endpoints were designed to be agnostic as to which database is being used in order to prove out OOP concepts, as opposed to being written to use optimizations provided by the given database it is communicating with.

## Back End Tech Stack

- Node
- TypeScript
- Express
- mongodb v3.6 node driver
- mysql2 node driver 
- MongoDB
- MySQL

## Running Docker Containers
**Note: you will need `docker` and `docker-compose` installed on your machine.**

Running any of the following `docker-compose` commands will create volumes for './src' (dev hot reloading) and for 'mongodb' and 'mysqldb' (preserve data between killing, stopping, restarting, or rebuilding containers)

### Build the image:
```bash
docker-compose build
```

### Build production build and start the production server:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build 
```
or to run containers in the background:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

### Start the development server (configured for hot-reloading):
```bash
docker-compose up
```
or to run containers in the background:
```bash
docker-compose up -d
```

### Open debugger:
1. Type 'about:inspect' into the Chrome browser
2. Select 'Open dedicated DevTools for Node'

### Stop the server:
```bash
docker-compose down
```

## Running locally
Note: the service cannot be run locally without a connection to database(s). You must provide environment variables (required variables can be found in the docker-compose.yml file) relating to your db connections if you wish to run locally and not within Docker containers

```bash
npm i
```

Start the dev server:
```bash
npm run dev
```

Build the project:
```bash
npm run build
```

Start built project
```bash
npm start
```

