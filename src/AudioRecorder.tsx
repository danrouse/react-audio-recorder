import * as React from 'react';
import encodeWAV from './wav-encoder.js';

interface AudioRecorderProps {
  audio: Blob,
  download: boolean,
  loop: boolean,

  onAbort: () => void,
  onChange: ({ duration: number, blob: Blob }?) => void,
  onEnded: () => void,
  onPause: () => void,
  onPlay: () => void,
  onRecordStart: () => void,

  strings: {
    play: string,
    playing: string,
    record: string,
    recording: string,
    remove: string,
    download: string
  }
};

interface AudioRecorderState {
  recording: boolean,
  playing: boolean,
  audio: Blob
};

function downloadBlob(blob: Blob, filename: string): HTMLAnchorElement {
  const url = (URL || webkitURL).createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  const click = document.createEvent('Event');
  click.initEvent('click', true, true);
  link.dispatchEvent(click);
  return link;
}

export default class AudioRecorder extends React.Component<AudioRecorderProps, AudioRecorderState> {
  buffers = [[], []];
  bufferLength = 0;
  audioContext = new (AudioContext || webkitAudioContext)();
  sampleRate = this.audioContext.sampleRate;
  recordingStream = null;
  playbackSource = null;

  state: AudioRecorderState = {
    recording: false,
    playing: false,
    audio: this.props.audio
  };

  static defaultProps = {
    loop: false,

    strings: {
      play: '🔊 Play',
      playing: '❚❚ Playing',
      record: '● Record',
      recording: '● Recording',
      remove: '✖ Remove',
      download: '\ud83d\udcbe Save' // unicode floppy disk
    }
  };

  startRecording() {
    const getUserMedia = navigator.getUserMedia ||
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia ||
                         navigator.msGetUserMedia;
    getUserMedia({ audio: true }, (stream) => {
      const gain = this.audioContext.createGain();
      const audioSource = this.audioContext.createMediaStreamSource(stream);
      audioSource.connect(gain);

      const bufferSize = 2048;
      const recorder = this.audioContext.createScriptProcessor(bufferSize, 2, 2);
      recorder.onaudioprocess = (event) => {
        // save left and right buffers
        for(let i = 0; i < 2; i++) {
          const channel = event.inputBuffer.getChannelData(i);
          this.buffers[i].push(new Float32Array(channel));
        }
        this.bufferLength += bufferSize;
      };

      gain.connect(recorder);
      recorder.connect(this.audioContext.destination);
      this.recordingStream = stream;
    }, (err) => {
      // TODO
    });

    this.setState({
      recording: true
    });
    if(this.props.onRecordStart) {
      this.props.onRecordStart();
    }
  }

  stopRecording() {
    this.recordingStream.getTracks()[0].stop();

    const audioData = encodeWAV(this.buffers, this.bufferLength, this.sampleRate);

    this.setState({
      recording: false,
      audio: audioData
    });

    if(this.props.onChange) {
      this.props.onChange({
        duration: this.bufferLength / this.sampleRate,
        blob: audioData
      });
    }
  }

  startPlayback() {
    const reader = new FileReader();
    reader.readAsArrayBuffer(this.state.audio);
    reader.onloadend = () => {
      this.audioContext.decodeAudioData(reader.result, (buffer) => {
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.loop = this.props.loop;
        source.start(0);
        source.onended = this.onAudioEnded.bind(this);

        this.playbackSource = source;
      });

      this.setState({
        playing: true
      });

      if(this.props.onPlay) {
        this.props.onPlay();
      }
    };
  }

  stopPlayback(event?: Event) {
    if(this.state.playing) {
      if (event) event.preventDefault();

      this.setState({
        playing: false
      });

      if(this.props.onAbort) {
        this.props.onAbort();
      }
    }
  }

  removeAudio() {
    if(this.state.audio) {
      if(this.playbackSource) {
        this.playbackSource.stop();
        delete this.playbackSource;
      }

      this.setState({
        audio: null
      });

      if(this.props.onChange) {
        this.props.onChange();
      }
    }
  }

  downloadAudio() {
    downloadBlob(this.state.audio, 'output.wav');
  }

  onAudioEnded() {
    if(this.state.playing) {
      this.setState({ playing: false });
    }

    if(this.props.onEnded) {
      this.props.onEnded();
    }
  }

  componentWillReceiveProps(nextProps) {
    if(this.state.audio && nextProps.audio !== this.state.audio) {
      this.stopPlayback();
      this.setState({
        audio: nextProps.audio
      });
    }
  }

  render() {
    const strings = this.props.strings;

    let buttonText, buttonClass = ['AudioRecorder-button'], audioButtons;
    let clickHandler;
    if(this.state.audio) {
      buttonClass.push('hasAudio');

      if(this.state.playing) {
        buttonClass.push('isPlaying');
        buttonText = strings.playing;
        clickHandler = this.stopPlayback;
      } else {
        buttonText = strings.play;
        clickHandler = this.startPlayback;
      }

      audioButtons = [
        <button key="remove" className="AudioRecorder-remove" onClick={this.removeAudio.bind(this)}>{strings.remove}</button>
      ];

      if(this.props.download) {
        audioButtons.push(
          <button key="download" className="AudioRecorder-download" onClick={this.downloadAudio.bind(this)}>{strings.download}</button>
        );
      }
    } else {
      if(this.state.recording) {
        buttonClass.push('isRecording');
        buttonText = strings.recording;
        clickHandler = this.stopRecording;
      } else {
        buttonText = strings.record;
        clickHandler = this.startRecording;
      }
    }

    return (
      <div className="AudioRecorder">
        <button
          className={buttonClass.join(' ')}
          onClick={clickHandler && clickHandler.bind(this)}
          >
          {buttonText}
        </button>
        {audioButtons}
      </div>
    );
  }
}
