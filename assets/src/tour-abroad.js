// ===================================
// INITIALIZE ALL FUNCTIONS ON DOM LOAD
// ===================================
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM Content Loaded - Initializing...");

  // Initialize functions in order
  initGalleryRotating();
  initGalleryLightbox();
  initToursCarousel();
});

// ===================================
// GALLERY ROTATING CARDS
// ===================================
function initGalleryRotating() {
  const cards = document.querySelectorAll(".gallery-card");
  const totalCards = cards.length;
  let currentCard = 0;

  function rotateCards() {
    cards.forEach((card, index) => {
      card.classList.remove("front", "left", "right", "back");

      const cardIndex = (currentCard + index) % totalCards;
      if (cardIndex === 0) {
        card.classList.add("front");
      } else if (cardIndex === 1) {
        card.classList.add("right");
      } else if (cardIndex === totalCards - 1) {
        card.classList.add("left");
      } else {
        card.classList.add("back");
      }
    });

    currentCard = (currentCard + 1) % totalCards;
  }

  rotateCards();
  setInterval(rotateCards, 3000);

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const index = parseInt(card.getAttribute("data-index"));
      openLightbox(index);
    });
  });
}

// ===================================
// LIGHTBOX FUNCTIONALITY
// ===================================
// Dynamically extract images from the current page
function getGalleryImages() {
  const galleryCards = document.querySelectorAll(".gallery-card img");
  const images = [];

  galleryCards.forEach((card) => {
    // Get the src attribute and convert to high resolution version
    const src = card.getAttribute("src");
    // Replace the small version (600x600) with high resolution version (1600x1200)
    const highResSrc = src.replace(/w=600&h=600/g, "w=1600&h=1200");
    images.push(highResSrc);
  });

  return images;
}

let images = [];
let currentImageIndex = 0;
let lightboxHistoryState = null;
let previousNavbarState = null; // Store navbar state before opening lightbox

function initGalleryLightbox() {
  // Extract images from the current page
  images = getGalleryImages();
  // Lightbox is ready to be opened by clicking gallery cards
}

function openLightbox(index) {
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxCounter = document.getElementById("lightboxCounter");
  const navbar = document.getElementById("navbar");

  // Store current navbar state before hiding it
  previousNavbarState = {
    isVisible: navbar.classList.contains("navbar-visible"),
    transform: navbar.style.transform,
    transition: navbar.style.transition,
  };

  // Hide navbar when lightbox opens
  navbar.style.transform = "translateY(-100%)";
  navbar.style.transition = "transform 0.3s ease-in-out";
  navbar.classList.remove("navbar-visible");

  currentImageIndex = index;
  lightboxImage.src = images[currentImageIndex];
  lightboxCounter.textContent = `Image ${currentImageIndex + 1} of ${
    images.length
  }`;
  lightbox.classList.add("active");
  document.body.style.overflow = "hidden";

  resetTransform();
  setupTouchEvents();
  setupMouseEvents();
  setupKeyboardEvents();
  setupMouseWheelZoom();
  setupHistoryListener();
  pushLightboxHistory();
}

function closeLightbox() {
  closeLightboxWithoutHistory();
  removeLightboxHistory();
}

function updateLightboxImage() {
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxCounter = document.getElementById("lightboxCounter");

  lightboxImage.src = images[currentImageIndex];
  lightboxCounter.textContent = `Image ${currentImageIndex + 1} of ${
    images.length
  }`;

  resetTransform();
  if (lightboxHistoryState) {
    lightboxHistoryState.imageIndex = currentImageIndex;
    history.replaceState(lightboxHistoryState, "", window.location.href);
  }
}

function previousImage() {
  if (currentImageIndex > 0) {
    currentImageIndex--;
    updateLightboxImage();
  } else {
    currentImageIndex = images.length - 1;
    updateLightboxImage();
  }
}

function nextImage() {
  if (currentImageIndex < images.length - 1) {
    currentImageIndex++;
    updateLightboxImage();
  } else {
    currentImageIndex = 0;
    updateLightboxImage();
  }
}

// ZOOM & PAN FUNCTIONALITY
let transform = {
  scale: 1,
  translateX: 0,
  translateY: 0,
};

