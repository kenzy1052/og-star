// Work opportunities data
const workOpportunities = [
  {
    title: "Dubai, UAE",
    location: "United Arab Emirates",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800",
    badge: "HOT",
    positions: [
      "Carpentry",
      "Painter",
      "Furniture Helper",
      "General Worker",
      "etc",
    ],
    count: "20+",
    link: "UAE.html",
  },
  {
    title: "Asia",
    location: "Across Asia",
    image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800",
    badge: "NEW",
    positions: [
      "Teaching & Education",
      "IT - Technology",
      "Business & Finance",
      "etc",
    ],
    count: "30+",
    link: "Asia.html",
  },
  {
    title: "Europe Opportunities",
    location: "Across Europe",
    image: "https://images.unsplash.com/photo-1522092576479-2c8e7a4a4a3a?w=800",
    badge: "URGENT",
    positions: [
      "Healthcare Professionals",
      "Skilled Labor",
      "Hospitality & Tourism",
    ],
    count: "35+",
    link: "Europe.html",
  },
  {
    title: "The American Dream",
    location: "Across America",
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800",
    badge: "NEW",
    positions: [
      "Sales Assistant",
      "Store Manager",
      "IT - Technology",
      "Skilled Workers",
      "etc",
    ],
    count: "35+",
    link: "America.html",
  },
  {
    title: "Canadian Dream",
    location: "Across Canada",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    badge: "HIGH PAY",
    positions: [
      "Technician",
      "Engineer",
      "IT - Technology",
      "Carpentry",
      "etc",
    ],
    count: "20+",
    link: "Canada.html",
  },
];

// Initialize general functionality
if (typeof initGeneral === "function") {
  initGeneral();
}

// Scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -45px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, observerOptions);

document.querySelectorAll(".scroll-animate").forEach((el) => {
  observer.observe(el);
});

// FAQ Accordion functionality
document.querySelectorAll(".faq-question").forEach((question) => {
  question.addEventListener("click", () => {
    const faqItem = question.parentElement;
    const isActive = faqItem.classList.contains("active");

    // Close all FAQ items
    document.querySelectorAll(".faq-item").forEach((item) => {
      item.classList.remove("active");
    });

    // Open clicked item if it wasn't active
    if (!isActive) {
      faqItem.classList.add("active");
    }
  });
});

// Testimonials carousel functionality
function initTestimonialsCarousel() {
  const testimonialsTrack = document.getElementById("testimonialsTrack");
  const testimonialDots = document.getElementById("testimonialDots");
  const testimonialCards = document.querySelectorAll(".testimonial-card");

  // Check if testimonials elements exist
  if (!testimonialsTrack || !testimonialDots || testimonialCards.length === 0) {
    return;
  }

  let currentIndex = 0;
  let autoRotateTimer = null;
  const autoRotateInterval = 3000;

  // Calculate visible cards based on screen size
  function getVisibleCards() {
    if (window.innerWidth >= 1024) {
      return 4; // Desktop
    } else if (window.innerWidth >= 768) {
      return 2; // Tablet
    } else {
      return 1; // Mobile
    }
  }

  // Clone cards for infinite loop
  function cloneCards() {
    const visibleCards = getVisibleCards();
    const cardsToClone = Math.min(visibleCards, testimonialCards.length);

    // Clone first few cards and append to end
    for (let i = 0; i < cardsToClone; i++) {
      const clone = testimonialCards[i].cloneNode(true);
      testimonialsTrack.appendChild(clone);
    }
  }

  // Create dots
  function createDots() {
    testimonialDots.innerHTML = "";
    for (let i = 0; i < testimonialCards.length; i++) {
      const dot = document.createElement("span");
      dot.className = "testimonial-dot";
      if (i === 0) dot.classList.add("active");
      dot.addEventListener("click", () => {
        currentIndex = i;
        updateCarousel();
        resetAutoRotate();
      });
      testimonialDots.appendChild(dot);
    }
  }

  // Update carousel position
  function updateCarousel() {
    const cardWidth = testimonialCards[0].offsetWidth;
    const gap = 30; // Gap between cards
    const offset = currentIndex * (cardWidth + gap);
    testimonialsTrack.style.transform = `translateX(-${offset}px)`;

    // Update dots
    document.querySelectorAll(".testimonial-dot").forEach((dot, index) => {
      dot.classList.toggle("active", index === currentIndex);
    });
  }

  // Next slide
  function nextSlide() {
    currentIndex = (currentIndex + 1) % testimonialCards.length;
    updateCarousel();
  }

  // Auto-rotate
  function startAutoRotate() {
    stopAutoRotate();
    autoRotateTimer = setInterval(nextSlide, autoRotateInterval);
  }

  function stopAutoRotate() {
    if (autoRotateTimer) {
      clearInterval(autoRotateTimer);
      autoRotateTimer = null;
    }
  }

  function resetAutoRotate() {
    stopAutoRotate();
    startAutoRotate();
  }

  // Initialize
  cloneCards();
  createDots();
  updateCarousel();
  startAutoRotate();

  // Pause on hover
  testimonialsTrack.addEventListener("mouseenter", stopAutoRotate);
  testimonialsTrack.addEventListener("mouseleave", startAutoRotate);

  // Handle window resize
  window.addEventListener("resize", () => {
    // Clear clones
    const allCards = testimonialsTrack.querySelectorAll(".testimonial-card");
    for (let i = testimonialCards.length; i < allCards.length; i++) {
      allCards[i].remove();
    }

    // Reinitialize
    cloneCards();
    updateCarousel();
  });
}

