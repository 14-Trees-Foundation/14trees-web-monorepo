const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js')
const PlotModel = require('./models/plot');
const mongoose = require("mongoose");
const { MongoClient } = require("mongodb");
const { getMongoDBConnectionString } = require('./services/mongo');
require("dotenv").config();

// Connect MongoDB
const connectDB = async () => {
    try {
      const mongo_connection_string = getMongoDBConnectionString();
      if (!mongo_connection_string) {
        throw new Error("MongoDB connection string is not provided");
      }
      const _client = new MongoClient(mongo_connection_string);
      await mongoose.connect(mongo_connection_string, { autoIndex: false });
    } catch (err) {
      console.error("Failed to connect to MongoDB - exiting", err.message);
      console.error(
        "Check if the MongoDB server is running and the connection string is correct."
      );
      process.exit(1);
    }
  };

function readKMLFile(filePath) {
    let data;
    try {
        const kmlString = fs.readFileSync(filePath, 'utf-8')
        xml2js.parseString(kmlString, (err, result) => {
            if (err) {
                console.log(err)
            } else {
                data = result
            }
        });
    } catch (err) {
        console.log(err);
        return data;
    }
    return data;
}

function getCoordinates(dataObj) {
    let result = {};

    function traverse(obj) {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (key === "Placemark") {
                    obj[key].forEach((item) => {
                        let type = ''
                        let coordinates = [];
                        // if (item.hasOwnProperty("LineString")) {
                        //     type = 'LineString'
                        //     coordinates = item.LineString[0].coordinates;
                        // } else 
                        if (item.hasOwnProperty("Polygon")) {
                            type = 'Polygon'
                            coordinates = item.Polygon[0].outerBoundaryIs[0].LinearRing[0].coordinates;
    
                            result[item.name[0]] = []
                            let coords = coordinates[0].replace(/^[ \t\n]+|[ \t\n]+$/g, '').split(' ')
                            coords.forEach((cord) => {
                                let cordArr = cord.split(',');
                                result[item.name[0]].push([cordArr[1], cordArr[0]]);
                            })
                        } 
                        // else {
                        //     console.log("Corner case: ", item)
                        // }
                    });
                }
                else if (Array.isArray(obj[key])) {
                    obj[key].forEach((item) => {
                        if (typeof item === 'object') {
                            traverse(item);
                        }
                    });
                }
                else if (typeof obj[key] === 'object') {
                    traverse(obj[key]);
                }
            }
        }
    }

    traverse(dataObj);
    return result;
}

const updateCoordinates = async (filePath) => {
    console.log(filePath);
    try {
        await connectDB();
        let dataObj = readKMLFile(filePath)
        if (dataObj) {
            let coordinates = getCoordinates(dataObj);

            for (let key in coordinates) {
                if (coordinates.hasOwnProperty(key)) {
                    let plot = await PlotModel.findOne({plot_id: key})
                    if (plot) {
                        if (!plot.boundaries) {
                            plot.boundaries = {}
                        }
                        plot.boundaries['coordinates'] = [coordinates[key]];
                        let data = await plot.save();
                    }
                    // let result = await PlotModel.findOneAndUpdate(
                    //     {
                    //         query: { plot_id: key },
                    //         update: { "$set": { "boundaries.coordinates.0": coordinates[key] } },
                    //         // upsert: false
                    //     }
                    // )
                }
            }
        }
    } catch (err) {
        console.error('Error updating coordinates:', err);
    } finally {
        mongoose.disconnect();
    }
    
}

function traverseDirectory(folderPath) {
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }
        
        files.forEach((file) => {
            const filePath = path.join(folderPath, file);
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error('Error reading file stats:', err);
                    return;
                }
                
                if (stats.isDirectory()) {
                    // Recursively traverse subdirectory
                    traverseDirectory(filePath);
                } else {
                    // update extract coordinates from kml file and update in db
                    updateCoordinates(filePath);
                }
            });
        });
    });
}


traverseDirectory('/home/onrush-dev/Onrush/Projects/14-Trees-Foundation/14trees-web-monorepo/apps/api/src/kml');