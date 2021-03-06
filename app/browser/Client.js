'use strict';

const Clipboard = require('./Clipboard');
const DataWrapper = require('./DataWrapper');
const os = require('os');

function connectToWebSocketServer(path, callback, disconnected) {
  path = `http://${path || 'localhost'}:8124`;
  console.log(`Try connect to ${path}`);
  const io = require('socket.io-client');
  const client = io(path, {
    reconnection: false,
    multiplex: false
  });
  client.open();

  client.on('connect', () => {
    console.log(`Connected to Clipboard server ${path}`);
    callback();
  });
  client.on('disconnect', (e) => {
    console.log(`Disconnected from Clipboard server ${path} ${e}`)
    disconnected(e !== 'io client disconnect');
  });
  client.on('message', data => {
    console.log(`[Client] Received from remote: ${JSON.stringify(data, null ,' ')}`);
    Clipboard.putInClip(data);
  });
  client.on('connect_error', (e) => {
    console.log(JSON.stringify(e));
    disconnected(true, e);
  });

  return {
    send: (data) => client.send(data),
    close: () => client.disconnect()
  };
}

function initClipboardClient(path, callback, disconnected) {
  const connection = connectToWebSocketServer(path, callback, disconnected);
  const stopListening = Clipboard.listenChanges(data => connection.send(DataWrapper.wrap(data)));

  return {
    close: () => {
      connection.close();
      stopListening();
    }
  };
}

module.exports = initClipboardClient;
