export default class WAVEInterface {
    static audioContext: AudioContext;
    static bufferSize: number;
    playbackNode: AudioBufferSourceNode;
    recordingNodes: AudioNode[];
    recordingStream: MediaStream;
    buffers: Float32Array[][];
    encodingCache?: Blob;
    readonly bufferLength: number;
    readonly audioDuration: number;
    readonly audioData: Blob;
    startRecording(): Promise<{}>;
    stopRecording(): void;
    startPlayback(loop: boolean, onended: () => void): Promise<{}>;
    stopPlayback(): void;
    reset(): void;
}
