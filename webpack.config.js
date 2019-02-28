const path = require('path');
module.exports = {
  entry: './dist/AudioRecorder.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'AudioRecorder.min.js',
    library: 'AudioRecorder',
    libraryTarget: 'var'
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM'
  }
};
