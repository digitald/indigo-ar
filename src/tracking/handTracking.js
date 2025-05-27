let onResultsCallback = () => {};

function subscribeToLandmarks(callback) {
  onResultsCallback = callback;
}

function initHandTracking(videoElement) {
  const canvasElement = document.createElement("canvas");
  canvasElement.id = "hands-canvas";
  canvasElement.style.position = "fixed";
  canvasElement.style.top = "0";
  canvasElement.style.left = "0";
  canvasElement.style.width = "100vw";
  canvasElement.style.height = "100vh";
  canvasElement.style.pointerEvents = "none";
  canvasElement.style.zIndex = "10";
  document.body.appendChild(canvasElement);

  const canvasCtx = canvasElement.getContext("2d");

  canvasElement.width = window.innerWidth;
canvasElement.height = window.innerHeight;

window.addEventListener('resize', () => {
  canvasElement.width = window.innerWidth;
  canvasElement.height = window.innerHeight;
});

  const hands = new window.Hands({
                    locateFile: (file) => {
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
                    }
                });
  
  
  /*
  const hands = new Hands.Hands({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });
*/
  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    selfieMode: true,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7,
  });

  hands.onResults((results) => {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const rawLandmarks = results.multiHandLandmarks[0];
     const mirroredLandmarks = rawLandmarks.map(({ x, y, z }) => ({
  x, y, z
    }));

      drawConnectors(canvasCtx, rawLandmarks, HAND_CONNECTIONS, { color: "#33CC00", lineWidth: 2 }); // width era 4
      drawLandmarks(canvasCtx, rawLandmarks, { color: "#CC1100", lineWidth: 1 }); // width era 2

      onResultsCallback(mirroredLandmarks);
    }

    canvasCtx.restore();
  });

  // Video capture and frame loop
  navigator.mediaDevices
    .getUserMedia({
  video: {
    facingMode: "user",
    width: { ideal: 1280 },
    height: { ideal: 720 },
  }
})
    .then((stream) => {
      videoElement.srcObject = stream;
      videoElement.onloadedmetadata = () => {
        videoElement.play();
        requestAnimationFrame(processFrame);
      };

      const processFrame = async () => {
        await hands.send({ image: videoElement });
        requestAnimationFrame(processFrame);
      };
    });
}
