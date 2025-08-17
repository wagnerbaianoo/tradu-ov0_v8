// WebRTC Client for Flue.live Integration (WHEP/WHIP)
export interface StreamConfig {
  type: "flue" | "direct"
  key?: string
  mode: "audio-only" | "video"
  url: string
}

export interface MediaDeviceInfo {
  deviceId: string
  label: string
  kind: "audioinput" | "videoinput" | "audiooutput"
}

export class WebRTCClient {
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private isConnected = false
  private streamConfig: StreamConfig | null = null

  constructor() {
    this.setupPeerConnection()
  }

  private setupPeerConnection() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
    })

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log("[v0] ICE connection state:", this.peerConnection?.iceConnectionState)
      this.isConnected = this.peerConnection?.iceConnectionState === "connected"
    }

    this.peerConnection.ontrack = (event) => {
      console.log("[v0] Received remote stream")
      this.remoteStream = event.streams[0]
    }
  }

  // Get available media devices
  async getMediaDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices.map((device) => ({
        deviceId: device.deviceId,
        label: device.label || `${device.kind} ${device.deviceId.slice(0, 8)}`,
        kind: device.kind as "audioinput" | "videoinput" | "audiooutput",
      }))
    } catch (error) {
      console.error("[v0] Error getting media devices:", error)
      return []
    }
  }

  // Capture local media stream
  async captureMedia(constraints: {
    audio?: boolean | MediaTrackConstraints
    video?: boolean | MediaTrackConstraints
    deviceId?: string
  }): Promise<MediaStream | null> {
    try {
      const mediaConstraints: MediaStreamConstraints = {
        audio: constraints.audio
          ? {
              deviceId: constraints.deviceId ? { exact: constraints.deviceId } : undefined,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: false,
              ...(typeof constraints.audio === "object" ? constraints.audio : {}),
            }
          : false,
        video: constraints.video || false,
      }

      this.localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints)
      console.log("[v0] Local media captured successfully")
      return this.localStream
    } catch (error) {
      console.error("[v0] Error capturing media:", error)
      throw new Error("Failed to capture media. Please check permissions.")
    }
  }

  // Connect to Flue.live stream (WHEP - WebRTC-HTTP Egress Protocol)
  async connectToFlueStream(config: StreamConfig): Promise<void> {
    if (!this.peerConnection) {
      throw new Error("Peer connection not initialized")
    }

    this.streamConfig = config

    try {
      if (config.type === "flue" && config.key) {
        // WHEP connection to Flue.live
        const whepUrl = `https://whep.flue.live/?stream=${config.key}`

        // Create offer for receiving stream
        const offer = await this.peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: config.mode === "video",
        })

        await this.peerConnection.setLocalDescription(offer)

        // Send offer to Flue.live WHEP endpoint
        const response = await fetch(whepUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        })

        if (!response.ok) {
          throw new Error(`WHEP connection failed: ${response.status}`)
        }

        const answerSdp = await response.text()
        await this.peerConnection.setRemoteDescription({
          type: "answer",
          sdp: answerSdp,
        })

        console.log("[v0] Connected to Flue.live stream:", config.key)
      } else {
        // Direct WebRTC connection
        console.log("[v0] Setting up direct WebRTC connection")
        // Implementation for direct connections would go here
      }
    } catch (error) {
      console.error("[v0] Error connecting to stream:", error)
      throw error
    }
  }

  // Publish stream to Flue.live (WHIP - WebRTC-HTTP Ingress Protocol)
  async publishToFlueStream(config: StreamConfig, localStream: MediaStream): Promise<void> {
    if (!this.peerConnection) {
      throw new Error("Peer connection not initialized")
    }

    try {
      // Add local stream tracks to peer connection
      localStream.getTracks().forEach((track) => {
        this.peerConnection?.addTrack(track, localStream)
      })

      if (config.type === "flue" && config.key) {
        // WHIP connection to Flue.live
        const whipUrl = `https://whip.flue.live/?stream=${config.key}`

        // Create offer for sending stream
        const offer = await this.peerConnection.createOffer()
        await this.peerConnection.setLocalDescription(offer)

        // Send offer to Flue.live WHIP endpoint
        const response = await fetch(whipUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        })

        if (!response.ok) {
          throw new Error(`WHIP connection failed: ${response.status}`)
        }

        const answerSdp = await response.text()
        await this.peerConnection.setRemoteDescription({
          type: "answer",
          sdp: answerSdp,
        })

        console.log("[v0] Publishing to Flue.live stream:", config.key)
      }
    } catch (error) {
      console.error("[v0] Error publishing stream:", error)
      throw error
    }
  }

  // Get remote stream for playback
  getRemoteStream(): MediaStream | null {
    return this.remoteStream
  }

  // Get local stream
  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  // Check connection status
  isStreamConnected(): boolean {
    return this.isConnected
  }

  // Disconnect and cleanup
  disconnect(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop())
      this.localStream = null
    }

    if (this.peerConnection) {
      this.peerConnection.close()
      this.setupPeerConnection() // Reset for next connection
    }

    this.remoteStream = null
    this.isConnected = false
    this.streamConfig = null
    console.log("[v0] WebRTC client disconnected")
  }

  // Get stream statistics
  async getStats(): Promise<RTCStatsReport | null> {
    if (!this.peerConnection) return null

    try {
      return await this.peerConnection.getStats()
    } catch (error) {
      console.error("[v0] Error getting stats:", error)
      return null
    }
  }
}

// Singleton instance
export const webRTCClient = new WebRTCClient()
