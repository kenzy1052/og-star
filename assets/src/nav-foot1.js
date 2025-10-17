// Mobile Panel - Only initialize if elements exist
const hamburger = document.getElementById("hamburger");
const panel = document.getElementById("mobilePanel");
const overlay = document.getElementById("overlay");
const closeBtn = document.getElementById("closePanel");
const body = document.body;

if (hamburger && panel && overlay && closeBtn) {
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
  const mobileLinks = document.querySelectorAll(".mobile-links a");
  mobileLinks.forEach((link) => {
    link.addEventListener("click", closePanel);
  });

  // Close on window resize to desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1024) closePanel();
  });
}

// Book Now button
const bookNowBtn = document.getElementById("bookNowBtn");
if (bookNowBtn) {
  bookNowBtn.addEventListener("click", () => {
    // Redirect to booking page or open booking modal
    window.location.href = "contact.html";
  });
}

// Back to top button and WhatsApp float toggle - Only initialize if elements exist
const backToTop = document.getElementById("backToTop");
const scrollToTop = document.getElementById("scrollToTop"); // Alternative ID used in blog page
const whatsappFloat = document.getElementById("whatsappFloat");
const footer = document.querySelector(".footer");
const navbar = document.getElementById("navbar");

// Function to check if element is in viewport
function isInViewport(element) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return rect.top <= window.innerHeight && rect.bottom >= 0;
}

// Navbar hide/show on scroll - Only initialize if navbar exists
if (navbar) {
  let lastScrollTop = 0;
  let scrollThreshold = 100; // Only start hiding after scrolling 100px

  window.addEventListener("scroll", () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Show/hide back to top button based on scroll position
    if (backToTop) {
      if (window.pageYOffset > 300) {
        backToTop.classList.add("visible");
      } else {
        backToTop.classList.remove("visible");
      }
    }

    // Handle the alternative scroll-to-top button in blog page
    if (scrollToTop) {
      if (window.pageYOffset > 300) {
        scrollToTop.classList.add("visible");
      } else {
        scrollToTop.classList.remove("visible");
      }
    }

    // Toggle between WhatsApp and back to top when footer is visible
    if (footer && whatsappFloat && backToTop) {
      if (isInViewport(footer)) {
        whatsappFloat.classList.add("hidden");
        backToTop.classList.add("visible");
      } else if (window.pageYOffset > 300) {
        whatsappFloat.classList.remove("hidden");
        backToTop.classList.remove("visible");
      }
    }

    // Hide/show navbar based on scroll direction
    if (scrollTop > scrollThreshold) {
      if (scrollTop > lastScrollTop) {
        // Scrolling down
        navbar.classList.add("hidden");
      } else {
        // Scrolling up
        navbar.classList.remove("hidden");
      }
    } else {
      // At the top of the page
      navbar.classList.remove("hidden");
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
  });
}

// Back to top functionality
if (backToTop) {
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// Handle the alternative scroll-to-top button in blog page
if (scrollToTop) {
  scrollToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
