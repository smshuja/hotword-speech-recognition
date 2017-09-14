import JsSpeechRecognizer from './JsSpeechRecognizer';

export default class HotwordSpeechRecognition {

  constructor({
    keywordSpottingMinConfidence = 0.5,
    initialTimeout = 5,
    timeout = 1.5,
    lang = 'en-US',
    models = {},
  }) {
    const hwRecognition = new JsSpeechRecognizer();

    hwRecognition.numGroups = 60;
    hwRecognition.groupSize = 5;
    hwRecognition.keywordSpottingMinConfidence = keywordSpottingMinConfidence;
    hwRecognition.keywordSpottedCallback = this._onKeywordSpottedCallback;
    hwRecognition.lang = lang;
    hwRecognition.openMic();

    this.timeoutSecs = timeout;
    this.initialTimeoutSecs = initialTimeout;

    this._stopRecognitionTimeout = null;
    this._recognizing = false;
    this._finalTranscript = '';

    if ('webkitSpeechRecognition' in window) {
      /* global webkitSpeechRecognition */
      /* eslint new-cap: ["error", { "newIsCap": false }] */
      const recognition = new webkitSpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = this._onStart;
      recognition.onresult = this._onResult;
      recognition.onend = this._onEnd;
      this._recognition = recognition;
    }

    this._hwRecognition = hwRecognition;
  }

  isSupported() {
    return ('webkitSpeechRecognition' in window);
  }

  onKeywordSpotted() {
    // overwrite or override
  }

  onPartialResult() {
    // overwrite or override
  }

  onFinalResult() {
    // overwrite or override
  }

  onTrainingStart() {
    // overwrite or override
  }

  onTrainingStop() {
    // overwrite or override
  }

  startTraining(word) {
    if (this._hwRecognition.isRecording()) {
      this._hwRecognition.stopRecording();
    }
    this._hwRecognition.startTrainingRecording(word);
    this.onTrainingStart(word);
  }

  stopTraining() {
    const wordBuffer = this._hwRecognition.wordBuffer;
    const recordingId = this.stop();

    this.onTrainingStop(wordBuffer[wordBuffer.length - 1], recordingId);
    return recordingId;
  }

  playTrainingBuffer(recordingId) {
    return this._hwRecognition.playTrainingBuffer(recordingId);
  }

  deleteTrainingBuffer(recordingId) {
    return this._hwRecognition.deleteTrainingBuffer(recordingId);
  }

  setTrainingData(data) {
    this._hwRecognition.modelBuffer = data.modelBuffer;
    this._hwRecognition.wordBuffer = data.wordBuffer;
  }

  getTrainingData() {
    return {
      modelBuffer: this._hwRecognition.modelBuffer,
      wordBuffer: this._hwRecognition.wordBuffer,
    };
  }

  generateModel() {
    this._hwRecognition.generateModel();
  }

  _onKeywordSpottedCallback = (result) => {
    if (!this._recognizing) {
      this.onKeywordSpotted(result);
      this._recognition.start();
    }
  }

  /* SpeechRecognizer Callbacks */
  _onStart = () => {
    this._recognizing = true;
    this._stopRecognition(this.initialTimeoutSecs);
  }

  _onResult = () => {
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        this._finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    if (interimTranscript.length) {
      this.onPartialResult(interimTranscript);
    }
    this._stopRecognition();
  }

  _onEnd = () => {
    this._recognizing = false;
    this.onFinalResult(this._finalTranscript);
    this._finalTranscript = '';
  }

  /* SpeechRecognizer Callbacks End */

  _stopRecognition(timeout) {
    clearTimeout(this._stopRecognitionTimeout);
    this._stopRecognitionTimeout = setTimeout(() => {
      this._recognition.stop();
    }, (timeout || this.timeoutSecs) * 1000);
  }

  start() {
    if (!this._hwRecognition.isRecording()) {
      this._hwRecognition.startKeywordSpottingRecording();
    }
  }

  stop() {
    if (this._hwRecognition.isRecording()) {
      return this._hwRecognition.stopRecording();
    }
    return -1;
  }

  isRecording() {
    return this._hwRecognition.isRecording();
  }
}