let gestureState = {
  lastTouchEnd: 0,
  lastTapTime: 0,
  lastTapPosition: { x: 0, y: 0 },
  touchStartPoint: { x: 0, y: 0 },
  touchStartTime: 0,
  isDragging: false,
  isPinching: false,
  hasMoved: false,
  totalMovement: 0,
  pinchData: {
    startDistance: 0,
    startScale: 1,
    startCenter: { x: 0, y: 0 },
    startTransform: { scale: 1, translateX: 0, translateY: 0 },
    currentCenter: { x: 0, y: 0 },
  },
};

const PAN_SENSITIVITY = 2.0;
const DOUBLE_TAP_DELAY = 200;
const TAP_MOVEMENT_THRESHOLD = 10;
const SWIPE_THRESHOLD = 30;
const PINCH_THRESHOLD = 5;

function updateTransform() {
  const container = document.getElementById("lightboxImageContainer");
  if (!container) return;

  container.style.transform = `translate(${transform.translateX}px, ${transform.translateY}px) scale(${transform.scale})`;

  if (transform.scale > 1.01) {
    container.classList.add("zoomed");
  } else {
    container.classList.remove("zoomed");
  }
}

function resetTransform() {
  transform = { scale: 1, translateX: 0, translateY: 0 };
  updateTransform();
}

function getDistance(touch1, touch2) {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getMidpoint(touch1, touch2) {
  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2,
  };
}

function getImageCoordinates(clientX, clientY) {
  const container = document.getElementById("lightboxContent");
  if (!container) return { x: 0, y: 0 };

  const containerRect = container.getBoundingClientRect();

  return {
    x: clientX - containerRect.left - containerRect.width / 2,
    y: clientY - containerRect.top - containerRect.height / 2,
  };
}

function getImageBounds() {
  const container = document.getElementById("lightboxContent");
  const image = document.getElementById("lightboxImage");

  if (!container || !image || !image.naturalWidth) {
    return { width: 0, height: 0, displayedWidth: 0, displayedHeight: 0 };
  }

  const containerRect = container.getBoundingClientRect();
  const imageAspect = image.naturalWidth / image.naturalHeight;
  const containerAspect = containerRect.width / containerRect.height;

  let displayedWidth, displayedHeight;
  if (imageAspect > containerAspect) {
    displayedWidth = containerRect.width * 0.95;
    displayedHeight = (containerRect.width * 0.95) / imageAspect;
  } else {
    displayedHeight = containerRect.height * 0.95;
    displayedWidth = containerRect.height * 0.95 * imageAspect;
  }

  return {
    width: containerRect.width,
    height: containerRect.height,
    displayedWidth,
    displayedHeight,
  };
}

function applyBoundaries() {
  const bounds = getImageBounds();
  if (bounds.displayedWidth === 0) return;

  const zoomedWidth = bounds.displayedWidth * transform.scale;
  const zoomedHeight = bounds.displayedHeight * transform.scale;

  let maxX = 0,
    maxY = 0;

  if (zoomedWidth > bounds.width) {
    maxX = (zoomedWidth - bounds.width) / 2;
  }
  if (zoomedHeight > bounds.height) {
    maxY = (zoomedHeight - bounds.height) / 2;
  }

  const buffer = 5;
  transform.translateX = Math.max(
    -maxX - buffer,
    Math.min(maxX + buffer, transform.translateX)
  );
  transform.translateY = Math.max(
    -maxY - buffer,
    Math.min(maxY + buffer, transform.translateY)
  );
}

function setupTouchEvents() {
  const container = document.getElementById("lightboxContent");
  if (!container) return;

  container.addEventListener("touchstart", handleTouchStart, {
    passive: false,
  });
  container.addEventListener("touchmove", handleTouchMove, {
    passive: false,
  });
  container.addEventListener("touchend", handleTouchEnd, {
    passive: false,
  });
  container.addEventListener("touchcancel", handleTouchCancel, {
    passive: false,
  });
}

function removeTouchEvents() {
  const container = document.getElementById("lightboxContent");
  if (container) {
    container.removeEventListener("touchstart", handleTouchStart);
    container.removeEventListener("touchmove", handleTouchMove);
    container.removeEventListener("touchend", handleTouchEnd);
    container.removeEventListener("touchcancel", handleTouchCancel);
  }
}

function resetGestureState() {
  gestureState.isDragging = false;
  gestureState.isPinching = false;
  gestureState.hasMoved = false;
  gestureState.totalMovement = 0;
}

