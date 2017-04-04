module.exports = {
  entry: './dist/AudioRecorder.js',
  output: {
    filename: './dist/AudioRecorder.min.js'
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM'
  }
};
