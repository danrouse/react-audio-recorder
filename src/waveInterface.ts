import encodeWAV from './waveEncoder';

/*
interface Navigator {
  webkitGetUserMedia?: typeof navigator.getUserMedia,
  mozGetUserMedia?: typeof navigator.getUserMedia,
  msGetUserMedia?: typeof navigator.getUserMedia,
};

const getUserMedia = navigator.getUserMedia ||
                     navigator.webkitGetUserMedia ||
                     navigator.mozGetUserMedia ||
                     navigator.msGetUserMedia;
*/
const getUserMedia = navigator.getUserMedia;

export default class WAVEInterface {
  static audioContext = new AudioContext();
  static bufferSize = 2048;

  playbackNode: AudioBufferSourceNode;
  recordingStream: MediaStream;
  buffers: Float32Array[][]; // one buffer for each channel L,R
  encodingCache?: Blob;

  get bufferLength() { return this.buffers[0].length * WAVEInterface.bufferSize; }
  get audioDuration() { return this.bufferLength / WAVEInterface.audioContext.sampleRate; }
  get audioData() {
    return this.encodingCache || encodeWAV(this.buffers, this.bufferLength, WAVEInterface.audioContext.sampleRate);
  }

  startRecording() {
    return new Promise((resolve, reject) => {
      getUserMedia({ audio: true }, (stream) => {
        const { audioContext } = WAVEInterface;
        const gainNode = audioContext.createGain();
        const audioNode = audioContext.createMediaStreamSource(stream);
        const recorderNode = audioContext.createScriptProcessor(WAVEInterface.bufferSize, 2, 2);
        if (this.encodingCache) this.encodingCache = null;

        recorderNode.onaudioprocess = (event) => {
          if (this.encodingCache) this.encodingCache = null;
          // save left and right buffers
          for (let i = 0; i < 2; i++) {
            const channel = event.inputBuffer.getChannelData(i);
            this.buffers[i].push(new Float32Array(channel));
          }
        };

        audioNode.connect(gainNode);
        gainNode.connect(recorderNode);
        recorderNode.connect(audioContext.destination);

        this.recordingStream = stream;
        resolve(stream);
      }, (err) => {
        reject(err);
      });
    });
  }

  stopRecording() {
    this.recordingStream.getTracks()[0].stop();
  }

  startPlayback(loop: boolean = false, onended: () => void) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(this.audioData);
      reader.onloadend = () => {
        WAVEInterface.audioContext.decodeAudioData(reader.result, (buffer) => {
          const source = WAVEInterface.audioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(WAVEInterface.audioContext.destination);
          source.loop = loop;
          source.start(0);
          source.onended = onended;
          this.playbackNode = source;
          resolve(source);
        });
      };
    });
  }

  stopPlayback() {

  }

  reset() {
    if (this.playbackNode) {
      this.playbackNode.stop();
      this.playbackNode.disconnect(0);
      delete this.playbackNode;
    }
    if (this.recordingStream) {
      this.recordingStream.getTracks()[0].stop();
      delete this.recordingStream;
    }
    this.buffers = [[], []];
  }
}
