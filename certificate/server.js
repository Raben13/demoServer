var connect = require('connect');
var fs = require('fs');
var http = require('http');
var https = require('https');
var app = connect();
app.use(connect.static(__dirname));


fs.stat('certificates/server.key', function(err, stat) {
    if(err == null) {
      https.createServer({
        key: fs.readFileSync('./server.key'),
        cert: fs.readFileSync('./server.crt')
      }, app).listen(8081);
    } else {
        console.warn("HTTPS server instance failed to start as" +
        + " certificate failed to load\n" +
        "Error (for certificates/server.key): " + err.code);
    }
});

// websocket to the client.

var express  = require('express');  
var soApp    = express();  
var serverIo = require('http').createServer(soApp);  
var io 		 = require('socket.io')(serverIo);	
serverIo.listen(8044);  

var request = require('request');


io.sockets.on('connection', function(socket) {  
    socket.on('message', function (message) {
      request.post({
        headers: {'content-type' : 'application/json'},
        url:     'http://localhost:5230/api/webrtc/',
        body:    message
      }, function(error, response, body){

         if (error) return;
         socket.emit('message',body)
      });
       });
    socket.on('join', function(data) {
        //console.log(data);
    });
    socket.emit('message', { message: 'welcome to the chat' });

});	
// Callback request


var express = require('express');
var rest = express();
var server = app.listen(8082, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)

})

rest.get('/client', function (req, res) {
   fs.readFile( __dirname + "/" + "users.json", 'utf8', function (err, data) {
       console.log( data );
       res.end( data );
   });
})
rest.post('/client', function (req, res) {
   // First read existing users.
   fs.readFile( __dirname + "/" + "users.json", 'utf8', function (err, data) {
       data = JSON.parse( data );
       data["user4"] = user["user4"];
       console.log( data );
       res.end( JSON.stringify(data));
   });
})
