# AutoFlow-Service-OOP

## Running locally
Note: the service cannot be run locally without a connection to a database. You must provide this as an environment variable if you wish to run locally and not within a Docker container

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

## Running Docker Containers
Note: you will need Docker installed on your machine.

Build the image:
```bash
docker-compose build
```

Start the dev server (configured for hot-reloading):
```bash
docker-compose up -d
```

Open debugger:
1. Type 'about:inspect' into the Chrome browser
2. Select 'Open dedicated DevTools for Node'

Stop the server:
```bash
docker-compose down
```


Build and start production build:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```