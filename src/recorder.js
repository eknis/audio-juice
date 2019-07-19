import mediaRecorderPolyfill from "audio-recorder-polyfill";
import { AudioContext, OfflineAudioContext } from "standardized-audio-context";

const audioCtx = new (window.AudioContext || webkitAudioContext || AudioContext)();
const canvasCtx = document.querySelector('.visualizer').getContext("2d");
const constraints = {audio: true};

export default class Recorder {
  constructor() {
    this.record = document.querySelector('.record');
    this.stop = document.querySelector('.stop');
    this.soundClips = document.querySelector('.sound-clips');
    this.canvas = document.querySelector('.visualizer');
    this.visualize = this.visualize.bind(this);
  }

  setup = () => {
    if (!window.MediaRecorder) {
      window.MediaRecorder = mediaRecorderPolyfill;
    }
    navigator.mediaDevices.getUserMedia(constraints).then(this.onSuccess, this.onError);
  }

  onError(err) {
    console.log('The following error occured: ' + err);
  }

  visualize = (stream) => {
  let _this = this;
  const source = audioCtx.createMediaStreamSource(stream);

  let analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  var filter1 = audioCtx.createBiquadFilter();
  filter1.type='lowpass';
  filter1.frequency.value = 600;         
  
  var filter2 = audioCtx.createBiquadFilter();
  filter2.type='highpass';
  filter2.frequency.value = 500;

  // オーディオノードの設定
  source.connect(filter1);
  filter1.connect(filter2);
  filter2.connect(analyser);
  analyser.connect(audioCtx.destination);

  const draw = () => {
    let canvasWidth = _this.canvas.width
    let canvasHeight = _this.canvas.height;

    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, canvasWidth, canvasHeight);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    canvasCtx.beginPath();

    var sliceWidth = canvasWidth * 1.0 / bufferLength;
    var x = 0;


    for(var i = 0; i < bufferLength; i++) {
 
      var v = dataArray[i] / 128.0;
      var y = v * canvasHeight/2;

      if(i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(_this.canvas.width, _this.canvas.height/2);
    canvasCtx.stroke();

  }
  draw()
}

  onSuccess = (stream) => {
    let _this = this;
    const mediaRecorder = new MediaRecorder(stream);
    let chunks = [];

    _this.visualize(stream);

    this.record.onclick = () => {
      mediaRecorder.start();
      this.record.style.background = "red";
      this.stop.disabled = false;
      this.record.disabled = true;
    }

    this.stop.onclick = () => {
      audioCtx.suspend();
      mediaRecorder.stop();
      this.record.style.background = "";
      this.record.style.color = "";
      // mediaRecorder.requestData();

      this.stop.disabled = true;
      this.record.disabled = false;
    }

    mediaRecorder.onstop = (e) => {
      console.log("data available after MediaRecorder.stop() called.");

      var clipName = prompt('Enter a name for your sound clip?','My unnamed clip');
      console.log(clipName);
      var clipContainer = document.createElement('article');
      var clipLabel = document.createElement('p');
      var audio = document.createElement('audio');
      var deleteButton = document.createElement('button');
    
      clipContainer.classList.add('clip');
      audio.setAttribute('controls', '');
      deleteButton.textContent = 'Delete';
      deleteButton.className = 'delete';

      if(clipName === null) {
        clipLabel.textContent = 'My unnamed clip';
      } else {
        clipLabel.textContent = clipName;
      }

      clipContainer.appendChild(audio);
      clipContainer.appendChild(clipLabel);
      clipContainer.appendChild(deleteButton);
      this.soundClips.appendChild(clipContainer);

      audio.controls = true;
      var blob = new Blob(chunks, { 'type' : 'video/mp4; codecs=AAC' });
      chunks = [];
      // ctx.decodeAudioData(compressedBuffer).then(function(decodedData) {
      // });
      var audioURL = window.URL.createObjectURL(blob);
      let fileReader = new FileReader();
      // fileReader.onloadend = () => {
      //   // let arrayBuffer = fileReader.result;
      // }
      fileReader.readAsArrayBuffer(blob);
      audio.src = audioURL;
      audio.duration = 1;

      deleteButton.onclick = function(e) {
        evtTgt = e.target;
        evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
      }

      clipLabel.onclick = function() {
        var existingName = clipLabel.textContent;
        var newClipName = prompt('名前つけて');
        if(newClipName === null) {
          clipLabel.textContent = existingName;
        } else {
          clipLabel.textContent = newClipName;
        }
      }
    }

    mediaRecorder.ondataavailable = function(e) {
      chunks.push(e.data);
    }

    window.onresize = () => {
      let _this = this;
      _this.canvas.width = document.querySelector('.main-controls').offsetWidth;
    }
  }
}