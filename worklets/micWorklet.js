class MicProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channelData = input[0];
    // Send a copy to avoid transferring the underlying buffer repeatedly
    this.port.postMessage(new Float32Array(channelData));
    return true;
  }
}

registerProcessor('mic-processor', MicProcessor);
