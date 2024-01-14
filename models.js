const mongoose = require('mongoose');
const { Schema } = mongoose;
const ReplySchema = new Schema({
    text: { type: String, required: true , maxlength: 100},
    delete_password: { type: String, required: true },
    created_on: { type: Date, default: Date.now },
    reported: { type: Boolean, default: false },
    bumped_on: { type: Date, default: Date.now }
});
const Reply = mongoose.model('Reply', ReplySchema);

const ThreadSchema = new Schema({
    text: { type: String, required: true , maxlength: 200},
    delete_password: { type: String, required: true },
    created_on: { type: Date, default: Date.now },
    replies: { type: [ReplySchema], default: [] },
    reported: { type: Boolean, default: false },
    bumped_on: { type: Date, default: Date.now },
});
const Thread = mongoose.model('Thread', ThreadSchema);

const BoardSchema = new Schema({
    board_name: { type: String},
    threads: { type: [ThreadSchema], default: [] },
});
const Board = mongoose.model('Board', BoardSchema);

exports.Board = Board;
exports.Thread = Thread;
exports.Reply = Reply;