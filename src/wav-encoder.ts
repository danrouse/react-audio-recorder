function writeUTFBytes(dataview, offset, string) {
  for(let i = 0; i < string.length; i++) {
    dataview.setUint8(offset + i, string.charCodeAt(i));
  }
}

function mergeBuffers(buffer, length) {
  const result = new Float64Array(length);
  let offset = 0;
  for(let i = 0; i < buffer.length; i++) {
    const inner = buffer[i];
    result.set(inner, offset);
    offset += inner.length;
  }
  return result;
}

function interleave(left, right) {
  const length = left.length + right.length;
  const result = new Float64Array(length);
  let inputIndex = 0;
  for(var i = 0; i < length; ) {
    result[i++] = left[inputIndex];
    result[i++] = right[inputIndex];
    inputIndex++;
  }
  return result;
}

export default function encodeWAV(buffers, bufferLength, sampleRate, volume = 1) {
  const left = mergeBuffers(buffers[0], bufferLength);
  const right = mergeBuffers(buffers[1], bufferLength);
  const interleaved = interleave(left, right);
  const buffer = new ArrayBuffer(44 + interleaved.length * 2);
  const view = new DataView(buffer);

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
  
  interleaved.forEach((sample, index) => {
    view.setInt16(44 + (index * 2), sample * (0x7fff * volume), true);
  });

  const audioData = new Blob([view], { type: 'audio/wav' });
  return audioData;
}
