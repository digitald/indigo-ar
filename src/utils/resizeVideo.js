export function setupResponsiveVideo(videoElement) {
  function resize() {
    const videoAspect = videoElement.videoWidth / videoElement.videoHeight;
    const windowAspect = window.innerWidth / window.innerHeight;

    if (videoAspect > windowAspect) {
      // Video più largo: riempi larghezza, centra verticalmente
      videoElement.style.width = '100vw';
      videoElement.style.height = 'auto';
      videoElement.style.top = '50%';
      videoElement.style.left = '0';
      videoElement.style.transform = 'translateY(-50%) scaleX(-1)';
    } else {
      // Video più alto: riempi altezza, centra orizzontalmente
      videoElement.style.width = 'auto';
      videoElement.style.height = '100vh';
      videoElement.style.left = '50%';
      videoElement.style.top = '0';
      videoElement.style.transform = 'translateX(-50%) scaleX(-1)';
    }

    videoElement.style.position = 'fixed';
    videoElement.style.zIndex = '0';
    videoElement.style.objectFit = 'contain';
    videoElement.style.background = 'black';
  }

  videoElement.addEventListener('loadedmetadata', resize);
  window.addEventListener('resize', resize);
}
