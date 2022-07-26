let miss: HTMLAudioElement | undefined,
  wordComplete: HTMLAudioElement | undefined,
  undo: HTMLAudioElement | undefined;
// this errors on server-side which is fine. it will be defined client side
try {
  miss = new Audio("miss.wav");
  wordComplete = new Audio("word-complete.wav");
  undo = new Audio("undo.wav");
} catch (e) {}

export { miss, wordComplete, undo };
