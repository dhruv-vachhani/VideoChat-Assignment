import "./App.css";
import io from "socket.io-client";
import Peer from "simple-peer";
import React, { useEffect, useRef, useState } from "react";

const socket = io.connect("http://localhost:8000", {
  transports: ["websocket"],
});

function App() {
  const [id, setId] = useState("");
  const [users, setUsers] = useState({});
  const [stream, setStream] = useState();
  const [recevingCall, setRecevingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);

  const userVideo = useRef();
  const peerVideo = useRef();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        setStream(stream);
        userVideo.current.srcObject = stream;
      });

    socket.on("id", (id) => {
      setId(id);
    });

    socket.on("allUser", (userlist) => {
      console.log(userlist);
      setUsers(userlist);
    });

    socket.on("callRequest", (data) => {
      setRecevingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    });
  }, []);

  const acceptCall = () => {
    // incomingCall = null;
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.emit("acceptCall", {
        signal: data,
        to: caller,
      });
    });

    peer.on("stream", (stream) => {
      peerVideo.current.srcObject = stream;
    });

    peer.signal(callerSignal);
  };

  const callPeer = (peerId) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: peerId,
        signalData: data,
        from: id,
      });
    });

    socket.on("stream", (stream) => {
      if (peerVideo.current) {
        peerVideo.current.srcObject = stream;
      }
    });

    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });
  };

  // const endCall = () => {
  //   setCallAccepted(false);
  //   setCaller("");
  // };

  let UserVideo = null;
  if (stream) {
    UserVideo = <video playsInline muted ref={userVideo} autoPlay />;
  }

  let PeerVideo = null;
  if (callAccepted) {
    PeerVideo = <video playsInline ref={peerVideo} autoPlay />;
  }

  let incomingCall;
  if (recevingCall) {
    incomingCall = (
      <div className="incoming-call">
        <p className="text-data">{caller}, is calling you!</p>
        <button className="btn btn-success" onClick={acceptCall}>
          Accept
        </button>
      </div>
    );
  }

  return (
    <div className="App">
      {/* <header className="App-header">Video Chat Application</header> */}
      <div className="row">
        <div className="col-8 video-container align-items-center">
          {UserVideo}
          {PeerVideo}
        </div>
        <div className="col-4 user-list">
          {incomingCall}
          {Object.keys(users).map((key) => {
            if (key === id) {
              return null;
            } else {
              return (
                <div className="user-data">
                  <button
                    className="btn btn-warning"
                    onClick={() => callPeer(key)}
                  >
                    Call
                  </button>
                  <span className="text-data">{key}</span>
                </div>
              );
            }
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
