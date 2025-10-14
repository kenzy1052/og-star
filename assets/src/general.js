/**
 * General JavaScript functionality for OG STAR TRAVEL & TOURS
 * Contains reusable scripts that will be used across all pages
 */

// Theme (light/dark) functionality
document.addEventListener("DOMContentLoaded", function () {
  // Check for saved theme preference or default to light
  const currentTheme = localStorage.getItem("theme") || "light";

  // Apply the theme
  if (currentTheme === "dark") {
    document.body.classList.add("dark-theme");
  }

  // You can add a theme toggle button if needed
  // For now, we'll rely on system preference
});

// Floating WhatsApp button
function initWhatsAppButton() {
  const whatsappButton = document.querySelector(".whatsapp-float");
  const whatsappDesktop = document.getElementById("whatsappDesktop");
  const whatsappMobile = document.getElementById("whatsappMobile");

  // Add hover effect
  if (whatsappButton) {
    whatsappButton.addEventListener("mouseenter", () => {
      whatsappButton.style.transform = "scale(1.1) rotate(15deg)";
    });

    whatsappButton.addEventListener("mouseleave", () => {
      whatsappButton.style.transform = "scale(1) rotate(0deg)";
    });
  }

  // Desktop WhatsApp: expand after 3s + typewriter
  (function () {
    const btn = whatsappDesktop;
    if (!btn) return;

    const label = document.getElementById("whLabel");
    if (!label) return;

    const full = "WhatsApp Us";
    const typingDelay = 60;
    const delayBefore = 3000;
    let typedIndex = 0;
    let typingTimer = null;

    // click opens
    btn.addEventListener("click", () => {
      window.open(
        "https://wa.me/233546945944?text=Hello%20OG%20Star%20Travel%20%26%20Tours,%20I'm%20interested%20in%20your%20services",
        "_blank"
      );
    });

    // schedule expand & type
    window.addEventListener("load", () => {
      setTimeout(() => {
        btn.classList.add("expand");
        // clear label and type
        label.textContent = "";
        typedIndex = 0;
        typingTimer = setInterval(() => {
          label.textContent += full[typedIndex++];
          if (typedIndex >= full.length) clearInterval(typingTimer);
        }, typingDelay);
      }, delayBefore);
    });

    // also allow keyboard activation
    btn.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        window.open(
          "https://wa.me/233546945944?text=Hello%20OG%20Star%20Travel%20%26%20Tours,%20I'm%20interested%20in%20your%20services",
          "_blank"
        );
      }
    });
  })();

  // mobile whatsapp button inside panel
  (function () {
    const mobileBtn = whatsappMobile;
    if (mobileBtn) {
      mobileBtn.addEventListener("click", () => {
        window.open(
          "https://wa.me/233546945944?text=Hello%20OG%20Star%20Travel%20%26%20Tours,%20I'm%20interested%20in%20your%20services",
          "_blank"
        );
      });
    }
  })();
}

// Navigation WhatsApp button messaging functionality
function initNavigationWhatsApp() {
  // This function handles WhatsApp messaging from navigation buttons
  // It's already implemented in the initWhatsAppButton function above
  // but we can add additional functionality here if needed

  // Example: Track WhatsApp button clicks for analytics
  const whatsappButtons = document.querySelectorAll('[id*="whatsapp"]');

  whatsappButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // You can add analytics tracking here
      console.log("WhatsApp button clicked");

      // Example: Send event to Google Analytics
      // gtag('event', 'whatsapp_click', {
      //   'event_category': 'engagement',
      //   'event_label': 'navigation'
      // });
    });
  });
}

// Initialize all general functionality
function initGeneral() {
  initWhatsAppButton();
  initNavigationWhatsApp();
}

// Export functions to be used in other scripts
window.initGeneral = initGeneral;
