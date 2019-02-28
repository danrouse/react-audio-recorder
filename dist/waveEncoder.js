function writeUTFBytes(dataview, offset, string) {
    for (var i = 0; i < string.length; i++) {
        dataview.setUint8(offset + i, string.charCodeAt(i));
    }
}
function mergeBuffers(buffer, length) {
    var result = new Float64Array(length);
    var offset = 0;
    for (var i = 0; i < buffer.length; i++) {
        var inner = buffer[i];
        result.set(inner, offset);
        offset += inner.length;
    }
    return result;
}
function interleave(left, right) {
    var length = left.length + right.length;
    var result = new Float64Array(length);
    var inputIndex = 0;
    for (var i = 0; i < length;) {
        result[i++] = left[inputIndex];
        result[i++] = right[inputIndex];
        inputIndex++;
    }
    return result;
}
export default function encodeWAV(buffers, bufferLength, sampleRate, volume) {
    if (volume === void 0) { volume = 1; }
    var left = mergeBuffers(buffers[0], bufferLength);
    var right = mergeBuffers(buffers[1], bufferLength);
    var interleaved = interleave(left, right);
    var buffer = new ArrayBuffer(44 + interleaved.length * 2);
    var view = new DataView(buffer);
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
    interleaved.forEach(function (sample, index) {
        view.setInt16(44 + (index * 2), sample * (0x7fff * volume), true);
    });
    return new Blob([view], { type: 'audio/wav' });
}
