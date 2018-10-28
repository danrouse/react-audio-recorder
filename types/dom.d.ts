interface Navigator {
  getUserMedia: NavigatorUserMedia['getUserMedia']
  mozGetUserMedia: NavigatorUserMedia['getUserMedia'];
  webkitGetUserMedia: NavigatorUserMedia['getUserMedia'];
}

declare var webkitAudioContext: typeof AudioContext;
