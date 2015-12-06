require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = encodeWAV;
function writeUTFBytes(dataview, offset, string) {
  for (var i = 0; i < string.length; i++) {
    dataview.setUint8(offset + i, string.charCodeAt(i));
  }
}

function mergeBuffers(buffer, length) {
  var result = new Float64Array(length);
  var offset = 0;
  for (var i = 0; i < buffer.length; i++) {
    var inner = buffer[i];
    result.set(inner, offset);
    offset += inner.length;
  }
  return result;
}

function interleave(left, right) {
  var length = left.length + right.length;
  var result = new Float64Array(length);
  var inputIndex = 0;
  for (var i = 0; i < length;) {
    result[i++] = left[inputIndex];
    result[i++] = right[inputIndex];
    inputIndex++;
  }
  return result;
}

function encodeWAV(buffers, bufferLength, sampleRate) {
  var volume = arguments.length <= 3 || arguments[3] === undefined ? 1 : arguments[3];

  var left = mergeBuffers(buffers[0], bufferLength);
  var right = mergeBuffers(buffers[1], bufferLength);
  var interleaved = interleave(left, right);
  var buffer = new ArrayBuffer(44 + interleaved.length * 2);
  var view = new DataView(buffer);

  writeUTFBytes(view, 0, 'RIFF');
  view.setUint32(4, 44 + interleaved.length * 2, true);
  writeUTFBytes(view, 8, 'WAVE');

  writeUTFBytes(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 2, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 4, true);
  view.setUint16(32, 4, true);
  view.setUint16(34, 16, true);

  writeUTFBytes(view, 36, 'data');
  view.setUint32(40, interleaved.length * 2, true);

  interleaved.forEach(function (sample, index) {
    view.setInt16(44 + index * 2, sample * (0x7fff * volume), true);
  });

  var audioData = new Blob([view], { type: 'audio/wav' });
  return audioData;
}

module.exports = exports['default'];

},{}],"react-audio-recorder":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _wavEncoderJs = require('./wav-encoder.js');

var _wavEncoderJs2 = _interopRequireDefault(_wavEncoderJs);

