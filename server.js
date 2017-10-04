// server.js
const randomColor = require('randomcolor')
const express = require('express');
const SocketServer = require('ws').Server;
const uuid4 = require ('uuid/v4')

// Set the port to 3001
const PORT = 3001;


// Create a new express server
const server = express()
// Make the express server serve static assets (html, javascript, css) from the /public folder
.use(express.static('public'))
.listen(PORT, '0.0.0.0', 'localhost', () => console.log(`Listening on ${ PORT }`));

// Create the WebSockets server
const wss = new SocketServer({ server });
let messageBuffer = []
let clientCount = 0
let userList = {}

// Set up a callback that will run when a client connects to the server
// When a client connects they are assigned a socket, represented by
// the ws parameter in the callback.
wss.on('connection', (client) => {
  // console.log('Client connected, sending buffer');
  // client.send(JSON.stringify(messageBuffer))
  newConnection(client)
  
  client.onmessage = (event) => {
    let msg = JSON.parse(event.data)
    msg.uuid = uuid4()
    switch(msg.type) {
      case "postMessage":
        msg.type = 'incomingMessage'
        msg.color = userList[msg.userid].color
        break
      case "postNotification":
        msg.type = 'incomingNotification'
        msg.color = userList[msg.userid].color
        break
      default:
        console.log(msg.type)
    }
    bufferMessage(msg)
    broadcast(msg)
  }
  // Set up a callback for when a client closes the socket. This usually means they closed their browser.
  client.on('close', () => {
    console.log('Client disconnected')
    clientCount--
    sendCount(clientCount)
  });
});

function bufferMessage(msg) {
  if (messageBuffer.length <= 10) {
    messageBuffer.push(msg)
  } else {
    messageBuffer.shift().push(msg)
  }
}

function newConnection (client) {
  console.log("Client connected")
  clientCount ++
  sendCount (clientCount)
  if (messageBuffer.length){
    client.send(JSON.stringify(messageBuffer))
  }
  let user = {
    userid: uuid4(),
    color: randomColor()
  }
  let content = {
    type: 'incomingUser',
    content: user
  }
  userList[user.userid] = user
  client.send(JSON.stringify(content))
}
  
function broadcast(msg) {
  wss.clients.forEach(function each(client) {
    client.send(JSON.stringify(msg))
  })
}
        
function sendCount (clientCount) {
  let msg = {
    type: 'incomingCount',
    content: clientCount,
    uuid: uuid4()
  }
  broadcast(msg)
}