function handleTouchStart(e) {
  const now = Date.now();

  if (e.touches.length === 1) {
    const touch = e.touches[0];

    resetGestureState();

    gestureState.touchStartPoint = { x: touch.clientX, y: touch.clientY };
    gestureState.touchStartTime = now;

    const timeSinceLastTap = now - gestureState.lastTapTime;
    const distanceFromLastTap = Math.sqrt(
      Math.pow(touch.clientX - gestureState.lastTapPosition.x, 2) +
        Math.pow(touch.clientY - gestureState.lastTapPosition.y, 2)
    );

    if (
      timeSinceLastTap < DOUBLE_TAP_DELAY &&
      timeSinceLastTap > 50 &&
      distanceFromLastTap < TAP_MOVEMENT_THRESHOLD
    ) {
      e.preventDefault();
      toggleZoomAtExactPoint(touch.clientX, touch.clientY);
      gestureState.lastTapTime = 0;
      return;
    }

    gestureState.lastTapPosition = { x: touch.clientX, y: touch.clientY };
    gestureState.lastTapTime = now;
  } else if (e.touches.length === 2) {
    e.preventDefault();

    gestureState.isDragging = false;
    gestureState.isPinching = true;
    gestureState.hasMoved = false;

    const center = getMidpoint(e.touches[0], e.touches[1]);
    gestureState.pinchData.startDistance = getDistance(
      e.touches[0],
      e.touches[1]
    );
    gestureState.pinchData.startScale = transform.scale;
    gestureState.pinchData.startCenter = center;
    gestureState.pinchData.currentCenter = center;
    gestureState.pinchData.startTransform = { ...transform };
  }
}

function handleTouchMove(e) {
  e.preventDefault();

  if (gestureState.isPinching && e.touches.length === 2) {
    const currentDistance = getDistance(e.touches[0], e.touches[1]);
    const currentCenter = getMidpoint(e.touches[0], e.touches[1]);
    const distanceDelta = Math.abs(
      currentDistance - gestureState.pinchData.startDistance
    );

    if (distanceDelta < PINCH_THRESHOLD && !gestureState.hasMoved) return;

    gestureState.hasMoved = true;
    gestureState.pinchData.currentCenter = currentCenter;

    const scaleFactor = currentDistance / gestureState.pinchData.startDistance;
    let newScale = gestureState.pinchData.startScale * scaleFactor;
    newScale = Math.max(1, Math.min(5, newScale));

    const pinchPoint = getImageCoordinates(currentCenter.x, currentCenter.y);

    const scaleChange = newScale - gestureState.pinchData.startTransform.scale;
    transform.translateX =
      gestureState.pinchData.startTransform.translateX -
      pinchPoint.x * scaleChange;
    transform.translateY =
      gestureState.pinchData.startTransform.translateY -
      pinchPoint.y * scaleChange;
    transform.scale = newScale;

    if (transform.scale <= 1.01) {
      resetTransform();
      return;
    }

    applyBoundaries();
    updateTransform();
  } else if (e.touches.length === 1 && !gestureState.isPinching) {
    const touch = e.touches[0];
    const deltaX = touch.clientX - gestureState.touchStartPoint.x;
    const deltaY = touch.clientY - gestureState.touchStartPoint.y;
    const totalDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    gestureState.totalMovement = totalDistance;

    if (transform.scale > 1.01 && totalDistance > TAP_MOVEMENT_THRESHOLD) {
      if (!gestureState.isDragging) {
        gestureState.isDragging = true;
        gestureState.hasMoved = true;
      }
    }

    if (gestureState.isDragging) {
      const moveDeltaX =
        (touch.clientX - gestureState.touchStartPoint.x) * PAN_SENSITIVITY;
      const moveDeltaY =
        (touch.clientY - gestureState.touchStartPoint.y) * PAN_SENSITIVITY;

      transform.translateX += moveDeltaX;
      transform.translateY += moveDeltaY;

      applyBoundaries();
      updateTransform();

      gestureState.touchStartPoint = {
        x: touch.clientX,
        y: touch.clientY,
      };
    }
  }
}

