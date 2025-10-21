document.addEventListener("DOMContentLoaded", function () {
  // Initialize general functionality
  if (typeof initGeneral === "function") {
    initGeneral();
  }

  // Scroll animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, observerOptions);

  // Observe all fade-in elements
  const fadeElements = document.querySelectorAll(".fade-in");
  fadeElements.forEach((element) => {
    observer.observe(element);
  });

  // Observe text-animate elements
  const textElements = document.querySelectorAll(".text-animate");
  textElements.forEach((element) => {
    observer.observe(element);
  });

  // Initialize carousel for destinations
  const destinations = new CircularCarousel({
    wrapperId: "destinationsWrapper",
    trackId: "destinationsTrack",
    dotsId: "destinationsDots",
    autoMs: 6000,
  });
});

/*
        CircularCarousel class (clean and robust)
        - clones visibleCount items on both ends for infinite feel
        - computes card widths so visualCount fits exactly
        - supports dots, auto-slide, mouse drag, touch swipe
      */
class CircularCarousel {
  constructor({ wrapperId, trackId, dotsId, autoMs = 6000 }) {
    this.wrapper = document.getElementById(wrapperId);
    this.track = document.getElementById(trackId);
    this.dotsWrap = document.getElementById(dotsId);
    this.autoMs = autoMs;

    this.gap =
      parseInt(
        getComputedStyle(document.documentElement).getPropertyValue("--gap")
      ) || 20;
    this.visualCount = this._readVisualCount();
    this.originalNodes = Array.from(this.track.children);
    this.originalCount = this.originalNodes.length;

    this.index = 0; // logical index of leftmost visible original item (0..originalCount-1)
    this.cloneCount = 0;
    this.cardWidth = 0;
    this.moveIncrement = 0;

    // drag state
    this.isDragging = false;
    this.startX = 0;
    this.prevTranslate = 0;
    this.dragThreshold = 60;

    // timers
    this.autoTimer = null;

    // bind handlers
    this._onTransitionEnd = this._onTransitionEnd.bind(this);
    this._onResize = this._onResize.bind(this);
    this._onVisibility = this._onVisibility.bind(this);

    this._init();
  }

  _readVisualCount() {
    const val = getComputedStyle(this.wrapper).getPropertyValue(
      "--visual-count"
    );
    const n = parseInt(val);
    return n && n > 0 ? n : 1;
  }

  _init() {
    // ensure track contains original nodes (clone-free)
    this.track.innerHTML = "";
    this.originalNodes.forEach((node) =>
      this.track.appendChild(node.cloneNode(true))
    );

    // refresh references
    this.originalNodes = Array.from(this.track.children);
    this.originalCount = this.originalNodes.length;

    // compute visual count and clone count
    this.visualCount = this._readVisualCount();
    this.cloneCount = this.visualCount;

    // create clones
    this._createClones();

    // set items array including clones
    this.items = Array.from(this.track.children);

    // build dots
    this._buildDots();

    // layout (compute widths)
    this._layout();

    // initial jump to logical index (after clones)
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

  _createClones() {
    const originals = Array.from(this.track.children).slice(
      this.cloneCount,
      this.cloneCount + this.originalCount
    );
    // Note: track currently contains only originals, so we use originalNodes
    // Append clones of first cloneCount to end
    for (let i = 0; i < this.cloneCount; i++) {
      const clone = this.originalNodes[i].cloneNode(true);
      clone.setAttribute("data-clone", "end-" + i);
      this.track.appendChild(clone);
    }
    // Prepend clones of last cloneCount to start
    for (let i = 0; i < this.cloneCount; i++) {
      const clone =
        this.originalNodes[this.originalCount - 1 - i].cloneNode(true);
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
    // compute widths so exactly visualCount cards fit inside wrapper
    this.visualCount = this._readVisualCount();
    const wrapperW = this.wrapper.clientWidth;
    const totalGaps = (this.visualCount - 1) * this.gap;
    const cardW = (wrapperW - totalGaps) / this.visualCount;
    this.cardWidth = Math.floor(cardW);
    // apply flex-basis to all items (including clones)
    Array.from(this.track.children).forEach((node) => {
      node.style.flex = `0 0 ${this.cardWidth}px`;
    });
    this.moveIncrement = this.cardWidth + this.gap;
    // ensure track has no transition while layout
    this.track.style.transition = "none";
    // reposition
    this._jumpToIndex(this.index, false);
    // clear transition none next frame
    requestAnimationFrame(() => {
      this.track.style.transition = "";
    });
  }

  _enableDragTouch() {
    // mouse drag
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

    // prevent image dragging glitch
    this.track.addEventListener("dragstart", (e) => e.preventDefault());
  }

  _setTranslate(x) {
    this.track.style.transform = `translateX(${x}px)`;
  }

  _moveToIndex(i) {
    this.track.style.transition = "transform 0.6s cubic-bezier(.22,.9,.35,1)";
    const x = -(i + this.cloneCount) * this.moveIncrement;
    this._setTranslate(x);
    this._updateDots(i);
  }

  _jumpToIndex(i, withTransition = false) {
    if (!withTransition) this.track.style.transition = "none";
    const x = -(i + this.cloneCount) * this.moveIncrement;
    this._setTranslate(x);
    this._updateDots(i);
    if (!withTransition)
      requestAnimationFrame(() => {
        this.track.style.transition = "";
      });
  }

  _onTransitionEnd() {
    // detect if we are in clones zone and jump to correct real index without transition
    const transformX = this._currentTransform();
    const alignedIdx = Math.round(-transformX / this.moveIncrement); // index among items including clones
    const firstRealIdx = this.cloneCount;
    const lastRealIdxStart = firstRealIdx + this.originalCount - 1;

    if (alignedIdx > lastRealIdxStart) {
      // moved beyond last real (in appended clones) -> wrap to corresponding real
      const offset = alignedIdx - (firstRealIdx + this.originalCount);
      this.index = offset % this.originalCount;
      this._jumpToIndex(this.index, false);
    } else if (alignedIdx < firstRealIdx) {
      // moved before first real (in prepended clones) -> wrap forward
      const offset = alignedIdx - firstRealIdx + this.originalCount;
      this.index = offset % this.originalCount;
      this._jumpToIndex(this.index, false);
    } else {
      // normal: set logical index
      this.index = (alignedIdx - firstRealIdx) % this.originalCount;
      this._updateDots(this.index);
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
    // Save logical index, re-init layout (clones depend on visualCount)
    const savedIndex = this.index;
    // clear listeners
    this.track.removeEventListener("transitionend", this._onTransitionEnd);
    window.removeEventListener("resize", this._onResize);

    // rebuild track with original nodes (no clones)
    const originals = this.originalNodes.map((n) => n.cloneNode(true));
    this.track.innerHTML = "";
    originals.forEach((n) => this.track.appendChild(n));
    this.originalNodes = Array.from(this.track.children);
    this.originalCount = this.originalNodes.length;
    // re-init fully
    this._init();
    // restore index safely
    this.index = savedIndex % this.originalCount;
    this._jumpToIndex(this.index, false);
  }

  _onVisibility() {
    if (document.hidden) this._stopAuto();
    else this._resetAuto();
  }
} /* end CircularCarousel */