// Work opportunities carousel functionality
function initWorkCarousel() {
  const workTrack = document.getElementById("workTrack");
  const workDots = document.getElementById("workDots");

  // Check if work carousel elements exist
  if (!workTrack || !workDots) {
    return;
  }

  let currentIndex = 0;
  let autoRotateTimer = null;
  const autoRotateInterval = 3000;

  // Calculate visible cards based on screen size
  function getVisibleCards() {
    if (window.innerWidth >= 1024) {
      return 3; // Desktop
    } else if (window.innerWidth >= 768) {
      return 2; // Tablet
    } else {
      return 1; // Mobile
    }
  }

  // Create work cards
  function createWorkCards() {
    workTrack.innerHTML = "";
    workOpportunities.forEach((opportunity) => {
      const card = document.createElement("a");
      card.href = opportunity.link;
      card.className = "work-card";
      card.innerHTML = `
              <div class="work-card-image">
                <img src="${opportunity.image}" alt="${opportunity.title}" />
              </div>
              <div class="work-card-content">
                <h3 class="work-card-title">${opportunity.title}</h3>
                <div class="work-card-location">
                  <i class="fas fa-map-marker-alt"></i>
                  <span>${opportunity.location}</span>
                </div>
                <div class="work-positions">
                  ${opportunity.positions
                    .map((pos) => `<span class="work-position">${pos}</span>`)
                    .join("")}
                </div>
                <div class="work-footer">
                  <span class="work-positions-count">
                    <i class="fas fa-briefcase"></i>
                    ${opportunity.count} Positions
                  </span>
                  <a class="work-btn" href="${opportunity.link}">
                    Explore <i class="fas fa-arrow-right"></i>
                  </a>
                </div>
              </div>
            `;
      workTrack.appendChild(card);
    });
  }

  // Clone cards for infinite loop
  function cloneCards() {
    const visibleCards = getVisibleCards();
    const workCards = workTrack.querySelectorAll(".work-card");
    const cardsToClone = Math.min(visibleCards, workCards.length);

    // Clone first few cards and append to end
    for (let i = 0; i < cardsToClone; i++) {
      const clone = workCards[i].cloneNode(true);
      workTrack.appendChild(clone);
    }
  }

  // Create dots
  function createDots() {
    workDots.innerHTML = "";
    for (let i = 0; i < workOpportunities.length; i++) {
      const dot = document.createElement("span");
      dot.className = "carousel-dot";
      if (i === 0) dot.classList.add("active");
      dot.addEventListener("click", () => {
        currentIndex = i;
        updateCarousel();
        resetAutoRotate();
      });
      workDots.appendChild(dot);
    }
  }

  // Update carousel position
  function updateCarousel() {
    const workCards = workTrack.querySelectorAll(".work-card");
    if (workCards.length === 0) return;

    const cardWidth = workCards[0].offsetWidth;
    const gap = 30; // Gap between cards
    const offset = currentIndex * (cardWidth + gap);
    workTrack.style.transform = `translateX(-${offset}px)`;

    // Update dots
    document.querySelectorAll(".carousel-dot").forEach((dot, index) => {
      dot.classList.toggle("active", index === currentIndex);
    });
  }

  // Next slide
  function nextSlide() {
    currentIndex = (currentIndex + 1) % workOpportunities.length;
    updateCarousel();
  }

  // Auto-rotate
  function startAutoRotate() {
    stopAutoRotate();
    autoRotateTimer = setInterval(nextSlide, autoRotateInterval);
  }

  function stopAutoRotate() {
    if (autoRotateTimer) {
      clearInterval(autoRotateTimer);
      autoRotateTimer = null;
    }
  }

  function resetAutoRotate() {
    stopAutoRotate();
    startAutoRotate();
  }

  // Initialize
  createWorkCards();
  cloneCards();
  createDots();
  updateCarousel();
  startAutoRotate();

  // Pause on hover
  workTrack.addEventListener("mouseenter", stopAutoRotate);
  workTrack.addEventListener("mouseleave", startAutoRotate);

  // Handle window resize
  window.addEventListener("resize", () => {
    // Clear clones
    const allCards = workTrack.querySelectorAll(".work-card");
    for (let i = workOpportunities.length; i < allCards.length; i++) {
      allCards[i].remove();
    }

    // Reinitialize
    createWorkCards();
    cloneCards();
    updateCarousel();
  });
}

// Initialize carousels when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  initTestimonialsCarousel();
  initWorkCarousel();
});

// Also initialize work carousel on window load to ensure it's properly rendered
window.addEventListener("load", function () {
  // Check if work carousel is already initialized
  const workTrack = document.getElementById("workTrack");
  if (workTrack && workTrack.children.length === 0) {
    initWorkCarousel();
  }
});
