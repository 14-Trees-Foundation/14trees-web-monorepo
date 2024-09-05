import fs from 'fs';
import { promisify } from 'util';
import xml2js from 'xml2js';

// Convert fs.readFile to return a promise
const readFile = promisify(fs.readFile);

interface Coordinate {
    latitude: number;
    longitude: number;
}

interface AnyObject {
    [key: string]: any;
}

function getAllPolygons(obj: AnyObject): any[] {
    let results: any[] = [];
    function search(value: any) {
        if (value && typeof value === 'object') {
            if (Array.isArray(value)) {
                for (const item of value) {
                    search(item);
                }
            } else {
                for (const key in value) {
                    if (key === 'Placemark') {
                        results.push(...value[key]);
                    }
                    search(value[key]);
                }
            }
        }
    }

    search(obj);
    results = results.filter(marker => {
        if (marker['description'] && marker['Polygon']) return true;
        return false;
    })
    return results;
}

function processPolygoneMarker(marker: any) {

    const description = marker['description'][0];
    const coordinatesText: string = marker['Polygon'][0]['outerBoundaryIs'][0]['LinearRing'][0]['coordinates'][0];

    // Parse coordinates
    const coordinatesArray = coordinatesText.trim().split(' ').map((coord: string) => coord.split(',').map(Number));
    const coordinates: Coordinate[] = coordinatesArray.map(([lon, lat, alt]) => ({
        latitude: lat,
        longitude: lon,
    }));

    return { description, coordinates };
}

async function parseKML(filePath: string): Promise<Map<string, Coordinate[]>> {
    // Read the KML file
    const kmlData = await readFile(filePath, 'utf-8');

    // Parse the KML XML data
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(kmlData);

    // Map to store descriptions and their coordinates
    const descriptionToCoordinatesMap = new Map<string, Coordinate[]>();

    // Start processing from the root of the KML document

    const polygons = getAllPolygons(result);
    for (const polygon of polygons) {
        const { description, coordinates } = processPolygoneMarker(polygon);
        if (!descriptionToCoordinatesMap.has(description)) {
            descriptionToCoordinatesMap.set(description, []);
          }
          descriptionToCoordinatesMap.get(description)!.push(...coordinates);
    }

    return descriptionToCoordinatesMap;
}

// Example usage
(async () => {
    try {
        const filePath = '/home/onrush-dev/Downloads/DAKSHANA FOREST (1).kml';
        const result = await parseKML(filePath);
        console.log(result);
    } catch (error) {
        console.error('Error parsing KML file:', error);
    }
})();
