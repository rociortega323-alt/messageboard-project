'use strict';

const Thread = require('../models/Thread.js');
const express = require('express');
const router = express.Router();

/***************
 *   THREADS   *
 ***************/

// Create thread
router.post('/threads/:board', async (req, res) => {
  const board = req.params.board;
  const { text, delete_password } = req.body;

  try {
    const thread = new Thread({
      board,
      text,
      delete_password
    });

    await thread.save();
    res.redirect(`/b/${board}/`);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Get threads
router.get('/threads/:board', async (req, res) => {
  const board = req.params.board;

  try {
    const threads = await Thread
      .find({ board })
      .sort({ bumped_on: -1 })
      .limit(10)
      .lean();

    threads.forEach(t => {
      t.replies.sort((a, b) => b.created_on - a.created_on);
      t.replies = t.replies.slice(0, 3);

      delete t.delete_password;
      t.replies = t.replies.map(r => {
        delete r.delete_password;
        return r;
      });
    });

    res.json(threads);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Delete thread
router.delete('/threads/:board', async (req, res) => {
  const { thread_id, delete_password } = req.body;

  try {
    const thread = await Thread.findById(thread_id);
    if (!thread || thread.delete_password !== delete_password)
      return res.send('incorrect password');

    await Thread.deleteOne({ _id: thread_id });
    res.send('success');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Report thread
router.put('/threads/:board', async (req, res) => {
  const { thread_id } = req.body;

  try {
    await Thread.findByIdAndUpdate(thread_id, { reported: true });
    res.send('reported');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/***************
 *   REPLIES   *
 ***************/

// Create reply
router.post('/replies/:board', async (req, res) => {
  const { thread_id, text, delete_password } = req.body;
  const board = req.params.board;

  try {
    const thread = await Thread.findById(thread_id);
    if (!thread) return res.send('not found');

    thread.replies.push({
      text,
      delete_password,
      created_on: new Date()
    });

    thread.bumped_on = new Date();
    await thread.save();

    res.redirect(`/b/${board}/${thread_id}`);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Get replies
router.get('/replies/:board', async (req, res) => {
  const thread_id = req.query.thread_id;

  try {
    const thread = await Thread.findById(thread_id).lean();
    if (!thread) return res.send('not found');

    delete thread.delete_password;
    thread.replies = thread.replies.map(r => {
      delete r.delete_password;
      return r;
    });

    res.json(thread);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Delete reply
router.delete('/replies/:board', async (req, res) => {
  const { thread_id, reply_id, delete_password } = req.body;

  try {
    const thread = await Thread.findById(thread_id);
    if (!thread) return res.send('not found');

    const reply = thread.replies.id(reply_id);
    if (!reply || reply.delete_password !== delete_password)
      return res.send('incorrect password');

    reply.text = '[deleted]';
    await thread.save();

    res.send('success');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Report reply
router.put('/replies/:board', async (req, res) => {
  const { thread_id, reply_id } = req.body;

  try {
    const thread = await Thread.findById(thread_id);
    if (!thread) return res.send('not found');

    const reply = thread.replies.id(reply_id);
    if (!reply) return res.send('not found');

    reply.reported = true;
    await thread.save();

    res.send('reported');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
