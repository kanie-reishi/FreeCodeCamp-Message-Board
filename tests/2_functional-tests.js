const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
let threadID ;
let replyID;
chai.use(chaiHttp);
suite('Functional Tests', function() {
        test('Creating a new thread: POST request to /api/threads/{board}', function(done) {
            chai.request(server)
                ////.keepOpen()
                .post('/api/threads/test')
                .send({
                    text: 'test thread',
                    delete_password: 'test'
                })
                .end(function(err, res) {
                    assert.equal(res.status, 200);
                    assert.equal(res.body.text, 'test thread');
                    assert.equal(res.body.delete_password, 'test');
                    assert.equal(res.body.reported, false);
                    threadID = res.body._id;
                    done();
                });
        });
        test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function(done) {
            chai.request(server)
                //.keepOpen()
                .get('/api/threads/test')
                .end(function(err, res) {
                    assert.equal(res.status, 200);
                    assert.isArray(res.body);
                    assert.isAtMost(res.body.length, 10);
                    assert.isAtMost(res.body[0].replies.length, 3);
                    done();
                });
        });
        test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password', function(done) {
            chai.request(server)
                //.keepOpen()
                .delete('/api/threads/test')
                .send({
                    thread_id: threadID,
                    delete_password: 'wrong'
                })
                .end(function(err, res) {
                    assert.equal(res.status, 200);
                    assert.equal(res.text, 'incorrect password');
                    done();
                });
        });
        test('Reporting a thread: PUT request to /api/threads/{board}', function(done) {
            chai.request(server)
                //.keepOpen()
                .put('/api/threads/test')
                .send({
                    thread_id: threadID
                })
                .end(function(err, res) {
                    assert.equal(res.status, 200);
                    assert.equal(res.text, 'reported');
                    done();
                });
        });
        test('Creating a new reply: POST request to /api/replies/{board}', function(done) {
            chai.request(server)
                //.keepOpen()
                .post('/api/replies/test')
                .send({
                    thread_id: threadID,
                    text: 'test reply',
                    delete_password: 'test'
                })
                .end(function(err, res) {
                    assert.equal(res.status, 200);
                    assert.equal(res.body.replies[0].text, 'test reply');
                    assert.equal(res.body.replies[0].delete_password, 'test');
                    assert.equal(res.body.replies[0].reported, false);
                    replyID = res.body.replies[0]._id;
                    done();
                });
        });
        test('Viewing a single thread with all replies: GET request to /api/replies/{board}', function(done) {
            chai.request(server)
                //.keepOpen()
                .get('/api/replies/test')
                .query({
                    thread_id: threadID
                })
                .end(function(err, res) {
                    assert.equal(res.status, 200);
                    assert.equal(res.body._id, threadID);
                    assert.isArray(res.body.replies);
                    done();
                });
        });
        test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password', function(done) {
            chai.request(server)
                //.keepOpen()
                .delete('/api/replies/test')
                .send({
                    thread_id: threadID,
                    reply_id: replyID,
                    delete_password: 'wrong'
                })
                .end(function(err, res) {
                    assert.equal(res.status, 200);
                    assert.equal(res.text, 'incorrect password');
                    done();
                });
        });
        test('Reporting a reply: PUT request to /api/replies/{board}', function(done) {
            chai.request(server)
                //.keepOpen()
                .put('/api/replies/test')
                .send({
                    thread_id: threadID,
                    reply_id: replyID,
                })
                .end(function(err, res) {
                    assert.equal(res.status, 200);
                    assert.equal(res.text, 'reported');
                    done();
                });
        });
        test('Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password', function(done) {
            chai.request(server)
                //.keepOpen()
                .delete('/api/replies/test')
                .send({
                    thread_id: threadID,
                    reply_id: replyID,
                    delete_password: 'test'
                })
                .end(function(err, res) {
                    assert.equal(res.status, 200);
                    assert.equal(res.text, 'success');
                    done();
                });
        });
        test('Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password', function(done) {
            chai.request(server)
                //.keepOpen()
                .delete('/api/threads/test')
                .send({
                    thread_id: threadID,
                    delete_password: 'test'
                })
                .end(function(err, res) {
                    assert.equal(res.status, 200);
                    assert.equal(res.text, 'success');
                    done();
                });
        });
    });
