const React = require('react');
const ReactDOM = require('react-dom');
const AudioRecorder = require('react-audio-recorder');

const App = React.createClass({
  render () {
    return (
      <div>
        <h1>react-audio-recorder example</h1>
        <AudioRecorder
          initialAudio={}
          downloadable
          loop={false}
          filename="output.wav"

          onAbort={() => {}}
          onChange={({ duration, audioData }) => {}}
          onEnded={() => {}}
          onPause={() => {}}
          onPlay={() => {}}
          onRecordStart={() => {}}

          playLabel="🔊 Play"
          playingLabel="❚❚ Playing"
          recordLabel="● Record"
          recordingLabel="● Recording"
          removeLabel="✖ Remove"
          downloadLabel="\ud83d\udcbe Save"
        />
      </div>
    );
  }
});

ReactDOM.render(<App />, document.getElementById('app'));
