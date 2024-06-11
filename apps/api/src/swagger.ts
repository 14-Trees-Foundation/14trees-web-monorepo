import swaggerAutogen = require("swagger-autogen");

const outputFile = './swagger_output.json'
const routes = ['src/server.ts'];
const doc = {
    info: {
      title: '14Trees-Postgres-API',
      description: 'Backend APIs for 14Trees-service'
    },
    host: 'localhost:8088'
};

swaggerAutogen(outputFile, routes, doc)