// tests/2_functional-tests.js
const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const Thread = require('../models/Thread');

chai.use(chaiHttp);

describe('Functional Tests', function() {
  this.timeout(5000);
  let testThreadId;
  let testReplyId;
  const board = 'testboard';

  before((done) => {
    Thread.deleteMany({}, done);
  });

  it('Create a new thread', (done) => {
    chai.request(server)
      .post('/api/threads/' + board)
      .type('form')
      .send({ text: 'Test thread', delete_password: 'pass123' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        Thread.findOne({ text: 'Test thread' }).then(t => {
          assert.isOk(t);
          testThreadId = t._id.toString();
          done();
        }).catch(done);
      });
  });

  it('View threads list', (done) => {
    chai.request(server)
      .get('/api/threads/' + board)
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        done();
      });
  });

  it('Delete thread with wrong password', (done) => {
    chai.request(server)
      .delete('/api/threads/' + board)
      .send({ thread_id: testThreadId, delete_password: 'wrong' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  it('Report thread', (done) => {
    chai.request(server)
      .put('/api/threads/' + board)
      .send({ thread_id: testThreadId })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'reported');
        done();
      });
  });

  it('Create a reply', (done) => {
    chai.request(server)
      .post('/api/replies/' + board)
      .type('form')
      .send({ thread_id: testThreadId, text: 'a reply', delete_password: 'rpass' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        Thread.findById(testThreadId).then(t => {
          assert.isOk(t);
          assert.isAtLeast(t.replies.length, 1);
          testReplyId = t.replies[t.replies.length-1]._id.toString();
          done();
        }).catch(done);
      });
  });

  it('View thread with all replies', (done) => {
    chai.request(server)
      .get('/api/replies/' + board)
      .query({ thread_id: testThreadId })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body._id, testThreadId);
        assert.isArray(res.body.replies);
        done();
      });
  });

  it('Delete reply with wrong password', (done) => {
    chai.request(server)
      .delete('/api/replies/' + board)
      .send({ thread_id: testThreadId, reply_id: testReplyId, delete_password: 'wrong' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  it('Report reply', (done) => {
    chai.request(server)
      .put('/api/replies/' + board)
      .send({ thread_id: testThreadId, reply_id: testReplyId })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'reported');
        done();
      });
  });

  it('Delete reply with correct password', (done) => {
    chai.request(server)
      .delete('/api/replies/' + board)
      .send({ thread_id: testThreadId, reply_id: testReplyId, delete_password: 'rpass' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        Thread.findById(testThreadId).then(t => {
          const r = t.replies.id(testReplyId);
          assert.equal(r.text, '[deleted]');
          done();
        }).catch(done);
      });
  });

  it('Delete thread with correct password', (done) => {
    chai.request(server)
      .delete('/api/threads/' + board)
      .send({ thread_id: testThreadId, delete_password: 'pass123' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        done();
      });
  });

});
