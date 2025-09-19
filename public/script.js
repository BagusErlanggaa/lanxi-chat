class ModernAIChat {
  constructor() {
    this.chatForm = document.getElementById("chatForm")
    this.messageInput = document.getElementById("messageInput")
    this.imageInput = document.getElementById("imageInput")
    this.chatMessages = document.getElementById("chatMessages")
    this.sendBtn = document.getElementById("sendBtn")
    this.loadingIndicator = document.getElementById("loadingIndicator")
    this.imagePreview = document.getElementById("imagePreview")
    this.previewImg = document.getElementById("previewImg")
    this.removeImageBtn = document.getElementById("removeImage")
    this.currentTime = document.getElementById("currentTime")
    this.currentDate = document.getElementById("currentDate")
    this.particlesContainer = document.getElementById("particlesContainer")

    this.init()
  }

  init() {
    // Event listeners
    this.chatForm.addEventListener("submit", (e) => this.handleSubmit(e))
    this.imageInput.addEventListener("change", (e) => this.handleImageSelect(e))
    this.removeImageBtn.addEventListener("click", () => this.removeImage())
    this.messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        this.chatForm.dispatchEvent(new Event("submit"))
      }
    })

    // Auto-resize input
    this.messageInput.addEventListener("input", () => this.autoResizeInput())

    // Remove welcome message on first interaction
    this.messageInput.addEventListener("focus", () => this.removeWelcomeMessage(), { once: true })

    this.initClock()
    this.initParticles()

    setTimeout(() => {
      this.showAlert("Selamat datang di Lanxi! 🎉", "success")
    }, 1000)
  }

  initClock() {
    this.updateClock()
    setInterval(() => this.updateClock(), 1000)
  }

  updateClock() {
    const now = new Date()

    // Format time
    const timeOptions = {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }
    const timeString = now.toLocaleTimeString("id-ID", timeOptions)

    // Format date
    const dateOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
    const dateString = now.toLocaleDateString("id-ID", dateOptions)

    this.currentTime.textContent = timeString
    this.currentDate.textContent = dateString
  }

  initParticles() {
    this.createParticles()
    setInterval(() => this.createParticles(), 3000)
  }

  createParticles() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const particle = document.createElement("div")
        particle.className = "particle"

        // Random starting position
        particle.style.left = Math.random() * 100 + "%"
        particle.style.animationDuration = Math.random() * 10 + 15 + "s"
        particle.style.animationDelay = Math.random() * 2 + "s"

        // Random size
        const size = Math.random() * 3 + 1
        particle.style.width = size + "px"
        particle.style.height = size + "px"

        this.particlesContainer.appendChild(particle)

        // Remove particle after animation
        setTimeout(() => {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle)
          }
        }, 25000)
      }, i * 500)
    }
  }

  showAlert(message, type = "info", duration = 3000) {
    const alert = document.createElement("div")
    alert.className = `alert ${type}`
    alert.textContent = message

    document.body.appendChild(alert)

    setTimeout(() => {
      alert.style.animation = "slideOutRight 0.3s ease-out forwards"
      setTimeout(() => alert.remove(), 300)
    }, duration)
  }

  removeWelcomeMessage() {
    const welcomeMessage = document.querySelector(".welcome-message")
    if (welcomeMessage) {
      welcomeMessage.style.animation = "fadeOut 0.3s ease-out forwards"
      setTimeout(() => welcomeMessage.remove(), 300)
    }
  }

  autoResizeInput() {
    this.messageInput.style.height = "auto"
    this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + "px"
  }

  handleImageSelect(e) {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        this.showAlert("Ukuran file terlalu besar! Maksimal 5MB", "error")
        this.imageInput.value = ""
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        this.previewImg.src = e.target.result
        this.imagePreview.style.display = "block"
        this.showAlert("Gambar berhasil dipilih! 📸", "success", 2000)
      }
      reader.readAsDataURL(file)
    }
  }

  removeImage() {
    this.imageInput.value = ""
    this.imagePreview.style.display = "none"
    this.previewImg.src = ""
    this.showAlert("Gambar dihapus", "info", 2000)
  }

  async handleSubmit(e) {
    e.preventDefault()

    const message = this.messageInput.value.trim()
    const imageFile = this.imageInput.files[0]

    if (!message && !imageFile) {
      this.showAlert("Silakan ketik pesan atau pilih gambar!", "warning")
      this.messageInput.classList.add("error-shake")
      setTimeout(() => this.messageInput.classList.remove("error-shake"), 500)
      return
    }

    // Disable form
    this.setFormDisabled(true)

    // Add user message
    this.addMessage(message, imageFile, "user")

    // Clear form
    this.clearForm()

    // Show loading
    this.showLoading(true)

    setTimeout(() => {
      this.showAlert("Mengirim pesan ke Lanxi...", "info", 2000)
    }, 500)

    try {
      // Create FormData
      const formData = new FormData()
      if (message) formData.append("message", message)
      if (imageFile) formData.append("image", imageFile)

      // Send request
      const response = await fetch("/api/chat-image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Add AI response
      this.addMessage(data.reply || "Maaf, terjadi kesalahan dalam memproses permintaan Anda.", null, "ai")

      this.showAlert("Lanxi telah merespons! ✅", "success", 2000)
    } catch (error) {
      console.error("Error:", error)
      this.addMessage("Maaf, terjadi kesalahan dalam menghubungi server. Silakan coba lagi.", null, "ai")
      this.showAlert("Koneksi bermasalah! Coba lagi nanti", "error")
    } finally {
      this.showLoading(false)
      this.setFormDisabled(false)
      this.messageInput.focus()
    }
  }

  addMessage(text, imageFile, sender) {
    const messageDiv = document.createElement("div")
    messageDiv.className = `message ${sender}`

    const bubbleDiv = document.createElement("div")
    bubbleDiv.className = "message-bubble"

    // Add image if present
    if (imageFile && sender === "user") {
      const img = document.createElement("img")
      img.className = "message-image"
      img.src = URL.createObjectURL(imageFile)
      img.alt = "Uploaded image"
      bubbleDiv.appendChild(img)
    }

    // Add text if present
    if (text) {
      const textDiv = document.createElement("div")
      textDiv.textContent = text
      bubbleDiv.appendChild(textDiv)
    }

    messageDiv.appendChild(bubbleDiv)
    this.chatMessages.appendChild(messageDiv)

    this.playMessageSound(sender)
    this.scrollToBottom()
  }

  playMessageSound(sender) {
    // Create a subtle visual feedback instead of actual sound
    if (sender === "user") {
      this.showAlert("Pesan terkirim", "info", 1000)
    } else {
      this.showAlert("Balasan diterima", "success", 1000)
    }
  }

  clearForm() {
    this.messageInput.value = ""
    this.removeImage()
    this.autoResizeInput()
  }

  setFormDisabled(disabled) {
    this.messageInput.disabled = disabled
    this.imageInput.disabled = disabled
    this.sendBtn.disabled = disabled
  }

  showLoading(show) {
    this.loadingIndicator.style.display = show ? "flex" : "none"
    if (show) {
      this.scrollToBottom()
      const loadingMessages = [
        "Lanxi sedang berpikir...",
        "Memproses permintaan Anda...",
        "Menganalisis pesan...",
        "Menyiapkan respons...",
      ]
      const randomMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
      this.showAlert(randomMessage, "info", 2000)
    }
  }

  scrollToBottom() {
    setTimeout(() => {
      this.chatMessages.scrollTop = this.chatMessages.scrollHeight
    }, 100)
  }
}

// Initialize the chat when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new ModernAIChat()
})

const style = document.createElement("style")
style.textContent = `
  @keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-20px); }
  }
  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  @keyframes bounce-in {
    0% {
      opacity: 0;
      transform: scale(0.3) translateY(50px);
    }
    50% {
      opacity: 1;
      transform: scale(1.05) translateY(-10px);
    }
    70% {
      transform: scale(0.9) translateY(0);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`
document.head.appendChild(style)
