import fs from 'fs';
import { promisify } from 'util';
import xml2js from 'xml2js';
import { getAreaOfPolygon } from 'geolib';

// Convert fs.readFile to return a promise
const readFile = promisify(fs.readFile);

interface Coordinate {
    latitude: number;
    longitude: number;
}

interface PlotDetails {
    acresArea: number,
    coordinates: Coordinate[]
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
        if (marker['Polygon']) return true;
        return false;
    })
    return results;
}

function processPolygonMarker(marker: any) {

    const name = marker['name'][0];
    const coordinatesText: string = marker['Polygon'][0]['outerBoundaryIs'][0]['LinearRing'][0]['coordinates'][0];

    // Parse coordinates
    const coordinatesArray = coordinatesText.trim().split(' ').map((coord: string) => coord.split(',').map(Number));
    const coordinates: Coordinate[] = coordinatesArray.map(([lon, lat, alt]) => ({
        latitude: lat,
        longitude: lon,
    }));

    return { name, coordinates };
}

const calculateAreaInAcres = (coordinates: Coordinate[]): number => {
    const areaInSquareMeters = getAreaOfPolygon(coordinates);
    const areaInAcres = areaInSquareMeters / 4046.86; // Convert square meters to acres
    return areaInAcres;
};

export async function getPlotNameAndCoordinatesFromKml(filePath: string): Promise<Map<string, PlotDetails>> {
    // Read the KML file
    const kmlData = await readFile(filePath, 'utf-8');

    // Parse the KML XML data
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(kmlData);

    // Map to store names and their coordinates
    const nameToCoordinatesMap = new Map<string, PlotDetails>();

    // Start processing from the root of the KML document

    const polygons = getAllPolygons(result);
    for (const polygon of polygons) {
        const { name, coordinates } = processPolygonMarker(polygon);
        if (!nameToCoordinatesMap.has(name)) {
            nameToCoordinatesMap.set(name, { coordinates: coordinates, acresArea: calculateAreaInAcres(coordinates) });
        }
    }

    return nameToCoordinatesMap;
}
