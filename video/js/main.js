/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';

var getMediaButton = document.querySelector('button#getMedia');
var connectButton = document.querySelector('button#connect');
var hangupButton = document.querySelector('button#hangup');

getMediaButton.onclick = getMedia;
connectButton.onclick = createPeerConnection;
hangupButton.onclick = hangup;

var minWidthInput = document.querySelector('div#minWidth input');
var maxWidthInput = document.querySelector('div#maxWidth input');
var minHeightInput = document.querySelector('div#minHeight input');
var maxHeightInput = document.querySelector('div#maxHeight input');
var minFramerateInput = document.querySelector('div#minFramerate input');
var maxFramerateInput = document.querySelector('div#maxFramerate input');


var getUserMediaConstraintsDiv =
  document.querySelector('div#getUserMediaConstraints');
var bitrateDiv = document.querySelector('div#bitrate');
var peerDiv = document.querySelector('div#peer');
var senderStatsDiv = document.querySelector('div#senderStats');
var receiverStatsDiv = document.querySelector('div#receiverStats');

var localVideo = document.querySelector('div#localVideo video');
var remoteVideo = document.querySelector('div#remoteVideo video');
var remoteVideo2 = document.querySelector('div#remoteVideo2 video');
var remoteVideo3 = document.querySelector('div#remoteVideo3 video');

var localVideoStatsDiv = document.querySelector('div#localVideo div');
var remoteVideoStatsDiv = document.querySelector('div#remoteVideo div');

var localPeerConnection;
var remotePeerConnection;
var localStream;
var bytesPrev;
var timestampPrev;
var pc2;
var streamNumber = 0;
var windowsSession = [];
var peerConnectionA = [];
main();

//var socket = io('https://52.11.122.165:8081');

var socket = io('https://localhost:8081');
socket.on('connect', function() {
  trace('Succesfully CONNCETED to the client servers');

});
socket.on('event', function(data) {});
socket.on('disconnect', function() {});

function main() {}
var peerConnectionConfig = {
  'iceServers': [{
    'url': 'stun:stun.l.google.com:19302'
  }, ]
};

function hangup() {
  trace('Ending call');
  localPeerConnection.close();
  remotePeerConnection.close();
  localPeerConnection = null;
  remotePeerConnection = null;

  localStream.getTracks().forEach(function(track) {
    track.stop();
  });
  localStream = null;

  hangupButton.disabled = true;
  getMediaButton.disabled = false;
}

function getMedia() {
  getMediaButton.disabled = true;
  if (localStream) {
    localStream.getTracks().forEach(function(track) {
      track.stop();
    });
    var videoTracks = localStream.getVideoTracks();
    for (var i = 0; i !== videoTracks.length; ++i) {
      videoTracks[i].stop();
    }
  }
  navigator.mediaDevices.getUserMedia(getUserMediaConstraints())
    .then(gotStream)
    .catch(function(e) {
      var message = 'getUserMedia error: ' + e.name + '\n' +
        'PermissionDeniedError may mean invalid constraints.';
      alert(message);
      console.log(message);
      getMediaButton.disabled = false;
    });
}

function gotStream(stream) {
  connectButton.disabled = false;
  console.log('GetUserMedia succeeded');
  localStream = stream;
  localVideo.srcObject = stream;
}

function getUserMediaConstraints() {
  var constraints = {
    "audio": true,
    "video": {
      "width": {
        "min": "300",
        "max": "640"
      },
      "height": {
        "min": "200",
        "max": "480"
      }
    }
  }
  return constraints;
}


function createPeerConnection() {
  connectButton.disabled = true;
  hangupButton.disabled = false;

  bytesPrev = 0;
  timestampPrev = 0;
  localPeerConnection = new RTCPeerConnection(null);
  localPeerConnection.addStream(localStream);
  console.log('localPeerConnection creating offer');
  localPeerConnection.onnegotiationeeded = function() {
    console.log('Negotiation needed - localPeerConnection');
  };

  localPeerConnection.onicecandidate = function(e) {

    if (e.candidate == null) {
      console.log(localPeerConnection.localDescription);
      sendMediabridgeRequest(localPeerConnection.localDescription.sdp, "offer");
    }
  };

  var offerOptions = {
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1,
    voiceActivityDetection: false
  };
  localPeerConnection.createOffer(offerOptions).then(
    function(desc) {
      console.log('localPeerConnection offering');
      localPeerConnection.setLocalDescription(desc);
    })
}

