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
node server.js
```

### EC2 server
ssh into ec2 instance
```bash
ssh -i $SSH_KEY_PEM_FILE ubuntu@<ip-address>
```

run below command to start running application. pm2 command with run `npm start` command. start command is mentioned in `package.json` file
```bash
cd 14trees-mern
pm2 start npm -- start
```

List applications
```bash
pm2 list
```


Stop running application
```bash
pm2 stop <application-name>
```


delete application config from pm2
```bash
pm2 delete <application-name>
```