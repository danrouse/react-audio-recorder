# Audio Recorder

A React Component using the Web Audio API to record, save, and play audio.


## Demo & Examples

Live demo: [danrouse.github.io/react-audio-recorder](https://danrouse.github.io/react-audio-recorder/)


## Installation

The easiest way to use react-audio-recorder is to install it from NPM and include it in your own React build process (using [Webpack](http://webpack.js.org/), [Browserify](http://browserify.org), etc).

You can also use the standalone build by including `dist/AudioRecorder.min.js` in your page. If you use this, make sure you have already included React, and it is available as a global variable.

```
npm install react-audio-recorder --save
```


## Usage

The `<AudioRecorder>` component can be instantiated with no properties to act as a simple client-side recorder/downloader. `onChange` is called when a recording is finished, with the audio data passed as a blob.

```
import AudioRecorder from 'react-audio-recorder';

<AudioRecorder />
```

For more detailed usage examples, see the [live demo](http://kremonte.github.io/react-audio-recorder/).

### Properties
property|type|default|Description
----|----|-------|-----------
initialAudio|Blob|An initial Blob of audio data
downloadable|boolean|`true`|Whether to show a download button
loop|boolean|`false`|Whether to loop audio playback
filename|string|`'output.wav'`|Downloaded file name
className|string|`''`|CSS class name on the container element
style|Object|`{}`|Inline styles on the container element
onAbort|`() => void`||Callback when playback is stopped
onChange|`(AudioRecorderChangeEvent) => void`||Callback when the recording buffer is modified
onEnded|`() => void`||Callback when playback completes on its own
onPause|`() => void`||(NYI)
onPlay|`() => void`||Callback when playback begins
onRecordStart|`() => void`||Callback when recording begins
playLabel|string|'🔊 Play'|Button label
playingLabel|string|'❚❚ Playing'|Button label
recordLabel|string|'● Record'|Button label
recordingLabel|string|'● Recording'|Button label
removeLabel|string|'✖ Remove'|Button label
downloadLabel|string|'💾 Save'|Button label

### Notes

This component is intended for use with short sounds only, such as speech samples and sound effects. The WAV encoder is not offloaded to a service worker, to make this component more portable. It is not space efficient either, recording at 1411kbps (16 bit stereo), so long recordings will drain the system of memory.

### Compatibility

Because of its usage of the Web Audio API, react-audio-recorder is not compatible with any version of Internet Explorer (Edge is compatible).


## Development

To use the typescript watcher, run `npm run dev`.

## License

### MIT License

Copyright 2017 Daniel Rouse

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
