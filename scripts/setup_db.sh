#!/bin/bash

# assert that mongo is installed
if ! command -v mongosh &> /dev/null
then
    echo "mongosh is not installed"
    exit
else 
    mongosh trees --eval "db.dropDatabase()"
fi

mongodump --uri="mongodb+srv://cluster-backend.m3wbu.mongodb.net" --username retool-readwrite --password 14trees-prod  --out db_data --db users
mongorestore --db trees --verbose ./db_data/users

# run migrate_db to make changes to the DB
mongosh --file ./scripts/migrate_db.js
