// Mobile Panel
const hamburger = document.getElementById("hamburger");
const panel = document.getElementById("mobilePanel");
const overlay = document.getElementById("overlay");
const closeBtn = document.getElementById("closePanel");
const body = document.body;

function openPanel() {
  panel.classList.add("open");
  overlay.classList.add("show");
  body.classList.add("menu-open");
}

function closePanel() {
  panel.classList.remove("open");
  overlay.classList.remove("show");
  body.classList.remove("menu-open");
}

hamburger.addEventListener("click", openPanel);
closeBtn.addEventListener("click", closePanel);
overlay.addEventListener("click", closePanel);

// Close on link click
document.querySelectorAll(".mobile-links a").forEach((link) => {
  link.addEventListener("click", closePanel);
});

// Close on window resize to desktop
window.addEventListener("resize", () => {
  if (window.innerWidth >= 1024) closePanel();
});

// Desktop WhatsApp button
const whatsappBtn = document.getElementById("whatsappDesktop");
const whLabel = document.getElementById("whLabel");
const fullText = "WhatsApp Us";
let typedIndex = 0;

whatsappBtn.addEventListener("click", () => {
  window.open(
    "https://wa.me/233546945944?text=Hello%20OG%20Star%20Travel%20%26%20Tours,%20I'm%20interested%20in%20your%20services",
    "_blank"
  );
});

// Auto-expand and type after 3 seconds with more natural effect
setTimeout(() => {
  whatsappBtn.classList.add("expand");
  whLabel.textContent = "";

  // Natural typing effect with variable speed
  const typeInterval = setInterval(() => {
    if (typedIndex < fullText.length) {
      whLabel.textContent += fullText[typedIndex];
      typedIndex++;

      // Variable typing speed for more natural effect
      const randomDelay = Math.random() * 80 + 40; // Random delay between 40-120ms
      clearInterval(typeInterval);
      setTimeout(() => {
        const newInterval = setInterval(() => {
          if (typedIndex < fullText.length) {
            whLabel.textContent += fullText[typedIndex];
            typedIndex++;
          } else {
            clearInterval(newInterval);
          }
        }, randomDelay);
      }, randomDelay);
    } else {
      clearInterval(typeInterval);
    }
  }, 100);
}, 3000);

// Back to top button and WhatsApp float toggle
const backToTop = document.getElementById("backToTop");
const whatsappFloat = document.getElementById("whatsappFloat");
const footer = document.querySelector(".footer");

// Function to check if element is in viewport
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return rect.top <= window.innerHeight && rect.bottom >= 0;
}

// Handle scroll events
window.addEventListener("scroll", () => {
  // Show/hide back to top button based on scroll position
  if (window.pageYOffset > 300) {
    backToTop.classList.add("visible");
  } else {
    backToTop.classList.remove("visible");
  }

  // Toggle between WhatsApp and back to top when footer is visible
  if (isInViewport(footer)) {
    whatsappFloat.classList.add("hidden");
    backToTop.classList.add("visible");
  } else if (window.pageYOffset > 300) {
    whatsappFloat.classList.remove("hidden");
    backToTop.classList.remove("visible");
  }
});

backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
