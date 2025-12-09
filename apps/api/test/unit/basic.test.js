/**
 * @fileOverview Basic unit test placeholder
 */

const { expect } = require("chai");

describe("#BasicUnit", () => {
  it("should verify test environment is working", (done) => {
    expect(process.env.NODE_ENV).to.equal('test');
    done();
  });

  it("should have basic assertions working", (done) => {
    expect(true).to.be.true;
    expect(1 + 1).to.equal(2);
    expect("test").to.be.a('string');
    done();
  });

  it("should have environment variables loaded", (done) => {
    expect(process.env.NODE_ENV).to.exist;
    expect(process.env.SECRET_KEY).to.exist;
    done();
  });
});