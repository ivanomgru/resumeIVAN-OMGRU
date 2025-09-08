document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("loading-screen");
  const mainContent = document.getElementById("main-content");
  const loadingVideo = document.getElementById("loading-video");

  if (mainContent) mainContent.style.display = "none";

  function fadeOutLoader() {
    if (!loader) return;
    loader.classList.add("hide");
    setTimeout(() => {
      loader.style.display = "none";
      if (mainContent) mainContent.style.display = "block";
    }, 2000);
  }

  function checkImagesLoaded() {
    const imgs = document.images;
    if (!imgs || imgs.length === 0) return 1;
    let loadedCount = 0;
    for (let img of imgs) if (img.complete) loadedCount++;
    return loadedCount / imgs.length;
  }

  function handleLoading() {
    const loadRatio = checkImagesLoaded();
    if (loadRatio >= 0.5) {
      if (loadingVideo) {
        loadingVideo.addEventListener("ended", fadeOutLoader);
      }
      setTimeout(fadeOutLoader, 3000);
    } else {
      setTimeout(handleLoading, 200);
    }
  }

  handleLoading();
});