function handleTouchEnd(e) {
  const now = Date.now();
  const touchDuration = now - gestureState.touchStartTime;

  if (e.touches.length === 0) {
    gestureState.lastTouchEnd = now;

    if (
      !gestureState.isPinching &&
      !gestureState.isDragging &&
      transform.scale <= 1.01 &&
      gestureState.totalMovement > SWIPE_THRESHOLD &&
      touchDuration < 500
    ) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - gestureState.touchStartPoint.x;
      const deltaY = touch.clientY - gestureState.touchStartPoint.y;

      if (
        Math.abs(deltaX) > Math.abs(deltaY) &&
        Math.abs(deltaX) > SWIPE_THRESHOLD
      ) {
        if (deltaX > 0) {
          previousImage();
        } else {
          nextImage();
        }
      }
    }

    resetGestureState();
  } else if (e.touches.length === 1 && gestureState.isPinching) {
    gestureState.isPinching = false;
    gestureState.isDragging = false;
    gestureState.hasMoved = false;
    gestureState.touchStartPoint = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    gestureState.touchStartTime = now;
  }
}

function handleTouchCancel(e) {
  resetGestureState();
}

function toggleZoomAtExactPoint(clientX, clientY) {
  const imageCoords = getImageCoordinates(clientX, clientY);

  if (transform.scale <= 1.01) {
    const targetScale = 2.5;
    const scaleChange = targetScale - transform.scale;

    transform.translateX = transform.translateX - imageCoords.x * scaleChange;
    transform.translateY = transform.translateY - imageCoords.y * scaleChange;
    transform.scale = targetScale;

    applyBoundaries();
  } else {
    resetTransform();
  }

  updateTransform();
}

function pushLightboxHistory() {
  lightboxHistoryState = {
    lightbox: true,
    imageIndex: currentImageIndex,
    timestamp: Date.now(),
  };
  history.pushState(lightboxHistoryState, "", window.location.href);
}

function removeLightboxHistory() {
  if (lightboxHistoryState) {
    history.back();
    lightboxHistoryState = null;
  }
}

function setupHistoryListener() {
  window.addEventListener("popstate", handlePopState);
}

function removeHistoryListener() {
  window.removeEventListener("popstate", handlePopState);
}

function handlePopState(event) {
  const lightbox = document.getElementById("lightbox");

  if (lightbox && lightbox.classList.contains("active")) {
    if (event.state && event.state.lightbox) {
      return;
    } else {
      closeLightboxWithoutHistory();
      if (lightboxHistoryState) {
        history.pushState(null, "", window.location.href);
      }
    }
  }
}

function closeLightboxWithoutHistory() {
  const lightbox = document.getElementById("lightbox");
  const navbar = document.getElementById("navbar");

  lightbox.classList.remove("active");
  document.body.style.overflow = "auto";

  // Restore navbar state after closing lightbox
  if (previousNavbarState) {
    // Restore the navbar to its previous state
    if (previousNavbarState.isVisible) {
      navbar.style.transform = previousNavbarState.transform || "translateY(0)";
      navbar.classList.add("navbar-visible");
    } else {
      navbar.style.transform = "translateY(-100%)";
      navbar.classList.remove("navbar-visible");
    }

    // Restore transition property
    if (previousNavbarState.transition) {
      navbar.style.transition = previousNavbarState.transition;
    } else {
      navbar.style.transition = "";
    }

    previousNavbarState = null;
  }

  removeTouchEvents();
  removeMouseEvents();
  removeKeyboardEvents();
  removeMouseWheelZoom();
  removeHistoryListener();

  lightboxHistoryState = null;
}

// MOUSE EVENTS (DESKTOP)
let isMouseDragging = false;
let mouseLastPoint = { x: 0, y: 0 };
let mouseStartTime = 0;

function setupMouseEvents() {
  const container = document.getElementById("lightboxImageContainer");

  container.addEventListener("mousedown", handleMouseDown);
  container.addEventListener("dblclick", handleMouseDoubleClick);
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
  document.addEventListener("mouseleave", handleMouseUp);

  container.addEventListener("contextmenu", (e) => e.preventDefault());
}

function removeMouseEvents() {
  const container = document.getElementById("lightboxImageContainer");
  if (container) {
    container.removeEventListener("mousedown", handleMouseDown);
    container.removeEventListener("dblclick", handleMouseDoubleClick);
  }
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", handleMouseUp);
  document.removeEventListener("mouseleave", handleMouseUp);
}

function handleMouseDoubleClick(e) {
  e.preventDefault();
  toggleZoomAtExactPoint(e.clientX, e.clientY);
}

function handleMouseDown(e) {
  if (e.button !== 0) return;

  mouseStartTime = Date.now();

  if (transform.scale > 1.01) {
    isMouseDragging = true;
    mouseLastPoint = { x: e.clientX, y: e.clientY };

    const container = document.getElementById("lightboxImageContainer");
    container.classList.add("dragging");
  }

  e.preventDefault();
}

