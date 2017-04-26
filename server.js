"use strict";

var express = require('express');
var app = express();

var exec = require('mz/child_process').exec;
var readFile = require('mz/fs').readFile;
var fetch = require('node-fetch');
var FormData = require('form-data');

var editCommand = "\"printf '%s\\n' '/Port 22/a' 'Port 3128' . w q " +
    "| ed -s /etc/ssh/sshd_config && service ssh restart\"";

app.use(express.static('public'));

function generateKey() {
  return exec('yes | ssh-keygen -b 2048 -t rsa -q -N "" -f id_rsa');
}

function addKey() {
  var form = new FormData();
  return readFile('id_rsa.pub','utf8').then(pubkey => {
    form.append('ssh_key', pubkey);
    return fetch('http://enter.sandbox.plushu.org/',
      { method: 'POST', body: 'ssh_key=' + encodeURIComponent(pubkey), //form ,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'}}).then(res=>res.text());
  });
}
 
function addPort() {
  return exec('ssh -o UserKnownHostsFile=/dev/null ' +
    '-o StrictHostKeyChecking=no ' +
    '-i id_rsa root@sandbox.plushu.org -- bash -c ' + editCommand);
}

app.get("/", function (request, response, next) {
  return generateKey().then(stdout =>
    addKey()).then(fetchres => 
    addPort(fetchres)).then(stdout => response.send('OK'),
      err => next(err));
});

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

