import { Stage, SubscribeType } from "amazon-ivs-web-broadcast";
import { useEffect, useRef, useState } from "react";
import { LocalStageStream } from "amazon-ivs-web-broadcast";
import '../css/HostBroadcast.css';

export default function HostBroadcast() {
  const videoRef = useRef(null);
  const [token, setToken] = useState(null);
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const cameraTrackRef = useRef(null);
  const micTrackRef = useRef(null);
  const stageRef = useRef(null);

  useEffect(() => {
    const fetchToken = async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/stream/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'HOST' })
      });
      const data = await response.json();
      setToken(data.token);
    };
    fetchToken();
  }, []);

  useEffect(() => {
    if (!token) return;
    const start = async () => {
      const camera = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const mic = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      cameraTrackRef.current = camera.getVideoTracks()[0];
      micTrackRef.current = mic.getAudioTracks()[0];
      const cameraStream = new LocalStageStream(cameraTrackRef.current);
      const micStream = new LocalStageStream(micTrackRef.current);
      const strategy = {
        stageStreamsToPublish() { return [cameraStream, micStream]; },
        shouldPublishParticipant() { return true; },
        shouldSubscribeToParticipant() { return SubscribeType.NONE; }
      };
      const stage = new Stage(token, strategy);
      stageRef.current = stage;
      await stage.join();
      videoRef.current.srcObject = camera;
    };
    start();
  }, [token]);

  const toggleCam = () => {
    if (cameraTrackRef.current) {
      cameraTrackRef.current.enabled = !cameraTrackRef.current.enabled;
      setCamOn(prev => !prev);
      stageRef.current?.refreshStrategy();
    }
  };

  const toggleMic = () => {
    if (micTrackRef.current) {
      micTrackRef.current.enabled = !micTrackRef.current.enabled;
      setMicOn(prev => !prev);
      stageRef.current?.refreshStrategy();
    }
  };

  return (
    <div className="broadcast-container">
      <video ref={videoRef} autoPlay playsInline muted className="broadcast-video" />
      <div className="broadcast-controls">
        <button onClick={toggleCam} className="broadcast-btn">
          {camOn ? 'Camera Off' : 'Camera On'}
        </button>
        <button onClick={toggleMic} className="broadcast-btn">
          {micOn ? 'Mute' : 'Unmute'}
        </button>
      </div>
    </div>
  );
}