const videoElement = document.querySelector('video');
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const videoSelectButton = document.getElementById('selector');

const { desktopCapturer, remote } = require('electron');
const { writeFile } = require('fs');
const { dialog, Menu } = remote;

const recordedChunks = [];
let mediaRecorder;

startButton.onclick = (e) => {
  mediaRecorder.start();
  startButton.classList.add('on');
  startButton.innerText = 'Recording...';
};

stopButton.onclick = (e) => {
  mediaRecorder.stop();
  startButton.classList.remove('on');
  startButton.innerText = 'Start';
};

videoSelectButton.onclick = getVideoSources;

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


async function selectSource(source) {
  videoSelectButton.innerHTML = source.name;
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

  // Record media from stream
  const options = { mimeType: 'video/webm; codecs=vp9' }
  mediaRecorder = new MediaRecorder(stream, options);

  // Event handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
}

function handleDataAvailable(e) {
  console.log('video data available');
  recordedChunks.push(e.data);
}

async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: 'video/webm; codecs=vp9'
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: 'Save video',
    defaultPath: `video-${Date.now()}.webm`
  });

  console.log(filePath);
  writeFile(filePath, buffer, () => {
    console.log('Video saved!');
  });

}