function handleMouseMove(e) {
  if (!isMouseDragging) return;

  const deltaX = (e.clientX - mouseLastPoint.x) * PAN_SENSITIVITY;
  const deltaY = (e.clientY - mouseLastPoint.y) * PAN_SENSITIVITY;

  transform.translateX += deltaX;
  transform.translateY += deltaY;

  applyBoundaries();
  updateTransform();

  mouseLastPoint = { x: e.clientX, y: e.clientY };
}

function handleMouseUp(e) {
  if (isMouseDragging) {
    isMouseDragging = false;
    const container = document.getElementById("lightboxImageContainer");
    if (container) {
      container.classList.remove("dragging");
    }
  }
}

// MOUSE WHEEL ZOOM
function setupMouseWheelZoom() {
  const lightbox = document.getElementById("lightbox");
  lightbox.addEventListener("wheel", handleMouseWheel, {
    passive: false,
  });
}

function removeMouseWheelZoom() {
  const lightbox = document.getElementById("lightbox");
  if (lightbox) {
    lightbox.removeEventListener("wheel", handleMouseWheel);
  }
}

function handleMouseWheel(e) {
  e.preventDefault();

  const zoomSpeed = 0.008;
  const zoomDelta = -e.deltaY * zoomSpeed;
  let newScale = transform.scale + zoomDelta;

  newScale = Math.max(1, Math.min(5, newScale));

  const cursorPoint = getImageCoordinates(e.clientX, e.clientY);
  const scaleChange = newScale - transform.scale;

  transform.translateX = transform.translateX - cursorPoint.x * scaleChange;
  transform.translateY = transform.translateY - cursorPoint.y * scaleChange;
  transform.scale = newScale;

  if (transform.scale <= 1.01) {
    resetTransform();
    return;
  }

  applyBoundaries();
  updateTransform();
}

// KEYBOARD FUNCTIONALITY
function setupKeyboardEvents() {
  document.addEventListener("keydown", handleKeyDown);
}

function removeKeyboardEvents() {
  document.removeEventListener("keydown", handleKeyDown);
}

function handleKeyDown(e) {
  const lightbox = document.getElementById("lightbox");
  if (lightbox && lightbox.classList.contains("active")) {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      closeLightbox();
      return false;
    } else if (transform.scale <= 1.01) {
      if (e.key === "ArrowLeft") {
        previousImage();
      } else if (e.key === "ArrowRight") {
        nextImage();
      }
    } else {
      const panAmount = 60 * PAN_SENSITIVITY;

      if (e.key === "ArrowLeft") {
        transform.translateX -= panAmount;
      } else if (e.key === "ArrowRight") {
        transform.translateX += panAmount;
      } else if (e.key === "ArrowUp") {
        transform.translateY -= panAmount;
      } else if (e.key === "ArrowDown") {
        transform.translateY += panAmount;
      }

      applyBoundaries();
      updateTransform();
    }
  }
}

