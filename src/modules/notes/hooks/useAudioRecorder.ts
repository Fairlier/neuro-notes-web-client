import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const useAudioRecorder = () => {
    const { t } = useTranslation();

    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | File | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationRef = useRef<number | null>(null);

    const drawVisualizer = () => {
        if (!canvasRef.current || !analyserRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const analyser = analyserRef.current;

        if (!ctx) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barCount = 40;
        const step = Math.floor(bufferLength / barCount);
        const barWidth = (canvas.width / barCount) - 2;

        for (let i = 0; i < barCount; i++) {
            let sum = 0;
            for (let j = 0; j < step; j++) {
                sum += dataArray[i * step + j];
            }
            const average = sum / step;
            const barHeight = (average / 255) * canvas.height;
            const x = i * (barWidth + 2);
            const y = canvas.height - barHeight;

            ctx.fillStyle = mediaRecorderRef.current?.state === 'paused' ? '#a1a1aa' : '#3b82f6';

            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(x, y, barWidth, barHeight, 2);
            } else {
                ctx.fillRect(x, y, barWidth, barHeight);
            }
            ctx.fill();
        }

        animationRef.current = requestAnimationFrame(drawVisualizer);
    };

    const getMicrophoneErrorMessage = (err: unknown) => {
        if (err instanceof DOMException) {
            switch (err.name) {
                case 'NotAllowedError':
                case 'PermissionDeniedError':
                    return t('audioRecorder.errors.permissionDenied');
                case 'NotFoundError':
                    return t('audioRecorder.errors.noMicrophone');
                case 'NotReadableError':
                    return t('audioRecorder.errors.notReadable');
                default:
                    return t('audioRecorder.errors.generic');
            }
        }

        return t('audioRecorder.errors.generic');
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            const AudioContextClass =
                window.AudioContext ||
                (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

            const audioCtx = new AudioContextClass();
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;

            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);

            audioCtxRef.current = audioCtx;
            analyserRef.current = analyser;

            mediaRecorder.start();
            setIsRecording(true);
            setIsPaused(false);
            setRecordingTime(0);

            timerRef.current = window.setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

            drawVisualizer();
        } catch (err) {
            console.error('Microphone access error:', err);
            alert(getMicrophoneErrorMessage(err));
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            if (timerRef.current) clearInterval(timerRef.current);
            audioCtxRef.current?.suspend();
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current?.state === 'paused') {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            timerRef.current = window.setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
            audioCtxRef.current?.resume();
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);
            if (timerRef.current) clearInterval(timerRef.current);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (audioCtxRef.current?.state !== 'closed') {
                audioCtxRef.current?.close().catch(() => {});
            }
        }
    };

    const cancelAudio = () => {
        setAudioBlob(null);
        setRecordingTime(0);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        setIsPaused(false);

        if (timerRef.current) clearInterval(timerRef.current);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        if (audioCtxRef.current?.state !== 'closed') {
            audioCtxRef.current?.close().catch(() => {});
        }
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
            if (audioCtxRef.current?.state !== 'closed') {
                audioCtxRef.current?.close().catch(() => {});
            }
        };
    }, []);

    const formattedTime = `${Math.floor(recordingTime / 60).toString().padStart(2, '0')}:${(recordingTime % 60)
        .toString()
        .padStart(2, '0')}`;

    return {
        isRecording,
        isPaused,
        audioBlob,
        setAudioBlob,
        recordingTime,
        formattedTime,
        canvasRef,
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
        cancelAudio
    };
};