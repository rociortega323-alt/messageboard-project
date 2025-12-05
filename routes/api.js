'use strict';

const express = require('express');
const router = express.Router();
const Thread = require('../models/Thread.js');

/*******************
 *   CREATE THREAD *
 *******************/
router.post('/threads/:board', async (req, res) => {
  const board = req.params.board;
  const { text, delete_password } = req.body;

  try {
    const thread = new Thread({
      board,
      text,
      delete_password
    });

    const saved = await thread.save();
    res.json(saved);  // <-- FCC lo requiere
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/*******************
 *   GET THREADS   *
 *******************/
router.get('/threads/:board', async (req, res) => {
  const board = req.params.board;

  try {
    let threads = await Thread
      .find({ board })
      .sort({ bumped_on: -1 })
      .limit(10)
      .lean();

    threads = threads.map(t => {
      // eliminar campos sensibles
      delete t.delete_password;
      delete t.reported;

      // ordenar replies y limitar a 3
      t.replies = t.replies
        .sort((a, b) => b.created_on - a.created_on)
        .map(r => {
          delete r.delete_password;
          delete r.reported;
          return r;
        })
        .slice(0, 3);

      return t;
    });

    res.json(threads);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/*********************
 *   DELETE THREAD   *
 *********************/
router.delete('/threads/:board', async (req, res) => {
  const { thread_id, delete_password } = req.body;

  try {
    const thread = await Thread.findById(thread_id);

    if (!thread || thread.delete_password !== delete_password) {
      return res.send("incorrect password");
    }

    await thread.deleteOne();
    return res.send("success");

  } catch (err) {
    res.status(500).send(err.message);
  }
});

/********************
 *   REPORT THREAD  *
 ********************/
router.put('/threads/:board', async (req, res) => {
  const { thread_id } = req.body;

  try {
    await Thread.findByIdAndUpdate(thread_id, { reported: true });
    res.send("reported");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/*******************
 *   CREATE REPLY   *
 *******************/
router.post('/replies/:board', async (req, res) => {
  const { thread_id, text, delete_password } = req.body;

  try {
    const thread = await Thread.findById(thread_id);
    if (!thread) return res.send("not found");

    const reply = {
      text,
      delete_password,
      created_on: new Date(),
      reported: false
    };

    thread.replies.push(reply);
    thread.bumped_on = new Date();
    await thread.save();

    res.json(thread);  // <-- FCC requiere JSON, NO redirect
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/*****************
 *   GET REPLIES *
 *****************/
router.get('/replies/:board', async (req, res) => {
  const thread_id = req.query.thread_id;

  try {
    let thread = await Thread.findById(thread_id).lean();
    if (!thread) return res.send("not found");

    delete thread.delete_password;
    delete thread.reported;

    thread.replies = thread.replies.map(r => {
      delete r.delete_password;
      delete r.reported;
      return r;
    });

    res.json(thread);

  } catch (err) {
    res.status(500).send(err.message);
  }
});

/********************
 *   DELETE REPLY   *
 ********************/
router.delete('/replies/:board', async (req, res) => {
  const { thread_id, reply_id, delete_password } = req.body;

  try {
    const thread = await Thread.findById(thread_id);
    if (!thread) return res.send("not found");

    const reply = thread.replies.id(reply_id);

    if (!reply || reply.delete_password !== delete_password) {
      return res.send("incorrect password");
    }

    reply.text = "[deleted]";
    await thread.save();

    res.send("success");

  } catch (err) {
    res.status(500).send(err.message);
  }
});

/*******************
 *   REPORT REPLY   *
 *******************/
router.put('/replies/:board', async (req, res) => {
  const { thread_id, reply_id } = req.body;

  try {
    const thread = await Thread.findById(thread_id);
    if (!thread) return res.send("not found");

    const reply = thread.replies.id(reply_id);
    if (!reply) return res.send("not found");

    reply.reported = true;
    await thread.save();

    res.send("reported");

  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
