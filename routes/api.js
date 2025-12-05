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

  if (!text || !delete_password) return res.status(400).send('missing fields');

  try {
    const thread = new Thread({
      board,
      text,
      delete_password
      // created_on and bumped_on defaults handled by schema
    });

    await thread.save();
    // redirect to board page (FC C project expects redirect)
    res.redirect(`/b/${board}/`);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Get threads (most recent 10 by bumped_on, each with most recent 3 replies)
router.get('/threads/:board', async (req, res) => {
  const board = req.params.board;

  try {
    const threads = await Thread
      .find({ board })
      .sort({ bumped_on: -1 })
      .limit(10)
      .lean();

    // sanitize and trim replies
    const out = threads.map(t => {
      // sort replies by created_on desc
      t.replies = (t.replies || []).sort((a, b) => new Date(b.created_on) - new Date(a.created_on));
      // keep only 3 most recent
      t.replies = t.replies.slice(0, 3).map(r => {
        // remove sensitive fields
        const { _id, text, created_on } = r;
        return { _id, text, created_on };
      });

      // remove sensitive fields from thread
      return {
        _id: t._id,
        board: t.board,
        text: t.text,
        created_on: t.created_on,
        bumped_on: t.bumped_on,
        replies: t.replies,
        // note: reported and delete_password must not be sent
      };
    });

    res.json(out);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Delete thread
router.delete('/threads/:board', async (req, res) => {
  const { thread_id, delete_password } = req.body;

  if (!thread_id || !delete_password) return res.status(400).send('missing fields');

  try {
    const thread = await Thread.findById(thread_id);
    if (!thread) return res.send('incorrect password'); // match tests behavior

    if (thread.delete_password !== delete_password) {
      return res.send('incorrect password');
    }

    await Thread.deleteOne({ _id: thread_id });
    res.send('success');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Report thread
router.put('/threads/:board', async (req, res) => {
  const { thread_id } = req.body;
  if (!thread_id) return res.status(400).send('missing fields');

  try {
    const t = await Thread.findByIdAndUpdate(thread_id, { reported: true });
    if (!t) return res.send('not found');
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

  if (!thread_id || !text || !delete_password) return res.status(400).send('missing fields');

  try {
    const thread = await Thread.findById(thread_id);
    if (!thread) return res.status(404).send('not found');

    const newReply = {
      text,
      delete_password,
      created_on: new Date()
    };

    thread.replies.push(newReply);
    thread.bumped_on = new Date();
    await thread.save();

    res.redirect(`/b/${board}/${thread_id}`);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Get replies (full thread)
router.get('/replies/:board', async (req, res) => {
  const thread_id = req.query.thread_id;
  if (!thread_id) return res.status(400).send('missing fields');

  try {
    const thread = await Thread.findById(thread_id).lean();
    if (!thread) return res.status(404).send('not found');

    // Remove delete_password and reported from thread and replies
    const sanitizedReplies = (thread.replies || []).map(r => ({
      _id: r._id,
      text: r.text,
      created_on: r.created_on
    }));

    const out = {
      _id: thread._id,
      board: thread.board,
      text: thread.text,
      created_on: thread.created_on,
      bumped_on: thread.bumped_on,
      replies: sanitizedReplies
    };

    res.json(out);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Delete reply
router.delete('/replies/:board', async (req, res) => {
  const { thread_id, reply_id, delete_password } = req.body;

  if (!thread_id || !reply_id || !delete_password) return res.status(400).send('missing fields');

  try {
    const thread = await Thread.findById(thread_id);
    if (!thread) return res.send('incorrect password');

    const reply = thread.replies.id(reply_id);
    if (!reply) return res.send('incorrect password');

    if (reply.delete_password !== delete_password) return res.send('incorrect password');

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
  if (!thread_id || !reply_id) return res.status(400).send('missing fields');

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