// ===================================
// TOURS CAROUSEL - IMPROVED
// ===================================
function initToursCarousel() {
  console.log("Initializing Tours Carousel...");

  const tours = [
    {
      title: "Dubai Experience",
      location: "Dubai, UAE",
      image:
        "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800",
      maxPeople: 25,
      days: 7,
    },
    {
      title: "Nairobi Adventure",
      location: "Nairobi, Kenya",
      image:
        "https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=800",
      maxPeople: 30,
      days: 5,
    },
    {
      title: "Bali & Malaysia",
      location: "Bali & Kuala Lumpur",
      image:
        "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800",
      maxPeople: 20,
      days: 10,
    },
    {
      title: "Jo'burg Special",
      location: "Johannesburg, South Africa",
      image:
        "https://images.unsplash.com/photo-1577948000111-9c970dfe3743?w=800",
      maxPeople: 25,
      days: 6,
    },
    {
      title: "Morocco Magic",
      location: "Marrakech, Morocco",
      image:
        "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=800",
      maxPeople: 20,
      days: 7,
    },
    {
      title: "Mombasa Feeling",
      location: "Mombasa, Kenya",
      image:
        "https://images.unsplash.com/photo-1590521781837-d074a9c00c60?w=800",
      maxPeople: 30,
      days: 5,
    },
    {
      title: "Phil's Paradise",
      location: "Manila, Philippines",
      image:
        "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800",
      maxPeople: 25,
      days: 8,
    },
    {
      title: "Seychelles Escape",
      location: "Seychelles",
      image:
        "https://images.unsplash.com/photo-1505881502353-a1986add3762?w=800",
      maxPeople: 15,
      days: 7,
    },
    {
      title: "Abidjan Discovery",
      location: "Abidjan, Ivory Coast",
      image:
        "https://images.unsplash.com/photo-1531314146329-946e97b18f16?w=800",
      maxPeople: 30,
      days: 4,
    },
    {
      title: "Zanzibar Bliss",
      location: "Zanzibar, Tanzania",
      image:
        "https://images.unsplash.com/photo-1505881502353-a1986add3762?w=800",
      maxPeople: 20,
      days: 6,
    },
    {
      title: "Tanzania Safari",
      location: "Tanzania",
      image:
        "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800",
      maxPeople: 20,
      days: 8,
    },
    {
      title: "Singapore Journey",
      location: "Singapore",
      image:
        "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800",
      maxPeople: 25,
      days: 5,
    },
    {
      title: "Turkey Delight",
      location: "Istanbul, Turkey",
      image:
        "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800",
      maxPeople: 30,
      days: 7,
    },
    {
      title: "Cape Town Special",
      location: "Cape Town, South Africa",
      image:
        "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800",
      maxPeople: 25,
      days: 6,
    },
    {
      title: "Addis Ababa Tour",
      location: "Addis Ababa, Ethiopia",
      image:
        "https://images.unsplash.com/photo-1580549793385-de0a6b6b5ace?w=800",
      maxPeople: 30,
      days: 5,
    },
    {
      title: "Europe Grand Tour",
      location: "Multiple Cities, Europe",
      image:
        "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800",
      maxPeople: 20,
      days: 14,
    },
    {
      title: "Family Getaway",
      location: "Various Destinations",
      image:
        "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800",
      maxPeople: 30,
      days: 7,
    },
    {
      title: "X-MAS Experience",
      location: "Seasonal Destinations",
      image:
        "https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=800",
      maxPeople: 25,
      days: 7,
    },
    {
      title: "Relaxation Retreat",
      location: "Beach Resorts",
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
      maxPeople: 20,
      days: 5,
    },
    {
      title: "Festival Getaways",
      location: "Event Locations",
      image:
        "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800",
      maxPeople: 30,
      days: 4,
    },
  ];

  // Initialize the improved carousel
  new CircularCarousel({
    wrapperId: "toursCarousel",
    trackId: "toursTrack",
    dotsId: "carouselDots",
    autoMs: 3000,
    toursData: tours,
  });
}

// CircularCarousel Class - Improved from the first HTML
class CircularCarousel {
  constructor({ wrapperId, trackId, dotsId, autoMs = 3000, toursData = [] }) {
    this.wrapper = document.getElementById(wrapperId);
    this.track = document.getElementById(trackId);
    this.dotsWrap = document.getElementById(dotsId);
    this.autoMs = autoMs;
    this.toursData = toursData;

    this.gap = 20;
    this.cloneCount = 0;
    this.index = 0; // logical index among originals (0..n-1)
    this.cardWidth = 0;
    this.moveIncrement = 0;
    this.autoTimer = null;

    // drag state
    this.isDragging = false;
    this.startX = 0;
    this.prevTranslate = 0;
    this.dragThreshold = 60;

    // store original nodes as templates
    this.originalTemplateNodes = [];
    this.originalCount = 0;

    // bind
    this._onTransitionEnd = this._onTransitionEnd.bind(this);
    this._onResize = this._onResize.bind(this);
    this._onVisibility = this._onVisibility.bind(this);

    // init
    this._init();
  }

  _readVisualCount() {
    const val = getComputedStyle(this.wrapper).getPropertyValue(
      "--tours-count"
    );
    const n = parseInt(val);
    return n && n > 0 ? n : 1;
  }

  _init() {
    // Create tour cards from data
    this._createTourCards();

    // visual count & clones
    this.visualCount = this._readVisualCount();
    this.cloneCount = this.visualCount;

    // create clones
    this._createClones();

    // items reference
    this.items = Array.from(this.track.children);

    // build dots
    this._buildDots();

    // layout sizes
    this._layout();

    // initial jump (no transition)
    this._jumpToIndex(this.index, false);

    // events
    this.track.addEventListener("transitionend", this._onTransitionEnd);
    window.addEventListener("resize", this._onResize);
    document.addEventListener("visibilitychange", this._onVisibility);

    // interactions
    this._enableDragTouch();

    // auto
    this._startAuto();
  }

