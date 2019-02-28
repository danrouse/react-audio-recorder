import encodeWAV from './waveEncoder';
import getUserMedia from './getUserMedia';
import AudioContext from './AudioContext';
var WAVEInterface = /** @class */ (function () {
    function WAVEInterface() {
        this.recordingNodes = [];
    }
    Object.defineProperty(WAVEInterface.prototype, "bufferLength", {
        get: function () { return this.buffers[0].length * WAVEInterface.bufferSize; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WAVEInterface.prototype, "audioDuration", {
        get: function () { return this.bufferLength / WAVEInterface.audioContext.sampleRate; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WAVEInterface.prototype, "audioData", {
        get: function () {
            return this.encodingCache || encodeWAV(this.buffers, this.bufferLength, WAVEInterface.audioContext.sampleRate);
        },
        enumerable: true,
        configurable: true
    });
    WAVEInterface.prototype.startRecording = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            getUserMedia({ audio: true }, function (stream) {
                var audioContext = WAVEInterface.audioContext;
                var recGainNode = audioContext.createGain();
                var recSourceNode = audioContext.createMediaStreamSource(stream);
                var recProcessingNode = audioContext.createScriptProcessor(WAVEInterface.bufferSize, 2, 2);
                if (_this.encodingCache)
                    _this.encodingCache = null;
                recProcessingNode.onaudioprocess = function (event) {
                    if (_this.encodingCache)
                        _this.encodingCache = null;
                    // save left and right buffers
                    for (var i = 0; i < 2; i++) {
                        var channel = event.inputBuffer.getChannelData(i);
                        _this.buffers[i].push(new Float32Array(channel));
                    }
                };
                recSourceNode.connect(recGainNode);
                recGainNode.connect(recProcessingNode);
                recProcessingNode.connect(audioContext.destination);
                _this.recordingStream = stream;
                _this.recordingNodes.push(recSourceNode, recGainNode, recProcessingNode);
                resolve(stream);
            }, function (err) {
                reject(err);
            });
        });
    };
    WAVEInterface.prototype.stopRecording = function () {
        if (this.recordingStream) {
            this.recordingStream.getTracks()[0].stop();
            delete this.recordingStream;
        }
        for (var i in this.recordingNodes) {
            this.recordingNodes[i].disconnect();
            delete this.recordingNodes[i];
        }
    };
    WAVEInterface.prototype.startPlayback = function (loop, onended) {
        var _this = this;
        if (loop === void 0) { loop = false; }
        return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.readAsArrayBuffer(_this.audioData);
            reader.onloadend = function () {
                WAVEInterface.audioContext.decodeAudioData(reader.result, function (buffer) {
                    var source = WAVEInterface.audioContext.createBufferSource();
                    source.buffer = buffer;
                    source.connect(WAVEInterface.audioContext.destination);
                    source.loop = loop;
                    source.start(0);
                    source.onended = onended;
                    _this.playbackNode = source;
                    resolve(source);
                });
            };
        });
    };
    WAVEInterface.prototype.stopPlayback = function () {
        this.playbackNode.stop();
    };
    WAVEInterface.prototype.reset = function () {
        if (this.playbackNode) {
            this.playbackNode.stop();
            this.playbackNode.disconnect(0);
            delete this.playbackNode;
        }
        this.stopRecording();
        this.buffers = [[], []];
    };
    WAVEInterface.audioContext = new AudioContext();
    WAVEInterface.bufferSize = 2048;
    return WAVEInterface;
}());
export default WAVEInterface;
