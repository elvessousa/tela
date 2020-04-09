const videoElement = document.querySelector('video');
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const screenElement = document.getElementById('screen');
const statusBar = document.getElementById('status');
const videoSelectButton = document.getElementById('selector');

const { desktopCapturer, remote } = require('electron');
const { writeFile } = require('fs');
const { dialog, Menu } = remote;

// ----------------------------------------------------
// Global data
// ----------------------------------------------------
const recordedChunks = [];
let mediaRecorder;

// ----------------------------------------------------
// Buttons
// ----------------------------------------------------
startButton.onclick = (e) => {
  mediaRecorder.start();
  startButton.classList.add('hidden');
  stopButton.classList.remove('hidden');
  stopButton.classList.remove('hidden');
  statusBar.classList.remove('hidden');
  videoSelectButton.disabled = true;
};

stopButton.onclick = (e) => {
  mediaRecorder.stop();
  startButton.classList.remove('hidden');
  stopButton.classList.remove('hidden');
  statusBar.classList.add('hidden');
  videoSelectButton.disabled = false;
};

videoSelectButton.onclick = getVideoSources;

// ----------------------------------------------------
// Get available desktop windows
// ----------------------------------------------------
async function  getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ['window', 'screen']
  })

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map(source => {
      return {
        label: source.name,
        click: () => selectSource(source)
      }
    })
  );

  videoOptionsMenu.popup();
}

// ----------------------------------------------------
// Select a window from the list
// ----------------------------------------------------
async function selectSource(source) {
  screenElement.dataset.label = source.name;
  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.id
      }
    }
  };

  // Create stream
  const stream = await navigator.mediaDevices
    .getUserMedia(constraints);

  // Stream on video element
  videoElement.srcObject = stream;
  videoElement.play();
  startButton.classList.remove('hidden');

  // Record media from stream
  const options = { mimeType: 'video/webm; codecs=vp9' }
  mediaRecorder = new MediaRecorder(stream, options);

  // Event handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
}

// ----------------------------------------------------
// Push data to recorded chunks
// ----------------------------------------------------
function handleDataAvailable(e) {
  console.log('video data available');
  recordedChunks.push(e.data);
}

// ----------------------------------------------------
// Generate buffer and save file
// ----------------------------------------------------
async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: 'video/webm; codecs=vp9'
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: 'Save video',
    defaultPath: `video-${Date.now()}.webm`
  });

  stopButton.classList.add('hidden');
  startButton.classList.remove('hidden');

  console.log(filePath);
  writeFile(filePath, buffer, () => {
    console.log('Video saved!');
  });

}