  _createTourCards() {
    this.track.innerHTML = "";
    this.toursData.forEach((tour, index) => {
      const card = document.createElement("a");
      card.href = tour.link;
      card.className = "tour-card";
      card.innerHTML = `
              <img src="${tour.image}" alt="${tour.title}" class="tour-card-image" loading="lazy" />
              <div class="tour-card-content">
                <h3 class="tour-card-title">${tour.title}</h3>
                <div class="tour-card-location">
                  <i class="fas fa-map-marker-alt"></i>
                  <span>${tour.location}</span>
                </div>
              </div>
            `;
      this.track.appendChild(card);
      this.originalTemplateNodes.push(card.cloneNode(true));
    });
    this.originalCount = this.toursData.length;
  }

  _createClones() {
    const originals = Array.from(this.track.children);
    // append clones of first cloneCount to end
    for (let i = 0; i < this.cloneCount; i++) {
      const clone = originals[i].cloneNode(true);
      clone.setAttribute("data-clone", "end-" + i);
      this.track.appendChild(clone);
    }
    // prepend clones of last cloneCount to beginning
    for (let i = 0; i < this.cloneCount; i++) {
      const clone = originals[originals.length - 1 - i].cloneNode(true);
      clone.setAttribute("data-clone", "start-" + i);
      this.track.insertBefore(clone, this.track.firstChild);
    }
  }

  _buildDots() {
    this.dotsWrap.innerHTML = "";
    this.dots = [];
    for (let i = 0; i < this.originalCount; i++) {
      const d = document.createElement("span");
      d.className = "dot";
      if (i === 0) d.classList.add("active");
      ((idx) =>
        d.addEventListener("click", () => {
          this.index = idx;
          this._moveToIndex(this.index);
          this._resetAuto();
        }))(i);
      this.dotsWrap.appendChild(d);
      this.dots.push(d);
    }
  }

  _layout() {
    this.visualCount = this._readVisualCount();
    const wrapperW = this.wrapper.clientWidth;
    const totalGaps = (this.visualCount - 1) * this.gap;
    const cardW = (wrapperW - totalGaps) / this.visualCount;
    this.cardWidth = Math.floor(cardW);
    // apply flex-basis to all items
    Array.from(this.track.children).forEach((node) => {
      node.style.flex = `0 0 ${this.cardWidth}px`;
    });
    this.moveIncrement = this.cardWidth + this.gap;
    // remove transition while layout to avoid flashes
    this.track.style.transition = "none";
    this._jumpToIndex(this.index, false);
    requestAnimationFrame(() => {
      this.track.style.transition = "";
    });
    // update in-view visual after layout
    this._setInViewClass();
  }

  _enableDragTouch() {
    // mouse
    this.track.addEventListener("mousedown", (e) => {
      e.preventDefault();
      this.isDragging = true;
      this.startX = e.clientX;
      this.prevTranslate = -(this.index + this.cloneCount) * this.moveIncrement;
      this.track.style.transition = "none";
      this.track.classList.add("grabbing");
      this._stopAuto();
    });
    window.addEventListener("mousemove", (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.startX;
      this._setTranslate(this.prevTranslate + dx);
    });
    window.addEventListener("mouseup", (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.track.classList.remove("grabbing");
      const dx = e.clientX - this.startX;
      if (dx < -this.dragThreshold)
        this.index = (this.index + 1) % this.originalCount;
      else if (dx > this.dragThreshold)
        this.index = (this.index - 1 + this.originalCount) % this.originalCount;
      this._moveToIndex(this.index);
      this._resetAuto();
    });

    // touch
    this.track.addEventListener(
      "touchstart",
      (e) => {
        this.isDragging = true;
        this.startX = e.touches[0].clientX;
        this.prevTranslate =
          -(this.index + this.cloneCount) * this.moveIncrement;
        this.track.style.transition = "none";
        this._stopAuto();
      },
      { passive: true }
    );

    this.track.addEventListener(
      "touchmove",
      (e) => {
        if (!this.isDragging) return;
        const dx = e.touches[0].clientX - this.startX;
        this._setTranslate(this.prevTranslate + dx);
      },
      { passive: true }
    );

    this.track.addEventListener("touchend", (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      const dx = e.changedTouches[0].clientX - this.startX;
      if (dx < -this.dragThreshold)
        this.index = (this.index + 1) % this.originalCount;
      else if (dx > this.dragThreshold)
        this.index = (this.index - 1 + this.originalCount) % this.originalCount;
      this._moveToIndex(this.index);
      this._resetAuto();
    });

    // prevent default image drag
    this.track.addEventListener("dragstart", (e) => e.preventDefault());
  }

