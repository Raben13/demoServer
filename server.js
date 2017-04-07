var connect = require('connect');
var fs = require('fs');
var http = require('http');
var https = require('https');
var app = connect();
app.use(connect.static(__dirname));
var io ;
var client = [];
var test = [];
fs.stat('certificate/server.key', function(err, stat) {
    if(err == null) {
      server = https.createServer({
        key: fs.readFileSync('certificate/server.key'),
        cert: fs.readFileSync('certificate/server.crt')
      }, app).listen(8081);
      var express  = require('express');  
      var soApp    = express();  
      io     = require('socket.io')(server);  
      var request = require('request');
      console.log("Listen port 8081: OK")

      io.sockets.on('connection', function(socket) {  
          socket.on('message', function (message) {
            var msg = JSON.parse(message);
            client[msg.call_id] = socket.id;
            socket.join('video');

            console.log(msg)
            request.post({
              headers: {'content-type' : 'application/json'},
              url: msg.offer != undefined ? 'http://localhost:5230/api/webrtc/' : 'http://localhost:5230/api/webrtc/answer',
              body:    JSON.stringify(msg)
            }, function(error, response, body){
               if (error){ 
                return
               };
               socket.emit('message',body)
            });
             });
          socket.on('join', function(data) {
              //console.log(data);
          });
      }); 
    } else {
        console.warn("HTTPS server instance failed to start as" +
        + " certificate failed to load\n" +
        "Error (for certificates/server.key): " + err.code);
    }
});



// Callback request


var express = require('express');
var rest = express();
var bodyParser = require("body-parser");

rest.use(bodyParser.urlencoded({ extended: false }));
rest.use(bodyParser.json());

var server = rest.listen(8082, function () {
var host = server.address().address
var port = server.address().port

})

rest.post('*', function (req, res) {
    if (req.body){
      // line just to fix fix socket io bug..
      var msg2 = JSON.stringify(req.body).replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
      
      var msg = JSON.parse(msg2)
      console.warn(msg.Body, client[msg.Call_id])
      
      if (req.body.janus == "destroy"){
          io.to('video').emit('disconnect', req.body)
      }else{
        io.to(client[msg.Call_id]).emit('message',msg.Body);
      }
    res.end();
}
   

});
