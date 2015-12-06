var React = require('react');
var ReactDOM = require('react-dom');
var AudioRecorder = require('react-audio-recorder');

var App = React.createClass({
  render () {
    return (
      <div>
        <AudioRecorder />
      </div>
    );
  }
});

ReactDOM.render(<App />, document.getElementById('app'));