  _setTranslate(x) {
    this.track.style.transform = `translateX(${x}px)`;
  }

  _moveToIndex(i) {
    this.track.style.transition = `transform .6s cubic-bezier(0.22, 0.9, 0.35, 1)`;
    const x = -(i + this.cloneCount) * this.moveIncrement;
    this._setTranslate(x);
    this._updateDots(i);
    this._setInViewClass();
  }

  _jumpToIndex(i, withTransition = false) {
    if (!withTransition) this.track.style.transition = "none";
    const x = -(i + this.cloneCount) * this.moveIncrement;
    this._setTranslate(x);
    this._updateDots(i);
    this._setInViewClass();
    if (!withTransition)
      requestAnimationFrame(() => {
        this.track.style.transition = "";
      });
  }

  _onTransitionEnd() {
    // check if we are inside the clone zones, then jump to real counterpart
    const transformX = this._currentTransform();
    const alignedIndex = Math.round(-transformX / this.moveIncrement); // index among items (incl clones)
    const firstReal = this.cloneCount;
    const lastRealStart = firstReal + this.originalCount - 1;

    if (alignedIndex > lastRealStart) {
      // beyond last real -> wrap
      const offset = alignedIndex - (firstReal + this.originalCount);
      this.index = offset % this.originalCount;
      this._jumpToIndex(this.index, false);
    } else if (alignedIndex < firstReal) {
      // before first real -> wrap forward
      const offset = alignedIndex - firstReal + this.originalCount;
      this.index = offset % this.originalCount;
      this._jumpToIndex(this.index, false);
    } else {
      // in real zone
      this.index = (alignedIndex - firstReal) % this.originalCount;
      this._updateDots(this.index);
      this._setInViewClass();
    }
  }

  _currentTransform() {
    const st = window.getComputedStyle(this.track).transform;
    if (!st || st === "none") return 0;
    const values = st.match(/matrix.*\((.+)\)/)[1].split(", ");
    return parseFloat(values[4]);
  }

  _updateDots(i) {
    if (!this.dots) return;
    this.dots.forEach((d, idx) =>
      d.classList.toggle("active", idx === i % this.originalCount)
    );
  }

  _setInViewClass() {
    // Add .in-view to the leftmost visible card (logical index)
    // First remove from all
    Array.from(this.track.children).forEach((n) =>
      n.classList.remove("in-view")
    );
    // The node that corresponds to leftmost visible = cloneCount + index
    const pos = this.cloneCount + this.index;
    const node = this.track.children[pos];
    if (node) node.classList.add("in-view");
  }

  _startAuto() {
    this._stopAuto();
    this.autoTimer = setInterval(() => {
      this.index = (this.index + 1) % this.originalCount;
      this._moveToIndex(this.index);
    }, this.autoMs);
    // pause on hover (desktop)
    this.wrapper.addEventListener("mouseenter", () => this._stopAuto());
    this.wrapper.addEventListener("mouseleave", () => this._resetAuto());
  }

  _stopAuto() {
    clearInterval(this.autoTimer);
    this.autoTimer = null;
  }
  _resetAuto() {
    this._stopAuto();
    this._startAuto();
  }

  _onResize() {
    // Re-init layout because visual count might change
    const savedIndex = this.index;
    // remove listeners for safety
    this.track.removeEventListener("transitionend", this._onTransitionEnd);
    window.removeEventListener("resize", this._onResize);

    // rebuild original nodes
    this.track.innerHTML = "";
    this.originalTemplateNodes.forEach((n) =>
      this.track.appendChild(n.cloneNode(true))
    );
    this.originalCount = Array.from(this.track.children).length;

    // re-init
    this._init();
    this.index = savedIndex % this.originalCount;
    this._jumpToIndex(this.index, false);
  }

  _onVisibility() {
    if (document.hidden) this._stopAuto();
    else this._resetAuto();
  }
} // end class
