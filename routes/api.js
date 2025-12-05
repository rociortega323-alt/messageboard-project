'use strict';

const Thread = require('../models/thread');
const Reply = require('../models/reply');

module.exports = function (app) {

  // ==========================
  //   THREADS
  // ==========================
  app.route('/api/threads/:board')

    // CREATE THREAD
    .post(async (req, res) => {
      const board = req.params.board;
      const { text, delete_password } = req.body;

      try {
        const thread = new Thread({
          board,
          text,
          delete_password,
          created_on: new Date(),
          bumped_on: new Date(),
          reported: false,
          replies: []
        });

        await thread.save();
        res.json(thread);
      } catch (err) {
        res.status(500).send('error');
      }
    })

    // GET THREADS
    .get(async (req, res) => {
      const board = req.params.board;

      try {
        const threads = await Thread.find({ board })
          .sort({ bumped_on: -1 })
          .limit(10)
          .lean();

        const formatted = threads.map(t => ({
          _id: t._id,
          text: t.text,
          created_on: t.created_on,
          bumped_on: t.bumped_on,
          replycount: t.replies.length,
          replies: t.replies
            .slice(-3)
            .map(r => ({
              _id: r._id,
              text: r.text,
              created_on: r.created_on
            }))
        }));

        res.json(formatted);
      } catch (err) {
        res.status(500).send('error');
      }
    })

    // DELETE THREAD
    .delete(async (req, res) => {
      const { thread_id, delete_password } = req.body;

      try {
        const thread = await Thread.findById(thread_id);

        if (!thread) return res.send('incorrect password');

        if (thread.delete_password !== delete_password) {
          return res.send('incorrect password');
        }

        await Thread.findByIdAndDelete(thread_id);
        res.send('success');
      } catch (err) {
        res.status(500).send('error');
      }
    })

    // REPORT THREAD
    .put(async (req, res) => {
      const { report_id } = req.body;

      try {
        await Thread.findByIdAndUpdate(report_id, { reported: true });
        res.send('reported');
      } catch (err) {
        res.status(500).send('error');
      }
    });

  // ==========================
  //   REPLIES
  // ==========================
  app.route('/api/replies/:board')

    // CREATE REPLY
    .post(async (req, res) => {
      const board = req.params.board;
      const { thread_id, text, delete_password } = req.body;

      try {
        const reply = {
          _id: new Reply()._id,
          text,
          delete_password,
          created_on: new Date(),
          reported: false
        };

        const thread = await Thread.findById(thread_id);

        thread.replies.push(reply);
        thread.bumped_on = new Date();

        await thread.save();

        res.json(thread);
      } catch (err) {
        res.status(500).send('error');
      }
    })

    // GET THREAD + ALL REPLIES
    .get(async (req, res) => {
      const { thread_id } = req.query;

      try {
        const thread = await Thread.findById(thread_id).lean();

        if (!thread) return res.send('error');

        thread.replies = thread.replies.map(r => ({
          _id: r._id,
          text: r.text,
          created_on: r.created_on
        }));

        res.json(thread);
      } catch (err) {
        res.status(500).send('error');
      }
    })

    // DELETE REPLY
    .delete(async (req, res) => {
      const { thread_id, reply_id, delete_password } = req.body;

      try {
        const thread = await Thread.findById(thread_id);

        const reply = thread.replies.id(reply_id);

        if (!reply || reply.delete_password !== delete_password) {
          return res.send('incorrect password');
        }

        reply.text = '[deleted]';
        await thread.save();

        res.send('success');
      } catch (err) {
        res.status(500).send('error');
      }
    })

    // REPORT REPLY
    .put(async (req, res) => {
      const { thread_id, reply_id } = req.body;

      try {
        const thread = await Thread.findById(thread_id);

        const reply = thread.replies.id(reply_id);
        reply.reported = true;

        await thread.save();

        res.send('reported');
      } catch (err) {
        res.status(500).send('error');
      }
    });
};
