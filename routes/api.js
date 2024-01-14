'use strict';
const BoardModel = require("../models.js").Board;
const ThreadModel = require("../models.js").Thread;
const ReplyModel = require("../models.js").Reply;


async function findBoard(boardName) {
  return await BoardModel.findOne({ board_name: boardName });
}


async function createBoard(boardName) {
  const newBoard = new BoardModel({ board_name: boardName });
  return await newBoard.save();
}

//Delete a thread not whole board
async function deleteThread(boardName, threadId) {
  const result = await BoardModel.findOneAndUpdate(
    { board_name: boardName },
    { $pull: { threads: { thread_id: threadId } } }, // $pull operator to remove elements from an array field.
    { new: true }
  );
  return;
}





module.exports = function (app) {

  app.route('/api/threads/:board').post(async (req, res) => {
    const { text, delete_password, thread_id } = req.body;
    let board = req.body.board;
    if (!board) {
      board = req.params.board;
    }
    if (!text || !delete_password) {
      return res.send('missing inputs');
    }
    const newThread = new ThreadModel({
      text: text,
      delete_password: delete_password,
      created_on: new Date(),
      bumped_on: new Date(),
      reported: false,
      replies: [],
    });
    let foundBoard = await findBoard(board);
    if (!foundBoard) {
      foundBoard = await createBoard(board);
    } 
    foundBoard.threads.push(newThread); 
    await foundBoard.save();
    res.json(newThread);
  });
  //Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}
  app.route('/api/threads/:board').get(async (req, res) => {
    const boardName = req.params.board;
    const foundBoard = await findBoard(boardName);
    if (!foundBoard) {
      return res.send('Board not found');
    } else {
      //Get the created_on of each thread and sort them in descending order
      const sortedThreads = foundBoard.threads.sort((a, b) => {
        return new Date(b.bumped_on) - new Date(a.bumped_on);
      });
      // Get the 10 most recent threads
      const recentThreads = sortedThreads.slice(0, 10);
      // Respond with the 10 most recent threads and their 3 most recent replies
      const recentThreadsAndReplies = recentThreads.map(thread => {
        const recentReplies = thread.replies.sort((a, b) => {
          return new Date(b.created_on) - new Date(a.created_on);
        }).slice(0, 3);
        const recentRepliesWithText = recentReplies.map(reply => {
          return {
            _id: reply._id,
            text: reply.text,
            created_on: reply.created_on,
          };
        });
        return {
          text: thread.text,
          created_on: thread.created_on,
          replies: recentRepliesWithText,
          replycount: thread.replies.length,
          _id: thread._id,
          bumped_on: thread.bumped_on,
        }
      });
      return res.json(recentThreadsAndReplies);
    }
  });
  //Deleting a thread
  app.route('/api/threads/:board').delete(async (req, res) => {
    const { thread_id, delete_password } = req.body;
    const board = req.params.board;
    if (!board || !thread_id || !delete_password) {
      return res.send('missing inputs');
    }
    console.log(thread_id);
    const foundBoard = await findBoard(board);
    if (!foundBoard) {
      return res.send('Board not found');
    } else {
      let threadToDelete = foundBoard.threads.id(thread_id);
      if (threadToDelete.delete_password !== delete_password) {
        return res.send('incorrect password');
      } else {
        deleteThread(board, thread_id);
        return res.send('success');
      }
    }
  });

  //Reporting a thread: PUT request to /api/threads/{board}
  app.route('/api/threads/:board').put(async (req, res) => {
    const { thread_id } = req.body;
    const board = req.params.board;
    if (!board || !thread_id) {
      return res.send('missing inputs');
    }
    const foundBoard = await findBoard(board);
    if (!foundBoard) {
      return res.send('Board not found');
    } else {
      let reportedThread = foundBoard.threads.id(thread_id);
      if (!reportedThread) {
        return res.send('Thread not found');
      } else {
        const DATE = new Date();
        reportedThread.reported = true;
        reportedThread.bumped_on = DATE;
        await foundBoard.save();
        return res.send('reported');
      }
    }
  });
  //Creating a new reply: POST request to /api/replies/{board}
  app.route('/api/replies/:board').post(async (req, res) => {
    const { thread_id, text, delete_password } = req.body;
    const board = req.params.board;
    if (!thread_id || !text || !delete_password) {
      return res.send('missing inputs');
    }
    const foundBoard = await findBoard(board);
    if (!foundBoard) {
      return res.send('Board not found');
    } else {
      const DATE = new Date();
      let threadToAddReply = foundBoard.threads.id(thread_id);
      threadToAddReply.bumped_on = DATE;
      threadToAddReply.replies.push({
        text: text,
        delete_password: delete_password,
        created_on: DATE,
        reported: false,
      });
      await foundBoard.save();
      return res.json(threadToAddReply);
    }
  });
  //Viewing a single thread with all replies: GET request to /api/replies/{board}
  app.route('/api/replies/:board').get(async (req, res) => {
    const boardName = req.params.board;
    const  threadId  = req.query.thread_id;
    const foundBoard = await findBoard(boardName);
    if (!foundBoard) {
      return res.send('Board not found');
    } else {
      const foundThread = foundBoard.threads.id(threadId);
      const replies = foundThread.replies.map(reply => {
        return {
          _id: reply._id,
          text: reply.text,
          created_on: reply.created_on,
        };
      });
      const thread = {
        _id: foundThread._id,
        text: foundThread.text,
        created_on: foundThread.created_on,
        bumped_on: foundThread.bumped_on,
        replies: replies,
        replycount: foundThread.replies.length,
      };
      res.json(thread);
    }
  });

  //Deleting a reply 
  app.route('/api/replies/:board').delete(async (req, res) => {
    const { thread_id, reply_id, delete_password } = req.body;
    const board = req.params.board;
    if (!board || !thread_id || !reply_id || !delete_password) {
      return res.send('missing inputs');
    }
    const foundBoard = await findBoard(board);
    if (!foundBoard) {
      return res.send('Board not found');
    } else {
      let thread = foundBoard.threads.id(thread_id);
      let reply = thread.replies.id(reply_id);
      if (reply.delete_password !== delete_password) {
        return res.send('incorrect password');
      } else {
        reply.text = '[deleted]';
        await foundBoard.save();
        return res.send('success');
      }
    }
  });
  //Reporting a reply: PUT request to /api/replies/{board}
  app.route('/api/replies/:board').put(async (req, res) => {
    const { thread_id, reply_id } = req.body;
    const board = req.params.board;
    if (!board || !thread_id || !reply_id) {
      return res.send('missing inputs');
    }
    const foundBoard = await findBoard(board);
    if (!foundBoard) {
      return res.send('Board not found');
    } else {
      let thread = foundBoard.threads.id(thread_id);
      let reply = thread.replies.id(reply_id);
      reply.bumped_on = new Date();
      reply.reported = true;
      await foundBoard.save();
      return res.send('reported');
    }
  });
};
