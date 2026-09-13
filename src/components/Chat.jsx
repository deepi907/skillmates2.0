import { useEffect, useRef, useState } from "react";
import "./Chat.css";
import { io } from "socket.io-client";
const API_URL = import.meta.env.VITE_API_URL;
function Chat({ user, onClose }) {
  // =========================================================
  // SOCKET / WEBRTC REFS
  // =========================================================

  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);

  const pendingIceCandidatesRef = useRef([]);
  const pendingOfferRef = useRef(null);

  const callAcceptedRef = useRef(false);

  // =========================================================
  // CHAT STATES
  // =========================================================

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [minimized, setMinimized] = useState(false);

  // =========================================================
  // CALL STATES
  // =========================================================

  const [callOpen, setCallOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);

  const [incomingCall, setIncomingCall] = useState(null);

  // Voice
  const [micOn, setMicOn] = useState(false);
  const [localStream, setLocalStream] = useState(null);

  // Video
  const [videoMicOn, setVideoMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [videoStream, setVideoStream] = useState(null);

  // Remote
  const [remoteStream, setRemoteStream] = useState(null);

  // =========================================================
  // VIDEO / AUDIO REFS
  // =========================================================

  const videoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // =========================================================
  // CURRENT USER
  // =========================================================

  const loggedInUser = JSON.parse(
    localStorage.getItem("skillmateUser") || "null"
  );

  const myUserId = loggedInUser?.id;

  // =========================================================
  // REMOTE AUDIO
  // IMPORTANT: ALSO WORKS FOR VOICE CALL
  // =========================================================

  useEffect(() => {
    if (!remoteAudioRef.current || !remoteStream) {
      return;
    }

    remoteAudioRef.current.srcObject = remoteStream;

    remoteAudioRef.current
      .play()
      .catch((error) => {
        console.log("Remote audio waiting:", error);
      });
  }, [remoteStream]);

  // =========================================================
  // CREATE WEBRTC PEER CONNECTION
  // =========================================================

  const createPeerConnection = (targetUserId) => {
    console.log(
      "🔗 Creating peer connection with:",
      targetUserId
    );

    const peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
        {
          urls: "stun:stun1.l.google.com:19302",
        },
      ],
    });

    peerConnectionRef.current = peer;

    // =======================================================
    // ICE CANDIDATE
    // =======================================================

    peer.onicecandidate = (event) => {
      if (!event.candidate) {
        return;
      }

      console.log("🧊 Sending ICE candidate");

      socketRef.current?.emit(
        "webrtc-ice-candidate",
        {
          receiverId: targetUserId,
          senderId: myUserId,
          candidate: event.candidate,
        }
      );
    };

    // =======================================================
    // REMOTE MEDIA
    // =======================================================

    peer.ontrack = (event) => {
      console.log("🎥🎤 Remote media received");

      const stream = event.streams?.[0];

      if (stream) {
        setRemoteStream(stream);
      }
    };

    // =======================================================
    // CONNECTION STATE
    // =======================================================

    peer.onconnectionstatechange = () => {
      console.log(
        "🌐 WebRTC connection:",
        peer.connectionState
      );

      if (
        ["failed", "disconnected", "closed"].includes(
          peer.connectionState
        )
      ) {
        setRemoteStream(null);
      }
    };

    return peer;
  };

  // =========================================================
  // SOCKET.IO CONNECTION
  // =========================================================

  useEffect(() => {
    if (!myUserId) {
      console.log("❌ No logged-in user ID");
      return;
    }

    console.log(
      "🔌 Connecting Socket.IO as user:",
      myUserId
    );

    const socket = io(API_URL, {
      transports: ["polling", "websocket"],
    });

    socketRef.current = socket;

    // =======================================================
    // CONNECTED
    // =======================================================

    socket.on("connect", () => {
      console.log(
        "✅ Socket.IO connected:",
        socket.id
      );

      socket.emit("join", myUserId);

      console.log(
        `👤 Joined room: user-${myUserId}`
      );
    });

    // =======================================================
    // RECEIVE MESSAGE
    // =======================================================

    socket.on("receive-message", (data) => {
      console.log(
        "💬 Message received:",
        data
      );

      setMessages((prev) => [
        ...prev,
        {
          text: data.message,
          sender: "other",
        },
      ]);
    });

    // =======================================================
    // INCOMING CALL
    // =======================================================

    socket.on("incoming-call", (callData) => {
      console.log(
        "📞📞 INCOMING CALL:",
        callData
      );

      callAcceptedRef.current = false;

      setIncomingCall(callData);
    });

    // =======================================================
    // WEBRTC OFFER RECEIVED
    // =======================================================

    socket.on("webrtc-offer", async (data) => {
      console.log(
        "📨 WebRTC offer received:",
        data
      );

      try {
        const {
          senderId,
          offer,
          callType,
        } = data;

        if (!senderId || !offer) {
          console.error(
            "❌ Invalid WebRTC offer"
          );
          return;
        }

        // ===================================================
        // USER HAS NOT ACCEPTED CALL YET
        // SAVE OFFER
        // ===================================================

        if (!callAcceptedRef.current) {
          console.log(
            "⏳ Call not accepted yet. Saving offer."
          );

          pendingOfferRef.current = data;

          return;
        }

        // ===================================================
        // GET PEER
        // ===================================================

        let peer =
          peerConnectionRef.current;

        // If peer doesn't exist yet, save offer.
        if (!peer) {
          console.log(
            "⏳ Peer not ready. Saving offer."
          );

          pendingOfferRef.current = data;

          return;
        }

        // ===================================================
        // APPLY REMOTE OFFER
        // ===================================================

        await peer.setRemoteDescription(
          new RTCSessionDescription(offer)
        );

        console.log(
          "✅ Remote offer applied"
        );

        // ===================================================
        // CREATE ANSWER
        // ===================================================

        const answer =
          await peer.createAnswer();

        await peer.setLocalDescription(answer);

        console.log(
          "📤 Sending WebRTC answer"
        );

        // ===================================================
        // SEND ANSWER
        // ===================================================

        socketRef.current?.emit(
          "webrtc-answer",
          {
            receiverId: senderId,
            senderId: myUserId,
            answer,
            callType,
          }
        );

        console.log(
          "✅ WebRTC answer sent"
        );

        // ===================================================
        // ADD PENDING ICE
        // ===================================================

        if (
          pendingIceCandidatesRef.current
            .length > 0
        ) {
          console.log(
            "🧊 Adding pending ICE:",
            pendingIceCandidatesRef.current.length
          );

          for (
            const candidate of
            pendingIceCandidatesRef.current
          ) {
            try {
              await peer.addIceCandidate(
                candidate
              );
            } catch (error) {
              console.error(
                "❌ Pending ICE error:",
                error
              );
            }
          }

          pendingIceCandidatesRef.current = [];
        }

      } catch (error) {
        console.error(
          "❌ WebRTC offer handling error:",
          error
        );
      }
    });

    // =======================================================
    // WEBRTC ANSWER RECEIVED
    // =======================================================

    socket.on(
      "webrtc-answer",
      async (data) => {
        console.log(
          "📨 WebRTC answer received:",
          data
        );

        try {
          const peer =
            peerConnectionRef.current;

          if (!peer) {
            console.error(
              "❌ No peer connection available"
            );
            return;
          }

          await peer.setRemoteDescription(
            new RTCSessionDescription(
              data.answer
            )
          );

          console.log(
            "✅ Remote answer applied"
          );

        } catch (error) {
          console.error(
            "❌ WebRTC answer error:",
            error
          );
        }
      }
    );

    // =======================================================
    // WEBRTC ICE CANDIDATE
    // =======================================================

    socket.on(
      "webrtc-ice-candidate",
      async (data) => {
        console.log(
          "🧊 ICE candidate received"
        );

        try {
          const candidate =
            new RTCIceCandidate(
              data.candidate
            );

          const peer =
            peerConnectionRef.current;

          if (
            peer &&
            peer.remoteDescription
          ) {
            await peer.addIceCandidate(
              candidate
            );
          } else {
            console.log(
              "⏳ Saving ICE candidate"
            );

            pendingIceCandidatesRef.current.push(
              candidate
            );
          }

        } catch (error) {
          console.error(
            "❌ ICE candidate error:",
            error
          );
        }
      }
    );

    // =======================================================
    // CALL ACCEPTED
    // =======================================================

    socket.on(
      "call-accepted",
      ({ senderId }) => {
        console.log(
          "✅ Call accepted by:",
          senderId
        );
      }
    );

    // =======================================================
    // CALL REJECTED
    // =======================================================

    socket.on(
      "call-rejected",
      () => {
        console.log(
          "❌ Call rejected"
        );

        alert(
          "Call was rejected."
        );

        endAllCalls();
      }
    );

    // =======================================================
    // CALL ENDED
    // =======================================================

    socket.on(
      "call-ended",
      () => {
        console.log(
          "📞 Call ended by other user"
        );

        endAllCalls();
      }
    );

    // =======================================================
    // DISCONNECT
    // =======================================================

    socket.on(
      "disconnect",
      () => {
        console.log(
          "❌ Socket.IO disconnected"
        );
      }
    );

    // =======================================================
    // CLEANUP SOCKET
    // =======================================================

    return () => {
      console.log(
        "🔌 Disconnecting Socket.IO"
      );

      socket.disconnect();

      socketRef.current = null;
    };
  }, [myUserId]);

  // =========================================================
  // START VOICE CALL
  // =========================================================

  const startVoiceCall = async () => {
    console.log(
      "📞 Starting voice call"
    );

    if (!socketRef.current) {
      alert(
        "Socket connection is not ready."
      );
      return;
    }

    if (!myUserId) {
      alert(
        "Logged-in user not found."
      );
      return;
    }

    if (!user?.id) {
      alert(
        "The SkillMate user was not found."
      );
      return;
    }

    const targetUserId =
      user.id;

    try {
      // ===================================================
      // GET MICROPHONE
      // ===================================================

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      console.log(
        "🎤 Microphone connected"
      );

      setLocalStream(stream);
      setMicOn(true);
      setCallOpen(true);

      // ===================================================
      // CREATE PEER
      // ===================================================

      const peer =
        createPeerConnection(
          targetUserId
        );

      stream
        .getTracks()
        .forEach((track) => {
          peer.addTrack(
            track,
            stream
          );
        });

      // ===================================================
      // SEND CALL SIGNAL
      // ===================================================

      socketRef.current.emit(
        "call-user",
        {
          receiverId:
            targetUserId,

          senderId:
            myUserId,

          callerName:
            loggedInUser?.name ||
            "SkillMate",

          callType:
            "voice",
        }
      );

      // ===================================================
      // CREATE OFFER
      // ===================================================

      const offer =
        await peer.createOffer();

      await peer.setLocalDescription(
        offer
      );

      console.log(
        "📤 Sending voice WebRTC offer"
      );

      socketRef.current.emit(
        "webrtc-offer",
        {
          receiverId:
            targetUserId,

          senderId:
            myUserId,

          offer,

          callType:
            "voice",
        }
      );

    } catch (error) {
      console.error(
        "❌ Microphone error:",
        error
      );

      setMicOn(false);
      setLocalStream(null);
      setCallOpen(false);

      if (
        error.name ===
        "NotAllowedError"
      ) {
        alert(
          "Microphone permission was denied."
        );
      } else {
        alert(
          "Could not access microphone."
        );
      }
    }
  };

  // =========================================================
  // START VIDEO CALL
  // IMPORTANT:
  // OUTGOING CALL DOES NOT PROCESS pendingOffer
  // =========================================================

  const startVideoCall = async () => {
    console.log(
      "📹 Starting video call"
    );

    if (!socketRef.current) {
      alert(
        "Socket connection is not ready."
      );
      return;
    }

    if (!myUserId) {
      alert(
        "Logged-in user not found."
      );
      return;
    }

    if (!user?.id) {
      alert(
        "The SkillMate user was not found."
      );
      return;
    }

    const targetUserId =
      user.id;

    try {
      // ===================================================
      // CAMERA + MICROPHONE
      // ===================================================

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });

      console.log(
        "🎥 Camera + microphone connected"
      );

      setVideoStream(stream);
      setVideoMicOn(true);
      setCameraOn(true);
      setVideoOpen(true);

      // ===================================================
      // CREATE PEER
      // ===================================================

      const peer =
        createPeerConnection(
          targetUserId
        );

      stream
        .getTracks()
        .forEach((track) => {
          peer.addTrack(
            track,
            stream
          );
        });

      // ===================================================
      // SEND CALL SIGNAL
      // ===================================================

      socketRef.current.emit(
        "call-user",
        {
          receiverId:
            targetUserId,

          senderId:
            myUserId,

          callerName:
            loggedInUser?.name ||
            "SkillMate",

          callType:
            "video",
        }
      );

      // ===================================================
      // CREATE VIDEO OFFER
      // ===================================================

      const offer =
        await peer.createOffer();

      await peer.setLocalDescription(
        offer
      );

      console.log(
        "📤 Sending video WebRTC offer"
      );

      // ===================================================
      // SEND OFFER
      // ===================================================

      socketRef.current.emit(
        "webrtc-offer",
        {
          receiverId:
            targetUserId,

          senderId:
            myUserId,

          offer,

          callType:
            "video",
        }
      );

      console.log(
        "✅ Video offer sent"
      );

    } catch (error) {
      console.error(
        "❌ Camera/microphone error:",
        error
      );

      setVideoMicOn(false);
      setCameraOn(false);
      setVideoStream(null);
      setVideoOpen(false);

      alert(
        "Could not access camera or microphone."
      );
    }
  };

  // =========================================================
  // ACCEPT INCOMING CALL
  // =========================================================

  const acceptIncomingCall =
    async () => {
      if (!incomingCall) {
        return;
      }

      const callerId =
        incomingCall.senderId;

      if (!callerId) {
        console.error(
          "❌ Incoming call has no senderId"
        );
        return;
      }

      console.log(
        "✅ Accepting incoming call:",
        incomingCall
      );

      // ===================================================
      // MARK ACCEPTED
      // ===================================================

      callAcceptedRef.current = true;

      // ===================================================
      // SAVE CALL DATA BEFORE CLEARING STATE
      // ===================================================

      const callType =
        incomingCall.callType;

      setIncomingCall(null);

      // ===================================================
      // TELL CALLER
      // ===================================================

      socketRef.current?.emit(
        "call-accepted",
        {
          receiverId:
            callerId,

          senderId:
            myUserId,
        }
      );

      // ===================================================
      // INCOMING VOICE CALL
      // ===================================================

      if (callType === "voice") {
        try {
          const stream =
            await navigator.mediaDevices.getUserMedia({
              audio: true,
            });

          setLocalStream(stream);
          setMicOn(true);
          setCallOpen(true);

          const peer =
            createPeerConnection(
              callerId
            );

          stream
            .getTracks()
            .forEach((track) => {
              peer.addTrack(
                track,
                stream
              );
            });

          // ===============================================
          // PROCESS SAVED OFFER
          // ===============================================

          const pendingOffer =
            pendingOfferRef.current;

          if (
            pendingOffer &&
            pendingOffer.senderId ===
              callerId
          ) {
            pendingOfferRef.current =
              null;

            await processPendingOffer(
              peer,
              pendingOffer,
              callerId
            );
          }

          console.log(
            "🎤 Incoming voice call accepted"
          );

        } catch (error) {
          console.error(
            "❌ Microphone error:",
            error
          );

          callAcceptedRef.current =
            false;
        }

        return;
      }

      // ===================================================
      // INCOMING VIDEO CALL
      // ===================================================

      if (callType === "video") {
        try {
          const stream =
            await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: true,
            });

          setVideoStream(stream);
          setVideoMicOn(true);
          setCameraOn(true);
          setVideoOpen(true);

          const peer =
            createPeerConnection(
              callerId
            );

          stream
            .getTracks()
            .forEach((track) => {
              peer.addTrack(
                track,
                stream
              );
            });

          // ===============================================
          // PROCESS SAVED OFFER
          // ===============================================

          const pendingOffer =
            pendingOfferRef.current;

          if (
            pendingOffer &&
            pendingOffer.senderId ===
              callerId
          ) {
            pendingOfferRef.current =
              null;

            await processPendingOffer(
              peer,
              pendingOffer,
              callerId
            );
          }

          console.log(
            "📹 Incoming video call accepted"
          );

        } catch (error) {
          console.error(
            "❌ Camera/microphone error:",
            error
          );

          callAcceptedRef.current =
            false;
        }
      }
    };

  // =========================================================
  // PROCESS PENDING OFFER
  // THIS IS ONLY FOR THE RECEIVER
  // =========================================================

  const processPendingOffer =
    async (
      peer,
      pendingOffer,
      callerId
    ) => {
      try {
        console.log(
          "📨 Processing pending WebRTC offer"
        );

        await peer.setRemoteDescription(
          new RTCSessionDescription(
            pendingOffer.offer
          )
        );

        console.log(
          "✅ Pending offer applied"
        );

        // =================================================
        // CREATE ANSWER
        // =================================================

        const answer =
          await peer.createAnswer();

        await peer.setLocalDescription(
          answer
        );

        console.log(
          "📤 Sending answer"
        );

        socketRef.current?.emit(
          "webrtc-answer",
          {
            receiverId:
              callerId,

            senderId:
              myUserId,

            answer,

            callType:
              pendingOffer.callType,
          }
        );

        console.log(
          "✅ Answer sent to caller"
        );

        // =================================================
        // ADD PENDING ICE
        // =================================================

        if (
          pendingIceCandidatesRef.current
            .length > 0
        ) {
          console.log(
            "🧊 Adding pending ICE:",
            pendingIceCandidatesRef.current.length
          );

          for (
            const candidate of
            pendingIceCandidatesRef.current
          ) {
            try {
              await peer.addIceCandidate(
                candidate
              );
            } catch (error) {
              console.error(
                "❌ ICE candidate error:",
                error
              );
            }
          }

          pendingIceCandidatesRef.current =
            [];
        }

      } catch (error) {
        console.error(
          "❌ Pending offer error:",
          error
        );
      }
    };

  // =========================================================
  // REJECT INCOMING CALL
  // =========================================================

  const rejectIncomingCall = () => {
    if (!incomingCall) {
      return;
    }

    console.log(
      "❌ Rejecting call from:",
      incomingCall.senderId
    );

    socketRef.current?.emit(
      "call-rejected",
      {
        receiverId:
          incomingCall.senderId,
      }
    );

    pendingOfferRef.current =
      null;

    pendingIceCandidatesRef.current =
      [];

    callAcceptedRef.current =
      false;

    setIncomingCall(null);
  };

  // =========================================================
  // END VOICE CALL
  // =========================================================

  const endVoiceCall = () => {
    console.log(
      "📞 Ending voice call"
    );

    if (localStream) {
      localStream
        .getTracks()
        .forEach((track) => {
          track.stop();
        });
    }

    if (
      user?.id &&
      socketRef.current
    ) {
      socketRef.current.emit(
        "end-call",
        {
          receiverId:
            user.id,
        }
      );
    }

    if (
      peerConnectionRef.current
    ) {
      peerConnectionRef.current.close();
      peerConnectionRef.current =
        null;
    }

    pendingOfferRef.current =
      null;

    pendingIceCandidatesRef.current =
      [];

    callAcceptedRef.current =
      false;

    setLocalStream(null);
    setRemoteStream(null);
    setMicOn(false);
    setCallOpen(false);
  };

  // =========================================================
  // END VIDEO CALL
  // =========================================================

  const endVideoCall = () => {
    console.log(
      "📹 Ending video call"
    );

    if (videoStream) {
      videoStream
        .getTracks()
        .forEach((track) => {
          track.stop();
        });
    }

    if (
      user?.id &&
      socketRef.current
    ) {
      socketRef.current.emit(
        "end-call",
        {
          receiverId:
            user.id,
        }
      );
    }

    if (
      peerConnectionRef.current
    ) {
      peerConnectionRef.current.close();
      peerConnectionRef.current =
        null;
    }

    pendingOfferRef.current =
      null;

    pendingIceCandidatesRef.current =
      [];

    callAcceptedRef.current =
      false;

    setVideoStream(null);
    setRemoteStream(null);

    setVideoMicOn(false);
    setCameraOn(false);
    setVideoOpen(false);
  };

  // =========================================================
  // END ALL CALLS
  // =========================================================

  const endAllCalls = () => {
    console.log(
      "🛑 Cleaning up calls"
    );

    if (localStream) {
      localStream
        .getTracks()
        .forEach((track) => {
          track.stop();
        });
    }

    if (videoStream) {
      videoStream
        .getTracks()
        .forEach((track) => {
          track.stop();
        });
    }

    if (
      peerConnectionRef.current
    ) {
      peerConnectionRef.current.close();
      peerConnectionRef.current =
        null;
    }

    pendingOfferRef.current =
      null;

    pendingIceCandidatesRef.current =
      [];

    callAcceptedRef.current =
      false;

    setLocalStream(null);
    setVideoStream(null);
    setRemoteStream(null);

    setMicOn(false);
    setVideoMicOn(false);
    setCameraOn(false);

    setCallOpen(false);
    setVideoOpen(false);
    setIncomingCall(null);
  };

  // =========================================================
  // TOGGLE VOICE MICROPHONE
  // =========================================================

  const toggleMicrophone = () => {
    if (!localStream) {
      return;
    }

    const audioTrack =
      localStream.getAudioTracks()[0];

    if (!audioTrack) {
      return;
    }

    audioTrack.enabled =
      !audioTrack.enabled;

    setMicOn(
      audioTrack.enabled
    );
  };

  // =========================================================
  // TOGGLE VIDEO MICROPHONE
  // =========================================================

  const toggleVideoMicrophone =
    () => {
      if (!videoStream) {
        return;
      }

      const audioTrack =
        videoStream.getAudioTracks()[0];

      if (!audioTrack) {
        return;
      }

      audioTrack.enabled =
        !audioTrack.enabled;

      setVideoMicOn(
        audioTrack.enabled
      );
    };

  // =========================================================
  // TOGGLE CAMERA
  // =========================================================

  const toggleCamera = () => {
    if (!videoStream) {
      return;
    }

    const videoTrack =
      videoStream.getVideoTracks()[0];

    if (!videoTrack) {
      return;
    }

    const newState =
      !cameraOn;

    videoTrack.enabled =
      newState;

    setCameraOn(
      newState
    );
  };

  // =========================================================
  // LOCAL VIDEO
  // =========================================================

  useEffect(() => {
    if (
      videoRef.current &&
      videoStream
    ) {
      videoRef.current.srcObject =
        videoStream;

      videoRef.current
        .play()
        .catch(() => {});
    }
  }, [
    videoStream,
    cameraOn,
  ]);

  // =========================================================
  // REMOTE VIDEO
  // =========================================================

  useEffect(() => {
    if (
      remoteVideoRef.current &&
      remoteStream
    ) {
      remoteVideoRef.current.srcObject =
        remoteStream;

      remoteVideoRef.current
        .play()
        .catch(() => {});
    }
  }, [remoteStream]);

  // =========================================================
  // SEND MESSAGE
  // =========================================================

  const sendMessage = (e) => {
    e.preventDefault();

    const text =
      message.trim();

    if (!text) {
      return;
    }

    if (!socketRef.current) {
      alert(
        "Chat connection is not ready."
      );
      return;
    }

    if (!myUserId) {
      alert(
        "Logged-in user not found."
      );
      return;
    }

    if (!user?.id) {
      alert(
        "SkillMate user not found."
      );
      return;
    }

    const messageData = {
      senderId: myUserId,
      receiverId: user.id,
      message: text,
    };

    setMessages((prev) => [
      ...prev,
      {
        text,
        sender: "me",
      },
    ]);

    socketRef.current.emit(
      "send-message",
      messageData
    );

    setMessage("");
  };

  // =========================================================
  // CLOSE CHAT
  // =========================================================

  const closeChat = () => {
    endAllCalls();

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current =
        null;
    }

    if (onClose) {
      onClose();
    }
  };

  // =========================================================
  // COMPONENT CLEANUP
  // =========================================================

  useEffect(() => {
    return () => {
      if (
        peerConnectionRef.current
      ) {
        peerConnectionRef.current.close();
        peerConnectionRef.current =
          null;
      }

      if (localStream) {
        localStream
          .getTracks()
          .forEach((track) => {
            track.stop();
          });
      }

      if (videoStream) {
        videoStream
          .getTracks()
          .forEach((track) => {
            track.stop();
          });
      }
    };
  }, []);

  // =========================================================
  // UI
  // =========================================================

  return (
    <div
      className={`chat-window ${
        minimized
          ? "chat-minimized"
          : ""
      }`}
    >

      {/* =====================================================
          GLOBAL REMOTE AUDIO
          Works for BOTH voice and video calls
      ===================================================== */}

      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        className="remote-call-audio"
      />

      {/* =====================================================
          INCOMING CALL POPUP
      ===================================================== */}

      {incomingCall && (
        <div className="incoming-call-popup">

          <div className="incoming-call-icon">
            {incomingCall.callType ===
            "video"
              ? "📹"
              : "📞"}
          </div>

          <h3>
            Incoming{" "}
            {incomingCall.callType ===
            "video"
              ? "Video"
              : "Voice"}{" "}
            Call
          </h3>

          <p>
            <strong>
              {incomingCall.callerName ||
                "SkillMate"}
            </strong>{" "}
            is calling you
          </p>

          <div className="incoming-call-actions">

            <button
              type="button"
              onClick={
                acceptIncomingCall
              }
              className="accept-call"
            >
              ✅ Accept
            </button>

            <button
              type="button"
              onClick={
                rejectIncomingCall
              }
              className="reject-call"
            >
              ❌ Reject
            </button>

          </div>
        </div>
      )}

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="chat-header">

        <div className="chat-user">

          <div className="chat-avatar">
            👤
          </div>

          <div>
            <strong>
              {user?.name ||
                "SkillMate"}
            </strong>

            <span>
              ● Online
            </span>
          </div>

        </div>

        <div className="chat-controls">

          <button
            type="button"
            onClick={() =>
              setMinimized(
                !minimized
              )
            }
          >
            {minimized
              ? "□"
              : "−"}
          </button>

          <button
            type="button"
            onClick={
              closeChat
            }
          >
            ×
          </button>

        </div>

      </div>

      {/* =====================================================
          CHAT BODY
      ===================================================== */}

      {!minimized && (
        <>

          <div className="chat-body">

            {messages.length ===
            0 ? (

              <div className="chat-empty">

                <div className="chat-empty-icon">
                  💬
                </div>

                <strong>
                  Start a conversation
                </strong>

                <p>
                  Say hello to your
                  SkillMate!
                </p>

              </div>

            ) : (

              messages.map(
                (msg, index) => (

                  <div
                    key={index}
                    className={`chat-message ${
                      msg.sender ===
                      "me"
                        ? "message-me"
                        : "message-other"
                    }`}
                  >
                    {msg.text}
                  </div>

                )
              )

            )}

          </div>

          {/* =================================================
              CHAT INPUT
          ================================================= */}

          <form
            className="chat-input-area"
            onSubmit={
              sendMessage
            }
          >

            <button
              type="button"
              className="chat-action-button"
              onClick={
                startVoiceCall
              }
              title="Voice call"
            >
              📞
            </button>

            <button
              type="button"
              className="chat-action-button"
              onClick={
                startVideoCall
              }
              title="Video call"
            >
              📹
            </button>

            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) =>
                setMessage(
                  e.target.value
                )
              }
            />

            <button type="submit">
              ➤
            </button>

          </form>

        </>
      )}

      {/* =====================================================
          VOICE CALL WINDOW
      ===================================================== */}

      {callOpen && (
        <div className="call-window">

          <div className="call-header">

            <span>
              📞 Voice Call
            </span>

            <button
              type="button"
              onClick={
                endVoiceCall
              }
            >
              ×
            </button>

          </div>

          <div className="call-body">

            <div className="call-avatar">
              {user?.name?.charAt(
                0
              ) || "👤"}
            </div>

            <strong>
              {user?.name ||
                "SkillMate"}
            </strong>

            <p>
              {micOn
                ? "🎤 Microphone connected"
                : "🎤 Waiting..."}
            </p>

            {remoteStream && (
              <p>
                🔊 Connected
              </p>
            )}

          </div>

          <div className="call-actions">

            <button
              type="button"
              onClick={
                toggleMicrophone
              }
            >
              {micOn
                ? "🎤"
                : "🔇"}
            </button>

            <button
              type="button"
              className="end-call"
              onClick={
                endVoiceCall
              }
            >
              📞
            </button>

          </div>

        </div>
      )}

      {/* =====================================================
          VIDEO CALL WINDOW
      ===================================================== */}

      {videoOpen && (
        <div className="video-window">

          <div className="video-header">

            <span>
              📹 Video Call
            </span>

            <button
              type="button"
              onClick={
                endVideoCall
              }
            >
              ×
            </button>

          </div>

          <div className="video-body">

            {/* =================================================
                REMOTE VIDEO
            ================================================= */}

            {remoteStream ? (
              <video
                ref={
                  remoteVideoRef
                }
                autoPlay
                playsInline
                className="remote-video"
              />
            ) : (
              <div className="video-placeholder">

                <div className="video-avatar">
                  {user?.name?.charAt(
                    0
                  ) || "👤"}
                </div>

                <strong>
                  {user?.name ||
                    "SkillMate"}
                </strong>

                <p>
                  Waiting for
                  connection...
                </p>

              </div>
            )}

            {/* =================================================
                LOCAL VIDEO
            ================================================= */}

            {cameraOn &&
            videoStream ? (

              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="local-video"
              />

            ) : (

              <div className="video-local-placeholder">

                <div className="video-avatar">
                  You
                </div>

                <p>
                  📹 Camera is off
                </p>

              </div>

            )}

          </div>

          <div className="video-actions">

            <button
              type="button"
              onClick={
                toggleVideoMicrophone
              }
            >
              {videoMicOn
                ? "🎤"
                : "🔇"}
            </button>

            <button
              type="button"
              onClick={
                toggleCamera
              }
            >
              {cameraOn
                ? "📹"
                : "🚫"}
            </button>

            <button
              type="button"
              className="end-call"
              onClick={
                endVideoCall
              }
            >
              📞
            </button>

          </div>

        </div>
      )}

    </div>
  );
}

export default Chat;