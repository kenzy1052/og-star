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
    transform: navbar.style.transform || "translateY(0)",
    transition: navbar.style.transition || "",
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
    // Always restore the navbar to its original position
    navbar.style.transform = previousNavbarState.transform;
    navbar.style.transition = previousNavbarState.transition;

    // Restore the navbar-visible class if it was originally present
    if (previousNavbarState.isVisible) {
      navbar.classList.add("navbar-visible");
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
