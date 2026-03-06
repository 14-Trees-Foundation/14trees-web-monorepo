/**
 * @fileOverview Server startup and shutdown test
 */

const { expect } = require("chai");
const request = require("supertest");

describe("#ServerHealth", () => {
  let agent;

  before((done) => {
    // Use the global app set up in bootstrap.test.js
    agent = request.agent(global.app);
    done();
  });

  it("should have a running Express app", (done) => {
    expect(global.app).to.exist;
    expect(typeof global.app).to.equal('function');
    done();
  });

  it("should respond to health check endpoint", (done) => {
    agent.get("/test/health")
      .end((err, res) => {
        expect(res.status).to.equal(200);
        expect(res.body.status).to.equal("OK");
        expect(res.body.message).to.equal("Test server is running");
        expect(res.body.environment).to.equal("test");
        expect(res.body).to.have.property("timestamp");
        done();
      });
  });

  it("should handle 404 for non-existent routes", (done) => {
    agent.get("/non-existent-route")
      .end((err, res) => {
        expect(res.status).to.equal(404);
        expect(res.body).to.have.property('error');
        done();
      });
  });

  it("should have CORS headers", (done) => {
    agent.get("/test/health")
      .end((err, res) => {
        expect(res.headers).to.have.property('access-control-allow-origin');
        done();
      });
  });
});