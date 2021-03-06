var OV;
var session;


/* OPENVIDU METHODS */

function joinSession() {

	var sessionId = document.getElementById("sessionId").value;
	var userName = document.getElementById("userName").value;

	// --- 1) Get an OpenVidu object and init a session with a sessionId ---

	// Init OpenVidu object
	OV = new OpenVidu();

	// We will join the video-call "sessionId". As there's no server, this parameter must start with the URL of 
	// OpenVidu Server (with secure websocket protocol: "wss://") and must include the OpenVidu secret at the end
	session = OV.initSession("wss://" + location.hostname + ":8443/" + sessionId + '?secret=MY_SECRET');


	// --- 2) Specify the actions when events take place ---

	// On every new Stream received...
	session.on('streamCreated', function (event) {

		// Subscribe to the Stream to receive it. HTML video will be appended to element with 'video-container' id
		var subscriber = session.subscribe(event.stream, 'video-container');

		// When the HTML video has been appended to DOM...
		subscriber.on('videoElementCreated', function (event) {

			// Add a new <p> element for the user's nickname just below its video
			appendUserData(event.element, subscriber.stream.connection);
		});
	});

	// On every Stream destroyed...
	session.on('streamDestroyed', function (event) {

		// Delete the HTML element with the user's nickname. HTML videos are automatically removed from DOM
		removeUserData(event.stream.connection);
	});


	// --- 3) Connect to the session ---

	// First param irrelevant if your app has no server-side. Second param will be received by every user
	// in Stream.connection.data property, which will be appended to DOM as the user's nickname
	session.connect(null, '{"clientData": "' + userName + '"}', function (error) {

		// If the connection is successful, initialize a publisher and publish to the session
		if (!error) {

			// --- 4) Get your own camera stream with the desired resolution ---

			var publisher = OV.initPublisher('video-container', {
				audio: true,        // Whether you want to transmit audio or not
				video: true,        // Whether you want to transmit video or not
				audioActive: true,  // Whether you want to start the publishing with your audio unmuted or muted
				videoActive: true,  // Whether you want to start the publishing with your video enabled or disabled
				quality: 'MEDIUM',  // The quality of your video ('LOW', 'MEDIUM', 'HIGH')
				screen: false       // true to get your screen as video source instead of your camera
			});

			// When our HTML video has been added to DOM...
			publisher.on('videoElementCreated', function (event) {
				initMainVideo(event.element, userName);
				appendUserData(event.element, userName);
				event.element['muted']  = true;
			});

			// --- 5) Publish your stream ---

			session.publish(publisher);

		} else {
			console.log('There was an error connecting to the session:', error.code, error.message);
		}
	});

	document.getElementById('session-title').innerText = sessionId;
	document.getElementById('join').style.display = 'none';
	document.getElementById('session').style.display = 'block';

	return false;
}

function leaveSession() {

	// --- 6) Leave the session by calling 'disconnect' method over the Session object ---

	session.disconnect();

	// Removing all HTML elements with the user's nicknames. 
	// HTML videos are automatically removed when leaving a Session
	removeAllUserData();

	// Back to 'Join session' page
	document.getElementById('join').style.display = 'block';
	document.getElementById('session').style.display = 'none';
}

/* OPENVIDU METHODS */




/* APPLICATION SPECIFIC METHODS */

window.addEventListener('load', function () {
	generateParticipantInfo();
});

window.onbeforeunload = function () {
	if (session) session.disconnect();
};

function generateParticipantInfo() {
	document.getElementById("sessionId").value = "SessionA";
	document.getElementById("userName").value = "Participant" + Math.floor(Math.random() * 100);
}

function appendUserData(videoElement, connection) {
	var userData;
	var nodeId;
	if (typeof connection === "string") {
		userData = connection;
		nodeId = connection;
	} else {
		userData = JSON.parse(connection.data).clientData;
		nodeId = connection.connectionId;
	}
	var dataNode = document.createElement('div');
	dataNode.className = "data-node";
	dataNode.id = "data-" + nodeId;
	dataNode.innerHTML = "<p>" + userData + "</p>";
	videoElement.parentNode.insertBefore(dataNode, videoElement.nextSibling);
	addClickListener(videoElement, userData);
}

function removeUserData(connection) {
	var dataNode = document.getElementById("data-" + connection.connectionId);
	dataNode.parentNode.removeChild(dataNode);
}

function removeAllUserData() {
	var nicknameElements = document.getElementsByClassName('data-node');
	while (nicknameElements[0]) {
		nicknameElements[0].parentNode.removeChild(nicknameElements[0]);
	}
}

function addClickListener(videoElement, userData) {
	videoElement.addEventListener('click', function () {
		var mainVideo = document.querySelector('#main-video video');
		var mainUserData = document.querySelector('#main-video p');
		if (mainVideo.srcObject !== videoElement.srcObject) {
			mainUserData.innerHTML = userData;
			mainVideo.srcObject = videoElement.srcObject;
		}
	});
}

function initMainVideo(videoElement, userData) {
	document.querySelector('#main-video video').srcObject = videoElement.srcObject;
	document.querySelector('#main-video p').innerHTML = userData;
	document.querySelector('#main-video video')['muted'] = true;
}

/* APPLICATION SPECIFIC METHODS */