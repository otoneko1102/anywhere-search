document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("img").forEach((img) => {
    img.addEventListener("click", (event) => {
      if (img.classList.contains('logo')) return;

      if (document.getElementById("image-overlay")) {
        document.getElementById("image-overlay").remove();
        return;
      }

      const overlay = document.createElement("div");
      overlay.id = "image-overlay";
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100vw";
      overlay.style.height = "100vh";
      overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
      overlay.style.display = "flex";
      overlay.style.justifyContent = "center";
      overlay.style.alignItems = "center";
      overlay.style.zIndex = "9999";
      overlay.style.cursor = "pointer";

      const enlargedImg = document.createElement("img");
      enlargedImg.src = event.target.src;
      enlargedImg.style.maxWidth = "90vw";
      enlargedImg.style.maxHeight = "90vh";
      enlargedImg.style.borderRadius = "10px";
      enlargedImg.style.boxShadow = "0 0 10px rgba(255, 255, 255, 0.5)";

      overlay.addEventListener("click", () => {
        overlay.remove();
      });

      overlay.appendChild(enlargedImg);
      document.body.appendChild(overlay);
    });
  });
});
