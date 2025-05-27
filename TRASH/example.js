// Inizializza la webcam
        async function setupCamera() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { 
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                });
                
                videoElement.srcObject = stream;
                
                return new Promise((resolve) => {
                    videoElement.onloadedmetadata = () => {
                        outputCanvas.width = videoElement.videoWidth;
                        outputCanvas.height = videoElement.videoHeight;
                        resolve(videoElement);
                    };
                });
            } catch (error) {
                console.error("Errore nella configurazione della webcam:", error);
                statusElement.textContent = "Errore: Impossibile accedere alla webcam";
                loadingElement.textContent = "Errore webcam";
            }
        }

        // Carica la libreria MediaPipe Hands tramite importazione dinamica
        async function loadMediaPipe() {
            const script1 = document.createElement('script');
            script1.src = "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.min.js";
            document.head.appendChild(script1);
            
            return new Promise((resolve) => {
                script1.onload = () => {
                    statusElement.textContent = "Stato: MediaPipe caricato";
                    resolve();
                };
            });
        }

        // Funzione principale
        async function main() {
            statusElement.textContent = "Stato: Caricamento MediaPipe...";
            
            try {
                // Inizializza Three.js
                setupThreeJS();
                
                // Carica MediaPipe
                await loadMediaPipe();
                
                // Attendi un breve periodo per assicurarti che sia disponibile globalmente
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Configura la webcam
                statusElement.textContent = "Stato: Configurazione webcam...";
                await setupCamera();
                
                // Inizializza il modello di rilevamento mani
                statusElement.textContent = "Stato: Inizializzazione modello...";
                
                // Controlla se la classe Hands è disponibile
                if (typeof window.Hands === 'undefined') {
                    throw new Error("MediaPipe Hands non è disponibile. Ricarica la pagina o prova un altro browser.");
                }
                
                const hands = new window.Hands({
                    locateFile: (file) => {
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
                    }
                });
                
                hands.setOptions({
                    maxNumHands: 2,
                    modelComplexity: 1,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });
                
                // Configurazione del callback per i risultati
                hands.onResults((results) => {
                    // Pulisci il canvas 2D
                    ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
                    
                    // Disegna i landmark se sono stati rilevati
                    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                        for (const landmarks of results.multiHandLandmarks) {
                            // Disegna su canvas 2D
                            drawLandmarks(landmarks);
                            drawConnections(landmarks);
                            
                            // Processa per Three.js
                            processHandLandmarks(landmarks);
                            
                            // Aggiorna lo stato con informazioni sulle dita
                            let extendedFingers = [];
                            for (let i = 0; i < 5; i++) {
                                if (isFingerExtended(landmarks, i)) {
                                    const fingerNames = ["Pollice", "Indice", "Medio", "Anulare", "Mignolo"];
                                    extendedFingers.push(fingerNames[i]);
                                }
                            }
                            
                            let statusText = `Mani rilevate: ${results.multiHandLandmarks.length}`;
                            if (isHandOpen(landmarks)) {
                                statusText += " - Palmo aperto (cancellazione)";
                            } else if (extendedFingers.length > 0) {
                                statusText += ` - Dita estese: ${extendedFingers.join(", ")}`;
                            }
                            statusElement.textContent = statusText;
                        }
                    } else {
                        statusElement.textContent = "Stato: Nessuna mano rilevata";
                    }
                });
                
                // Inizializza il modello
                await hands.initialize();
                loadingElement.style.display = "none";
                statusElement.textContent = "Stato: Modello inizializzato";
                
                // Loop di rilevamento
                const detectHands = async () => {
                    if (videoElement.readyState === 4) {
                        await hands.send({image: videoElement});
                    }
                    requestAnimationFrame(detectHands);
                };
                
                detectHands();
                
            } catch (error) {
                console.error("Errore:", error);
                statusElement.textContent = `Errore: ${error.message}`;
                loadingElement.textContent = "Si è verificato un errore";
            }
        }
        
        // Avvia quando la pagina è completamente caricata
        window.addEventListener('load', main);