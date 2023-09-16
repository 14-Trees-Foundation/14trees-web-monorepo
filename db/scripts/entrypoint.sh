#!/bin/bash

# if DB_DATA is empty, then download the data from cloud
if [ ! -d "$DB_DATA/users" ]; then
	echo "Downloading data from MongoDB..."
	mongodump --uri=$ATLAS_DB_URI --username $ATLAS_DB_UNAME --password $ATLAS_DB_PASS --out $DB_DATA --db users
else
	echo "Data backup found, restoring data..."
fi

sleep 10

echo "MONGO_INITDB_ROOT_USERNAME: $MONGO_INITDB_ROOT_USERNAME"
echo "MONGO_INITDB_ROOT_PASSWORD: $MONGO_INITDB_ROOT_PASSWORD"

# Use mongoimport to load data into MongoDB
echo "Restoring data..."
mongorestore --host 'db' --port $DB_PORT --username $MONGO_INITDB_ROOT_USERNAME --password $MONGO_INITDB_ROOT_PASSWORD --authenticationDatabase admin --verbose --nsInclude "users.*" $DB_DATA

sleep 10

# Run the init.js script inside mongosh to perform data migrations
# mongosh --file ./scripts/migrate_db.js
echo "Running migrations..."
mongosh "mongodb://$MONGO_INITDB_ROOT_USERNAME:$MONGO_INITDB_ROOT_PASSWORD@db:$DB_PORT" --eval "load('/scripts/migrate_db.js')"

# do not exit
tail -f /dev/null
