# 14trees-mern
Node-React-Mongo App for visualizing and combining all data

## How to run on local

Backend application requires MongoDB atlas server. Create an atlas account and create a mongo db cluster using that account. 
- Migrate data to your atlas instance. (Please check `DB_CLONE.md` file)

Make sure to update (or create) `.env` file. Take reference from `.env.prod` file.

### Docker container

Run docker compose command to run backend server (and other apps if any).
```bash
docker compose up -d
```

### Local

Run below commands in terminal
```bash
npm install
```

Create Swagger documentation
```bash
npm run swagger-autogen
```

Run backend api server
```bash
npm run dev
```
or
```bash
npm run build
npm run start
```