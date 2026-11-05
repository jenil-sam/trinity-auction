import { Stage, StageEvents, SubscribeType } from "amazon-ivs-web-broadcast";
import { useEffect, useRef, useState } from "react";
import "../css/LiveFeed.css"
import { useAuction } from "../context/AuctionContext";

export default function LiveFeed() {
    const { accessToken } = useAuction();
    const videoRef = useRef(null);
    const [token, setToken] = useState(null);
    const stageRef = useRef(null);

    useEffect(() => {
        if (!accessToken) return;
        const fetchToken = async () => {
            // the server decides the role from the signed in user
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/stream/token`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const data = await response.json();
            setToken(data.token);
        };
        fetchToken();
    }, [accessToken]);

    useEffect(() => {
        if (!token) return;

        const strategy = {
            stageStreamsToPublish() { return []; },
            shouldPublishParticipant() { return false; },
            shouldSubscribeToParticipant() { return SubscribeType.AUDIO_VIDEO; }
        };

        const stage = new Stage(token, strategy);
        stageRef.current = stage;

        stage.on(StageEvents.STAGE_PARTICIPANT_STREAMS_ADDED, (participant, streams) => {
            const mediaStream = new MediaStream();
            streams.forEach(stream => mediaStream.addTrack(stream.mediaStreamTrack));

            const attachStream = () => {
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                } else {
                    requestAnimationFrame(attachStream);
                }
            };
            attachStream();
        });

        stage.join();

        return () => {
            stage.leave();
        };
    }, [token]);

    return (
        <video className="liveFeed" ref={videoRef} autoPlay playsInline />
    );
}