# Audio Recorder

A React Component using the Web Audio API to record, save, and play audio.


## Demo & Examples

Live demo: [kremonte.github.io/react-audio-recorder](http://kremonte.github.io/react-audio-recorder/)

To build the examples locally, run:

```
npm install
npm start
```

Then open [`localhost:8000`](http://localhost:8000) in a browser.


## Installation

The easiest way to use react-audio-recorder is to install it from NPM and include it in your own React build process (using [Webpack](http://webpack.github.io/), [Browserify](http://browserify.org), etc).

You can also use the standalone build by including `dist/react-audio-recorder.js` in your page. If you use this, make sure you have already included React, and it is available as a global variable.

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
prop|type|Description
----|----|-----------
audio|Blob|Audio data to load the component with, optional.
download|bool|Whether to show the download button after audio is recorded, default: true
loop|bool|Whether to loop playback, default: false
 | | 
onAbort|callback|Called when playback is aborted.
onChange|callback|Called when audio is recorded or removed. Callback data is sent as an object: `{ duration: float, data: Blob }`
onEnded|callback|Called when playback finishes.
onPlay|callback|Called when playback begins.
onRecordStart|callback|Called when recording begins.
 | | 
strings|object|Button text values
strings.play|string|default: '🔊 Play'
strings.playing|string|default: '❚❚ Playing'
strings.record|string|default: '● Record'
strings.recording|string|default: '● Recording'
strings.remove|string|default: '✖ Remove'
strings.download|string|default: '\ud83d\udcbe Save'

### Notes

This component is intended for use with short sounds only, such as speech samples and sound effects. The WAV encoder is not offloaded to a service worker, to make this component more portable. It is not space efficient either, recording at 1411kbps (16 bit stereo), so long recordings will drain the system of memory.

### Compatibility

Because of its usage of the Web Audio API, react-audio-recorder is not compatible with any version of Internet Explorer (Edge is compatible).


## Development (`src`, `lib` and the build process)

**NOTE:** The source code for the component is in `src`. A transpiled CommonJS version (generated with Babel) is available in `lib` for use with node.js, browserify and webpack. A UMD bundle is also built to `dist`, which can be included without the need for any build system.

To build, watch and serve the examples (which will also watch the component source), run `npm start`. If you just want to watch changes to `src` and rebuild `lib`, run `npm run watch` (this is useful if you are working with `npm link`).

## License

__PUT LICENSE HERE__

Copyright (c) 2015 Dan Rouse.

