
var localVideo;
var remoteVideo;
var peerConnection;
var uuid;
var peerConnectionConfig =
{
  'iceServers': [
    {
      'url': 'stun:stun.l.google.com:19302'
    },
    {
      'url': 'turn:192.158.29.39:3478?transport=udp',
      'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      'username': '28224511:1379330808'
    },
    {
      'url': 'turn:192.158.29.39:3478?transport=tcp',
      'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      'username': '28224511:1379330808'
    }
  ]
};

function pageReady() {
    uuid = uuid();

    localVideo = document.getElementById('localVideo');
    remoteVideo = document.getElementById('remoteVideo');


    var constraints = {
        video: false,
        audio: true,
    };

    if(navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia(constraints).then(getUserMediaSuccess).catch(errorHandler);
    } else {
        alert('Your browser does not support getUserMedia API');
    }
}

function getUserMediaSuccess(stream) {
    localStream = stream;
    localVideo.src = window.URL.createObjectURL(stream);
}

function start(isCaller) {
        var pc_constraints = {
            "optional": [{"DtlsSrtpKeyAgreement": true}]
        };
    peerConnection = new RTCPeerConnection(peerConnectionConfig,pc_constraints);
    peerConnection.onaddstream = gotRemoteStream;
    peerConnection.addStream(localStream);
    peerConnection.onicecandidate = gotIceCandidate;

    if(isCaller) {
        peerConnection.createOffer().then(createdDescription).catch(errorHandler);
    }
}

function sendMediabridgeRequest(sdp) {
jQuery.support.cors = true;
$.ajax({
                type: "POST",
                url: "http://localhost:5230/api/webrtc/",
                //url: "http://media24-test.internal:3000/api/webrtc",
                dataType: 'json',
                data: JSON.stringify({ 
            "offer": sdp, 
            "callback_url": "http://localhost", 
            "sync":true
        }),
        contentType: "application/json",
                success: function(data){
            console.log(data); 
         // /  gotMessageFromServer(data);
                }
        
        });
}
function gotMessageFromServer(message) {
    if(!peerConnection) start(false);

    signal = message;
    if(signal.sdp) {
        peerConnection.setRemoteDescription(new RTCSessionDescription({"type":"answer", "sdp": signal.sdp}))
    } else if(signal.ice) {
        peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
    }
}

function gotIceCandidate(event) {
    console.log('Candidate:' + event);
    if(event.candidate == null) {
      console.log(peerConnection.localDescription);
      sendMediabridgeRequest(peerConnection.localDescription.sdp);
    }
}



function createdDescription(description) {
    console.log('got description');

    peerConnection.setLocalDescription(description).then(function() {
    //  sendMediabridgeRequest(peerConnection.localDescription.sdp);
    }).catch(errorHandler);
}

function gotRemoteStream(event) {
    console.log('got remote stream');
    remoteVideo.src = window.URL.createObjectURL(event.stream);
}

function errorHandler(error) {
    console.log(error);
}

// Taken from http://stackoverflow.com/a/105074/515584
// Strictly speaking, it's not a real UUID, but it gets the job done here
function uuid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }

  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
