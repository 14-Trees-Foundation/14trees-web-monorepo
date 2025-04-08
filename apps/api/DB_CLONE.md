# MongoDB Data migration

Search functionality in the BE app is powered by mongodb atlas index, which is not available on local setup (only available on mongodb cloud). So it's recommended to create an account and daatabse on free tier.

Run below commands to migrate data from existing mongodb cluster to your mongodb atlas cluster.
```bash
export CLOUD_MONGO_CONNECTION_STR=<14trees-mongo-server-connection-string>
export YOUR_MONGO_ATLAS_CONNECTION_URI=<your-mongo-atlas-cluster-connection-string>

mongodump --uri=$CLOUD_MONGO_CONNECTION_STR --out="./dump"
mongorestore --uri $YOUR_MONGO_ATLAS_CONNECTION_URI ./dump
```

- Make sure to create required search indexes in your MongoDB Atlas server. Currently we have three indexes.
    - `usersindex`

        Go to `Atlas Search` section under `Services` section from your mongodb atlas home page. Select cluster you have create and then create a search index which above name and below json.

        ```json
        {
            "mappings": {
                "dynamic": false,
                "fields": {
                    "name": [
                        {
                            "dynamic": true,
                            "type": "document"
                        },
                        {
                            "type": "string"
                        }
                    ]
                }
            }
        }
        ```
    - `treetypeindex`

        follow the same steps here.

        ```json
        {
            "mappings": {
                "dynamic": true,
                "fields": {
                    "family": [
                        {
                            "dynamic": true,
                            "type": "document"
                        },
                        {
                            "type": "string"
                        }
                    ],
                    "food": [
                        {
                            "dynamic": true,
                            "type": "document"
                        },
                        {
                            "type": "string"
                        }
                    ],
                    "med_use": [
                        {
                            "dynamic": true,
                            "type": "document"
                        },
                        {
                            "type": "string"
                        }
                    ],
                    "name": [
                        {
                            "dynamic": true,
                            "type": "document"
                        },
                        {
                            "type": "string"
                        }
                    ],
                    "other_use": [
                        {
                            "dynamic": true,
                            "type": "document"
                        },
                        {
                            "type": "string"
                        }
                    ],
                    "scientific_name": [
                        {
                            "dynamic": true,
                            "type": "document"
                        },
                        {
                            "type": "string"
                        }
                    ]
                }
            }
        }
        ```
    - `plotindex`

        follow the same steps here.

        ```json
        {
            "mappings": {
                "dynamic": true,
                "fields": {
                    "name": [
                        {
                            "dynamic": true,
                            "type": "document"
                        },
                        {
                            "type": "string"
                        }
                    ],
                    "plot_id": [
                        {
                            "dynamic": true,
                            "type": "document"
                        },
                        {
                            "type": "string"
                        }
                    ]
                }
            }
        }
        ```