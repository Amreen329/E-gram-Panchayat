// Toast notification system for better UX
class Toast {
  static show(message, type = "info", duration = 3000) {
    const toast = document.createElement("div");
    toast.className = `gp-toast gp-toast--${type}`;
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "polite");
    
    const icon = type === "success" ? "✓" : type === "error" ? "✕" : type === "warning" ? "⚠" : "ℹ";
    toast.innerHTML = `
      <span class="gp-toast__icon">${icon}</span>
      <span class="gp-toast__message">${message}</span>
      <button class="gp-toast__close" aria-label="Close">×</button>
    `;

    const container = document.getElementById("toast-container") || this.createContainer();
    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add("gp-toast--show"), 10);

    // Auto remove
    const autoRemove = setTimeout(() => this.remove(toast), duration);

    // Manual close
    toast.querySelector(".gp-toast__close").addEventListener("click", () => {
      clearTimeout(autoRemove);
      this.remove(toast);
    });

    return toast;
  }

  static createContainer() {
    const container = document.createElement("div");
    container.id = "toast-container";
    container.className = "gp-toast-container";
    document.body.appendChild(container);
    return container;
  }

  static remove(toast) {
    toast.classList.remove("gp-toast--show");
    setTimeout(() => toast.remove(), 300);
  }

  static success(message, duration) {
    return this.show(message, "success", duration);
  }

  static error(message, duration) {
    return this.show(message, "error", duration);
  }

  static warning(message, duration) {
    return this.show(message, "warning", duration);
  }

  static info(message, duration) {
    return this.show(message, "info", duration);
  }
}

export default Toast;

