import React, { Component, PropTypes } from 'react';
import encodeWAV from './wav-encoder.js';

class AudioRecorder extends Component {
  constructor(props) {
    super(props);

    this.buffers = [[], []];
    this.bufferLength = 0;
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.sampleRate = this.audioContext.sampleRate;
    this.recordingStream = null;
    this.playbackSource = null;

    this.state = {
      recording: false,
      playing: false,
      audio: props.audio
    };
  }

  startRecording() {
    navigator.getUserMedia = navigator.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia;
    navigator.getUserMedia({ audio: true }, (stream) => {
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

    });

    this.setState({
      recording: true
    });
    if(this.props.onRecordStart) {
      this.props.onRecordStart.call();
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
      this.props.onChange.call(null, {
        duration: this.bufferLength / this.sampleRate,
        blob: audioData
      });
    }
  }

  startPlayback() {
    const reader = new window.FileReader();
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
        this.props.onPlay.call();
      }
    };
  }

  stopPlayback(event) {
    if(this.state.playing) {
      event.preventDefault();

      this.setState({
        playing: false
      });

      if(this.props.onAbort) {
        this.props.onAbort.call();
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
        this.props.onChange.call();
      }
    }
  }

  downloadAudio() {
    const url = (window.URL || window.webkitURL).createObjectURL(this.state.audio);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'output.wav';
    const click = document.createEvent('Event');
    click.initEvent('click', true, true);
    link.dispatchEvent(click);
  }

  onAudioEnded() {
    if(this.state.playing) {
      this.setState({ playing: false });
    }

    if(this.props.onEnded) {
      this.props.onEnded.call();
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

AudioRecorder.propTypes = {
  audio: PropTypes.instanceOf(Blob),
  download: PropTypes.bool,
  loop: PropTypes.bool,

  onAbort: PropTypes.func,
  onChange: PropTypes.func,
  onEnded: PropTypes.func,
  onPause: PropTypes.func,
  onPlay: PropTypes.func,
  onRecordStart: PropTypes.func,

  strings: React.PropTypes.shape({
    play: PropTypes.string,
    playing: PropTypes.string,
    record: PropTypes.string,
    recording: PropTypes.string,
    remove: PropTypes.string,
    download: PropTypes.string
  })
};

AudioRecorder.defaultProps = {
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

export default AudioRecorder;