function onAddIceCandidateSuccess() {
  trace('AddIceCandidate success.');
}

function onAddIceCandidateError(error) {
  trace('Failed to add Ice Candidate: ' + error.toString());
}



// Dumping a stats variable as a string.
// might be named toString?
function dumpStats(results) {
  var statsString = '';
  results.forEach(function(res) {
    statsString += '<h3>Report type=';
    statsString += res.type;
    statsString += '</h3>\n';
    statsString += 'id ' + res.id + '<br>\n';
    statsString += 'time ' + res.timestamp + '<br>\n';
    Object.keys(res).forEach(function(k) {
      if (k !== 'timestamp' && k !== 'type' && k !== 'id') {
        statsString += k + ': ' + res[k] + '<br>\n';
      }
    });
  });
  return statsString;
}

// Utility to show the value of a range in a sibling span element
function displayRangeValue(e) {
  var span = e.target.parentElement.querySelector('span');
  span.textContent = e.target.value;
  displayGetUserMediaConstraints();
}

function onSetSessionDescriptionError(error) {
  trace('Failed to set session description: ' + error.toString());
}

function gotMessageFromServer(jsep, session, id) {
  if (jsep.type == "answer") {
    localPeerConnection.setRemoteDescription(new RTCSessionDescription({
      "type": jsep.type,
      "sdp": jsep.sdp
    })).then(
      function() {},
      onSetSessionDescriptionError
    );
  } else {
    newPeer(jsep, session, id, streamNumber)
  }
}

function newPeer(jsep, session, id, streamNumber) {
  console.log('New peer incoming, create new RTC RTCPeerConnection');
  var peerConnection = new RTCPeerConnection(null);
  var windows = selectWindows(test);
  windowsSession[session] = windows;
  peerConnection.onaddstream = function(e) {
    document.querySelector('div#remoteVideo' + windows + ' video').srcObject = e.stream;
  };
  peerConnectionA.push(peerConnection)
  peerConnection.setRemoteDescription(new RTCSessionDescription({
    "type": jsep.type,
    "sdp": jsep.sdp
  }));
  peerConnection.onicecandidate = function(e) {
    if (e.candidate == null) {
      sendMediabridgeRequest(peerConnection.localDescription.sdp, "answer", session + "/" + id)
    }
  };
  peerConnection.createAnswer(function(sessionDescription) {
    peerConnection.setLocalDescription(sessionDescription);
  }, function(error) {
    alert(error);
  }, {
    'mandatory': {}
  });

}

function sendMediabridgeRequest(sdp, type, source) {
  if (type === "offer") {
    socket.emit('message', JSON.stringify({
      "api_key": "321312321131312",
      "offer": sdp,
      "MixerID": "random", // not used
      "MaxLength": 123, // not used
      "callback_url": "http://localhost", // can be used
      "sync": true, // not used
      "janus": true,
      "call_id": getRandomInt(10, 555555).toString(),
    }));
  } else {
    socket.emit('message', JSON.stringify({
      "api_key": "321312321131312",
      "answer": sdp,
      "callback_url": "http://localhost",
      "sync": true,
      "call_id": getRandomInt(10, 555555).toString(),
      "plugin": "echo",
      "id": source,
      "janus": true,
    }));

  }
}

socket.on('message', function(message) {

  if (message.jsep) {
    console.log("RECEIVED EVENT message from the media Bridge : " + JSON.stringify(message.jsep));

    gotMessageFromServer(message.jsep, message.session_id, message.sender)

  }
});

// TO DO 
/*
socket.on('disconnect', function (message) {
  console.log("disconnect" + message.call_id)
  var number = windowsSession[message.call_id] 
  test[number-1][0] = false;
  if (message.call_id){
//      gotMessageFromServer(message.jsep, message.session_id, message.sender )
        document.querySelector('div#remoteVideo'+ number +' video').srcObject = null ;
    }
});
*/

function selectWindows(test) {
  for (var i in test) {
    if (!test[i][0]) {
      test[i][0] = true;
      return test[i][1];
    }
  }
  return 0
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}