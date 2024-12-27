export type NotificationSound = "default" | "subtle" | "success" | "error" | "none"

class SoundManager {
  private audioCache: Map<string, HTMLAudioElement> = new Map()
  private enabled: boolean = true
  private volume: number = 0.5
  private currentSound: NotificationSound = "default"

  constructor() {
    this.loadSounds()
  }

  private loadSounds() {
    const sounds: Record<NotificationSound, string> = {
      default: "/sounds/notification.mp3",
      subtle: "/sounds/subtle.mp3",
      success: "/sounds/success.mp3",
      error: "/sounds/error.mp3",
      none: "",
    }

    Object.entries(sounds).forEach(([key, path]) => {
      if (path) {
        const audio = new Audio(path)
        audio.volume = this.volume
        this.audioCache.set(key, audio)
      }
    })
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled
    localStorage.setItem("notificationSoundEnabled", String(enabled))
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume))
    this.audioCache.forEach((audio) => {
      audio.volume = this.volume
    })
    localStorage.setItem("notificationSoundVolume", String(this.volume))
  }

  public setSound(sound: NotificationSound) {
    this.currentSound = sound
    localStorage.setItem("notificationSound", sound)
  }

  public async play(sound?: NotificationSound) {
    if (!this.enabled) return
    
    const soundToPlay = sound || this.currentSound
    if (soundToPlay === "none") return

    const audio = this.audioCache.get(soundToPlay)
    if (!audio) return

    try {
      audio.currentTime = 0
      await audio.play()
    } catch (error) {
      console.error("Failed to play notification sound:", error)
    }
  }

  public init() {
    // Load preferences from localStorage
    const enabled = localStorage.getItem("notificationSoundEnabled")
    if (enabled !== null) {
      this.enabled = enabled === "true"
    }

    const volume = localStorage.getItem("notificationSoundVolume")
    if (volume !== null) {
      this.setVolume(parseFloat(volume))
    }

    const sound = localStorage.getItem("notificationSound") as NotificationSound
    if (sound) {
      this.currentSound = sound
    }
  }
}

export const soundManager = new SoundManager()