var AudioRecorder = (function (_Component) {
  _inherits(AudioRecorder, _Component);

  function AudioRecorder(props) {
    _classCallCheck(this, AudioRecorder);

    _get(Object.getPrototypeOf(AudioRecorder.prototype), 'constructor', this).call(this, props);

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

  _createClass(AudioRecorder, [{
    key: 'startRecording',
    value: function startRecording() {
      var _this = this;

      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
      navigator.getUserMedia({ audio: true }, function (stream) {
        var gain = _this.audioContext.createGain();
        var audioSource = _this.audioContext.createMediaStreamSource(stream);
        audioSource.connect(gain);

        var bufferSize = 2048;
        var recorder = _this.audioContext.createScriptProcessor(bufferSize, 2, 2);
        recorder.onaudioprocess = function (event) {
          // save left and right buffers
          for (var i = 0; i < 2; i++) {
            var channel = event.inputBuffer.getChannelData(i);
            _this.buffers[i].push(new Float32Array(channel));
            _this.bufferLength += bufferSize;
          }
        };

        gain.connect(recorder);
        recorder.connect(_this.audioContext.destination);
        _this.recordingStream = stream;
      }, function (err) {});

      this.setState({
        recording: true
      });
      if (this.props.onRecordStart) {
        this.props.onRecordStart.call();
      }
    }
  }, {
    key: 'stopRecording',
    value: function stopRecording() {
      this.recordingStream.getTracks()[0].stop();

      var audioData = (0, _wavEncoderJs2['default'])(this.buffers, this.bufferLength, this.sampleRate);

      this.setState({
        recording: false,
        audio: audioData
      });

      if (this.props.onChange) {
        this.props.onChange.call(null, {
          duration: this.bufferLength / this.sampleRate,
          blob: audioData
        });
      }
    }
  }, {
    key: 'startPlayback',
    value: function startPlayback() {
      var _this2 = this;

      var reader = new window.FileReader();
      reader.readAsArrayBuffer(this.state.audio);
      reader.onloadend = function () {
        _this2.audioContext.decodeAudioData(reader.result, function (buffer) {
          var source = _this2.audioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(_this2.audioContext.destination);
          source.loop = _this2.props.loop;
          source.start(0);
          source.onended = _this2.onAudioEnded.bind(_this2);

          _this2.playbackSource = source;
        });

        _this2.setState({
          playing: true
        });

        if (_this2.props.onPlay) {
          _this2.props.onPlay.call();
        }
      };
    }
  }, {
    key: 'stopPlayback',
    value: function stopPlayback(event) {
      if (this.state.playing) {
        event.preventDefault();

        this.setState({
          playing: false
        });

        if (this.props.onAbort) {
          this.props.onAbort.call();
        }
      }
    }
  }, {
    key: 'removeAudio',
    value: function removeAudio() {
      if (this.state.audio) {
        if (this.playbackSource) {
          this.playbackSource.stop();
          delete this.playbackSource;
        }

        this.setState({
          audio: null
        });

        if (this.props.onChange) {
          this.props.onChange.call();
        }
      }
    }
  }, {
    key: 'downloadAudio',
    value: function downloadAudio() {
      var url = (window.URL || window.webkitURL).createObjectURL(this.state.audio);
      var link = document.createElement('a');
      link.href = url;
      link.download = 'output.wav';
      var click = document.createEvent('Event');
      click.initEvent('click', true, true);
      link.dispatchEvent(click);
    }
  }, {
    key: 'onAudioEnded',
    value: function onAudioEnded() {
      if (this.state.playing) {
        this.setState({ playing: false });
      }

      if (this.props.onEnded) {
        this.props.onEnded.call();
      }
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      if (this.state.audio && nextProps.audio !== this.state.audio) {
        this.stopPlayback();
        this.setState({
          audio: nextProps.audio
        });
      }
    }
  }, {
    key: 'render',
    value: function render() {
      var strings = this.props.strings;

      var buttonText = undefined,
          buttonClass = ['AudioRecorder-button'],
          audioButtons = undefined;
      var clickHandler = undefined;
      if (this.state.audio) {
        buttonClass.push('hasAudio');

        if (this.state.playing) {
          buttonClass.push('isPlaying');
          buttonText = strings.playing;
          clickHandler = this.stopPlayback;
        } else {
          buttonText = strings.play;
          clickHandler = this.startPlayback;
        }

        audioButtons = [_react2['default'].createElement(
          'button',
          { key: 'remove', className: 'AudioRecorder-remove', onClick: this.removeAudio.bind(this) },
          strings.remove
        )];

        if (this.props.download) {
          audioButtons.push(_react2['default'].createElement(
            'button',
            { key: 'download', className: 'AudioRecorder-download', onClick: this.downloadAudio.bind(this) },
            strings.download
          ));
        }
      } else {
        if (this.state.recording) {
          buttonClass.push('isRecording');
          buttonText = strings.recording;
          clickHandler = this.stopRecording;
        } else {
          buttonText = strings.record;
          clickHandler = this.startRecording;
        }
      }

      return _react2['default'].createElement(
        'div',
        { className: 'AudioRecorder' },
        _react2['default'].createElement(
          'button',
          {
            className: buttonClass.join(' '),
            onClick: clickHandler && clickHandler.bind(this)
          },
          buttonText
        ),
        audioButtons
      );
    }
  }]);

  return AudioRecorder;
})(_react.Component);

AudioRecorder.propTypes = {
  audio: _react.PropTypes.instanceOf(Blob),
  download: _react.PropTypes.bool,
  loop: _react.PropTypes.bool,

  onAbort: _react.PropTypes.func,
  onChange: _react.PropTypes.func,
  onEnded: _react.PropTypes.func,
  onPlay: _react.PropTypes.func,
  onRecordStart: _react.PropTypes.func,

  strings: _react2['default'].PropTypes.shape({
    play: _react.PropTypes.string,
    playing: _react.PropTypes.string,
    record: _react.PropTypes.string,
    recording: _react.PropTypes.string,
    remove: _react.PropTypes.string,
    download: _react.PropTypes.string
  })
};

AudioRecorder.defaultProps = {
  download: true,
  loop: false,

  strings: {
    play: '🔊 Play',
    playing: '❚❚ Playing',
    record: '● Record',
    recording: '● Recording',
    remove: '✖ Remove',
    download: '💾 Save' // unicode floppy disk
  }
};

exports['default'] = AudioRecorder;
module.exports = exports['default'];

},{"./wav-encoder.js":1,"react":undefined}]},{},[]);
