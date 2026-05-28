/* ===== sound.js — Web Audio API 音效 ===== */
var SoundFX = (function() {
  var ctx = null;
  var enabled = true;

  function getCtx() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    return ctx;
  }

  function playNote(freq, duration, type, vol) {
    if (!enabled) return;
    var c = getCtx();
    if (!c) return;
    type = type || 'sine';
    vol = vol || 0.08;
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = vol;
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  }

  return {
    setEnabled: function(v) { enabled = v; },
    isEnabled: function() { return enabled; },

    move: function() { playNote(600, 0.08, 'sine', 0.05); },
    undo: function() { playNote(400, 0.1, 'triangle', 0.05); },
    hint: function() { playNote(800, 0.15, 'sine', 0.06); playNote(1000, 0.1, 'sine', 0.04); },
    shuffle: function() { for (var i=0;i<3;i++){setTimeout(function(){playNote(300+i*100,0.06,'triangle',0.04);},i*50);} },
    pause: function() { playNote(500, 0.15, 'sine', 0.04); },
    resume: function() { playNote(600, 0.1, 'triangle', 0.05); playNote(800, 0.08, 'sine', 0.04); },
    complete: function() {
      var notes = [523,659,784,1047];
      for (var i=0;i<notes.length;i++) {
        setTimeout(function(f){return function(){playNote(f,0.3,'sine',0.08);};}(notes[i]), i*120);
      }
    },
    badge: function() {
      for (var i=0;i<5;i++) {
        setTimeout(function(f){return function(){playNote(f,0.2,'triangle',0.06);};}(600+i*80), i*80);
      }
    }
  };
})();
