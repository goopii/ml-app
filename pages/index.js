import { useEffect, useRef, useState } from 'react';
import { createDetector, SupportedModels } from "@tensorflow-models/hand-pose-detection";
import '@tensorflow/tfjs-backend-webgl';
import { drawHands } from "../lib/utils";
import Link from "next/link";
import { useAnimationFrame } from "../lib/hooks/useAnimationFrame";
import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';

tfjsWasm.setWasmPaths(
    `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm`);

async function setupVideo() {
    const video = document.getElementById('video');
    const stream = await window.navigator.mediaDevices.getUserMedia({ video: true });

    video.srcObject = stream;
    await new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve();
        }
    });
    video.play();

    video.width = video.videoWidth;
    video.height = video.videoHeight;

    return video;
}

async function setupDetector() {
    const model = SupportedModels.MediaPipeHands;
    const detector = await createDetector(
        model,
        {
            runtime: "mediapipe",
            maxHands: 2,
            solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands'
        }
    );

    return detector;
}

async function setupCanvas(video) {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = video.width;
    canvas.height = video.height;

    return ctx;
}

export default function HandPoseDetection() {
    const detectorRef = useRef();
    const videoRef = useRef();
    const [ctx, setCtx] = useState();

    useEffect(() => {
        async function initialize() {
            videoRef.current = await setupVideo();
            const ctx = await setupCanvas(videoRef.current);
            detectorRef.current = await setupDetector();

            setCtx(ctx);
        }

        initialize();
    }, []);

    useAnimationFrame(async delta => {
        const hands = await detectorRef.current.estimateHands(
            video,
            {
                flipHorizontal: false
            }
        );

        ctx.clearRect(0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
        ctx.drawImage(videoRef.current, 0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
        drawHands(hands, ctx);
    }, !!(detectorRef.current && videoRef.current && ctx));

    return (
        <div className="container mx-auto py-12 px-4 md:px-6">
            <main className="main">
                <h2 className="text-3xl font-normal mb-4">
                    <Link className="font-bold" href={'/'}>Home</Link> / Hand Pose Detection
                </h2>
                <code className="mb-4">Work in progress...</code>
                <canvas
                    className="w-full h-auto max-w-[85vw] rounded-lg shadow-lg"
                    id="canvas">
                </canvas>
                <video
                    className="hidden absolute top-0 left-0 w-0 h-0"
                    id="video"
                    playsInline>
                </video>
            </main>
        </div>
    )
}