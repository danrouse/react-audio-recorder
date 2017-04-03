import * as React from 'react';
import encodeWAV from './wav-encoder.js';

interface AudioRecorderProps {
  initialAudio: Blob,
  downloadable: boolean,
  loop: boolean,
  filename?: string,

  onAbort?: () => void,
  onChange?: ({ duration: number, blob: Blob }?) => void,
  onEnded?: () => void,
  onPause?: () => void,
  onPlay?: () => void,
  onRecordStart?: () => void,

  playLabel: string,
  playingLabel: string,
  recordLabel: string,
  recordingLabel: string,
  removeLabel: string,
  downloadLabel: string,
};

interface AudioRecorderState {
  isRecording: boolean,
  isPlaying: boolean,
  audioData?: Blob
};

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

function downloadBlob(blob: Blob, filename: string): HTMLAnchorElement {
  const url = window.URL.createObjectURL(blob);
  const click = document.createEvent('Event');
  click.initEvent('click', true, true);

  const link = document.createElement('A') as HTMLAnchorElement;
  link.href = url;
  link.download = filename;
  link.dispatchEvent(click);
  link.click();
  return link;
}


class WAVEInterface {
  static audioContext = new AudioContext();
  static bufferSize = 2048;

  playbackNode: AudioBufferSourceNode;
  recordingStream: MediaStream;
  buffers: Float32Array[][]; // one buffer for each channel L,R
  encodingCache: Blob?;

  get bufferLength() { return this.buffers[0].length * WAVEInterface.bufferSize; }
  get audioDuration() { return this.bufferLength / WAVEInterface.audioContext.sampleRate; }
  get audioData() {
    return this.encodingCache || encodeWAV(this.buffers, this.bufferLength, AudioRecorder.audioContext.sampleRate);
  }

  startRecording() {
    return new Promise((resolve, reject) => {
      getUserMedia({ audio: true }, (stream) => {
        const { audioContext } = WAVEInterface;
        const gainNode = audioContext.createGain();
        const audioNode = audioContext.createMediaStreamSource(stream);
        const recorderNode = audioContext.createScriptProcessor(AudioRecorder.bufferSize, 2, 2);
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

  startPlayback(loop?: boolean = false) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(this.audioData);
      reader.onloadend = () => {
        audioContext.decodeAudioData(reader.result, (buffer) => {
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

export default class AudioRecorder extends React.Component<AudioRecorderProps, AudioRecorderState> {
  waveInterface = new WAVEInterface();

  state: AudioRecorderState = {
    isRecording: false,
    isPlaying: false,
    audio: this.props.initialAudio
  };

  static defaultProps = {
    loop: false,
    downloadable: true,
    filename: 'output.wav',
    playLabel: '🔊 Play',
    playingLabel: '❚❚ Playing',
    recordLabel: '● Record',
    recordingLabel: '● Recording',
    removeLabel: '✖ Remove',
    downloadLabel: '\ud83d\udcbe Save' // unicode floppy disk
  };

  componentWillReceiveProps(nextProps) {
    // handle new initialAudio being passed in
    if (
      nextProps.initialAudio &&
      nextProps.initialAudio !== this.props.initialAudio &&
      this.state.audioData &&
      nextProps.initialAudio !== this.state.audioData
    ) {
      this.waveInterface.reset();
      this.setState({
        audio: nextProps.initialAudio,
        isPlaying: false,
        isRecording: false,
      });
    }
  }

  componentWillMount() { this.waveInterface.reset(); }
  componentWillUnmount() { this.waveInterface.reset(); }

  startRecording() {
    if (!this.state.isRecording) {
      this.waveInterface.startRecording()
        .then(() => {
          this.setState({ isRecording: true });
          if (this.props.onRecordStart) this.props.onRecordStart();
        })
        .catch((err) => { throw err; });
    }
  }

  stopRecording() {
    this.waveInterface.stopRecording();

    this.setState({
      isRecording: false,
      audioData: this.waveInterface.audioData
    });

    if (this.props.onChange) {
      this.props.onChange({
        duration: this.waveInterface.audioDuration,
        blob: this.waveInterface.audioData
      });
    }
  }

  startPlayback() {
    if (!this.state.isPlaying) {
      this.waveInterface.startPlayback(this.props.loop).then(() => {
        this.setState({ isPlaying: true });
        if (this.props.onPlay) this.props.onPlay();
      });
    }
  }

  stopPlayback() {
    this.waveInterface.stopPlayback();
    this.setState({ isPlaying: false });
    if (this.props.onAbort) this.props.onAbort();
  }

  onAudioEnded = () => {
    this.setState({ isPlaying: false });
    if (this.props.onEnded) this.props.onEnded();
  };

  onRemoveClick = () => this.waveInterface.destroy();

  onDownloadClick = () => downloadBlob(this.state.audioData, this.props.filename);

  onButtonClick = (event: React.SyntheticEvent<HTMLButtonElement>) => {
    if (this.state.audioData) {
      if (this.state.isPlaying) {
        this.stopPlayback();
        event.preventDefault();
      } else {
        this.startPlayback();
      }
    } else {
      if (this.state.isRecording) {
        this.stopRecording();
      } else {
        this.startRecording();
      }
    }
  };

  render() {
    return (
      <div className="AudioRecorder">
        <button
          className={
            [
              'AudioRecorder-button',
              this.state.audioData ? 'hasAudio' : '',
              this.state.isPlaying ? 'isPlaying' : '',
              this.state.isRecording ? 'isRecording' : '',
            ].join(' ')
          }
          onClick={this.onButtonClick}
        >
          {this.state.audioData && !this.state.isPlaying && this.props.playLabel}
          {this.state.audioData && this.state.isPlaying && this.props.playingLabel}
          {!this.state.audioData && !this.state.isRecording && this.props.recordLabel}
          {!this.state.audioData && this.state.isRecording && this.props.recordingLabel}
        </button>
        {this.state.audioData &&
          <button
            className="AudioRecorder-remove"
            onClick={this.onRemoveClick}
          >
            {this.props.removeLabel}
          </button>
        }
        {this.state.audioData && this.props.downloadable &&
          <button
            className="AudioRecorder-download"
            onClick={this.onDownloadClick}
          >
            {this.props.downloadLabel}
          </button>
        }
      </div>
    );
  }
}
