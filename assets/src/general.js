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
