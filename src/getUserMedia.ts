export default navigator.mediaDevices ?
  navigator.mediaDevices.getUserMedia :
  (
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia
  );
