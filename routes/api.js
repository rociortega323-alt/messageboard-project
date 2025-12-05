"use strict";

const Thread = require("../models/Thread");
const express = require("express");
const router = express.Router();

/************************
 *      THREADS         *
 ************************/

// POST thread
router.post("/threads/:board", async (req, res) => {
  const board = req.params.board;
  const { text, delete_password } = req.body;

  try {
    const thread = new Thread({
      board,
      text,
      delete_password,
    });

    await thread.save();
    return res.redirect(`/b/${board}/`);
  } catch (err) {
    return res.send("error");
  }
});

// GET threads (10 threads, 3 replies)
router.get("/threads/:board", async (req, res) => {
  const board = req.params.board;

  const threads = await Thread.find({ board })
    .sort({ bumped_on: -1 })
    .limit(10)
    .lean();

  const cleaned = threads.map((t) => {
    return {
      _id: t._id,
      text: t.text,
      created_on: t.created_on,
      bumped_on: t.bumped_on,
      replies: t.replies.slice(-3).map((r) => ({
        _id: r._id,
        text: r.text,
        created_on: r.created_on,
      })),
      replycount: t.replies.length,
    };
  });

  res.json(cleaned);
});

// DELETE thread
router.delete("/threads/:board", async (req, res) => {
  const { thread_id, delete_password } = req.body;

  const thread = await Thread.findById(thread_id);
  if (!thread || thread.delete_password !== delete_password)
    return res.send("incorrect password");

  await Thread.deleteOne({ _id: thread_id });
  return res.send("success");
});

// REPORT thread
router.put("/threads/:board", async (req, res) => {
  const { thread_id } = req.body;

  await Thread.findByIdAndUpdate(thread_id, { reported: true });
  return res.send("reported");
});

/************************
 *       REPLIES        *
 ************************/

// POST reply
router.post("/replies/:board", async (req, res) => {
  const { text, delete_password, thread_id } = req.body;
  const board = req.params.board;

  const thread = await Thread.findById(thread_id);
  if (!thread) return res.send("not found");

  thread.replies.push({
    text,
    delete_password,
    created_on: new Date(),
  });

  thread.bumped_on = new Date();
  await thread.save();

  return res.redirect(`/b/${board}/${thread_id}`);
});

// GET full thread
router.get("/replies/:board", async (req, res) => {
  const thread_id = req.query.thread_id;

  const thread = await Thread.findById(thread_id).lean();
  if (!thread) return res.send("not found");

  return res.json({
    _id: thread._id,
    text: thread.text,
    created_on: thread.created_on,
    bumped_on: thread.bumped_on,
    replies: thread.replies.map((r) => ({
      _id: r._id,
      text: r.text,
      created_on: r.created_on,
    })),
  });
});

// DELETE reply (set "[deleted]")
router.delete("/replies/:board", async (req, res) => {
  const { thread_id, reply_id, delete_password } = req.body;

  const thread = await Thread.findById(thread_id);
  if (!thread) return res.send("not found");

  const reply = thread.replies.id(reply_id);
  if (!reply || reply.delete_password !== delete_password)
    return res.send("incorrect password");

  reply.text = "[deleted]";
  await thread.save();

  return res.send("success");
});

// REPORT reply
router.put("/replies/:board", async (req, res) => {
  const { thread_id, reply_id } = req.body;

  const thread = await Thread.findById(thread_id);
  if (!thread) return res.send("not found");

  const reply = thread.replies.id(reply_id);
  if (!reply) return res.send("not found");

  reply.reported = true;
  await thread.save();

  return res.send("reported");
});

module.exports = router;
