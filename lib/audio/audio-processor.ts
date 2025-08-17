// Advanced Audio Processing Utilities
export class AudioProcessor {
  private audioContext: AudioContext | null = null
  private sourceNode: MediaStreamAudioSourceNode | null = null
  private processingChain: AudioNode[] = []

  constructor() {
    this.audioContext = new AudioContext({ sampleRate: 48000 })
  }

  // Create processing chain
  createProcessingChain(
    stream: MediaStream,
    options: {
      echoCancellation?: boolean
      noiseSuppression?: boolean
      highPassFilter?: boolean
      compressor?: boolean
      limiter?: boolean
      gain?: number
    },
  ) {
    if (!this.audioContext) return null

    this.sourceNode = this.audioContext.createMediaStreamSource(stream)
    let currentNode: AudioNode = this.sourceNode

    // High-pass filter (removes low-frequency noise)
    if (options.highPassFilter) {
      const highPassFilter = this.audioContext.createBiquadFilter()
      highPassFilter.type = "highpass"
      highPassFilter.frequency.value = 80
      highPassFilter.Q.value = 0.7
      currentNode.connect(highPassFilter)
      currentNode = highPassFilter
      this.processingChain.push(highPassFilter)
    }

    // Compressor (dynamic range control)
    if (options.compressor) {
      const compressor = this.audioContext.createDynamicsCompressor()
      compressor.threshold.value = -24
      compressor.knee.value = 30
      compressor.ratio.value = 12
      compressor.attack.value = 0.003
      compressor.release.value = 0.25
      currentNode.connect(compressor)
      currentNode = compressor
      this.processingChain.push(compressor)
    }

    // Gain control
    if (options.gain !== undefined) {
      const gainNode = this.audioContext.createGain()
      gainNode.gain.value = options.gain
      currentNode.connect(gainNode)
      currentNode = gainNode
      this.processingChain.push(gainNode)
    }

    // Limiter (prevents clipping)
    if (options.limiter) {
      const limiter = this.audioContext.createDynamicsCompressor()
      limiter.threshold.value = -3
      limiter.knee.value = 0
      limiter.ratio.value = 20
      limiter.attack.value = 0.001
      limiter.release.value = 0.01
      currentNode.connect(limiter)
      currentNode = limiter
      this.processingChain.push(limiter)
    }

    return currentNode
  }

  // Get processed stream
  getProcessedStream(finalNode: AudioNode): MediaStream {
    if (!this.audioContext) throw new Error("Audio context not initialized")

    const destination = this.audioContext.createMediaStreamDestination()
    finalNode.connect(destination)
    return destination.stream
  }

  // Real-time audio analysis
  createAnalyser(node: AudioNode): AnalyserNode {
    if (!this.audioContext) throw new Error("Audio context not initialized")

    const analyser = this.audioContext.createAnalyser()
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.8
    node.connect(analyser)
    return analyser
  }

  // Get audio level
  getAudioLevel(analyser: AnalyserNode): number {
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(dataArray)
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
    return (average / 255) * 100
  }

  // Get frequency data for visualization
  getFrequencyData(analyser: AnalyserNode): Uint8Array {
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(dataArray)
    return dataArray
  }

  // Cleanup
  dispose() {
    this.processingChain.forEach((node) => {
      try {
        node.disconnect()
      } catch (e) {
        // Node might already be disconnected
      }
    })

    if (this.sourceNode) {
      this.sourceNode.disconnect()
      this.sourceNode = null
    }

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    this.processingChain = []
  }
}

// Singleton instance
export const audioProcessor = new AudioProcessor()
