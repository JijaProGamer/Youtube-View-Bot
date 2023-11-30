const EventEmitter = require('events');
const decisionEmitter = new EventEmitter();

global.decisionTaken = new Promise((r) => {decisionEmitter.once("data", r)})

module.exports = (decision, socket) => {
    decisionEmitter.emit("data", decision)
    global.decisionTaken = new Promise((r) => {decisionEmitter.once("data", r)})
}