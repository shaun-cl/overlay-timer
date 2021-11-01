(function (global) {
  console.log("Timer loaded");
  var timerClassName = 'overlayTimer';

  var ClockDiv = (function () {
    function makeNode(className, x, y) {
      var hostNode = document.createElement("div");
      var clockDivHtml = mustache(`<div class="{{className}}" 
                                        style="position: fixed; left: {{x}}px;top: {{y}}px; z-index: 2147483647
                                               font-size: 130%; font-weight: bold; 
                                               border-style: solid; border-width: 2px; border-color: black;
                                               background-color: white; padding: 10px">
                                     <div class="countDown" style="display: inline-block; width: 6.7em">
                                       <div style="display: inline-block; width: 0.5em"><span class="past"></span></div>
                                       <div style="display: inline-block"><span class="hours"></span></div> :
                                       <div style="display: inline-block"><span class="minutes"></span></div> :
                                       <div style="display: inline-block"><span class="seconds"></span></div>
                                     </div>
                                     <div class="controls" style="display: inline-block;">
                                       <div style="display: inline-block" class="timerRepeat">&#128257;</div>DELSPACE 
                                       <div style="display: inline-block" class="timerPause">&#9208;</div>DELSPACE 
                                       <div style="display: inline-block" class="timerCancel">&#10060;</div>DELSPACE 
                                       <div style="display: inline-block" data-expando-target="timerExtraControls" class="timerExpandoControls expando">
                                         <div style="display: inline-block" class="expand">&#x1F53C;</div>DELSPACE 
                                         <div style="display: inline-block" class="contract">&#x1F53D;</div>DELSPACE 
                                       </div>
                                     </div>
                                     <div style="clear: right" class="timerExtraControls expandoTarget">
                                       <div style="display: inline-block" class="timerBell">&#x1F514;</div>DELSPACE
                                       <input type="range" id="timerVolume" value="100" min="0" max="100">
                                     </div>
                                   </div>`, {className: className, x: x, y: y}).replace(/DELSPACE\s*/g, '');

      hostNode.innerHTML = clockDivHtml;
      var clockNode = hostNode.firstChild;

      // Technically higher than the max signed positive integer but seems to work somehow
      clockNode.style.zIndex = '2147483647';
      return clockNode;
    }

    function insertNode(node, parentNode, className, onDrag) {
      // Delete any other clocks in this parent
      deleteChildClocks(parentNode, className);

      // Add the clock to the parent 
      parentNode.appendChild(node);

      // Make clock draggable and prevent it getting hidden going to full screen 
      Elements.makeElementDraggable(node, onDrag);
      Elements.keepElementOnFullScreen(node);
    }

    function deleteChildClocks(parentNode, className) {
      Array.from(parentNode.children)
        .filter(n => n.classList.contains(timerClassName))
        .forEach(n => { n.parentNode.removeChild(n); if (n.dataset.timerId) clearInterval(n.dataset.timerId); });
    }

    function initializeClockTimer(clockDivObj, onExpired, triggerSecondsBoundary, onSecondsBoundary) {
      var node = clockDivObj.node;

      var timerId;
      var lastRemaining;

      clockDivObj.resetEndTime();

      function updateClock() {
        if (!Elements.nodeStillInDom(node)) {
          clearInterval(timerId);
          delete node.dataset.timerId;
          return;
        }

        if (node.dataset.timerPauseRemaining) 
          return;

        var t = clockDivObj.updateClock();

        if (t.total <= 0 && lastRemaining.total > 0) {
          console.log('Timer expired', t.total, lastRemaining.total, node.dataset.timerId);
          if (onExpired)
            onExpired();
        }

        if (triggerSecondsBoundary) {
          if ((t.totalSecs % triggerSecondsBoundary) == 0 && 
              (lastRemaining && lastRemaining.totalSecs % triggerSecondsBoundary) != 0)
            onSecondsBoundary(t);
        }

        lastRemaining = t;
      }

      updateClock();
      timerId = setInterval(updateClock, 1000);
      node.dataset.timerId = timerId;
    }

    Class.prototype.pauseToggle = function () {
      if (this.node.dataset.timerPauseRemaining) {
        this.node.dataset.endtime = new Date(Date.parse(new Date()) + parseInt(this.node.dataset.timerPauseRemaining));
        delete this.node.dataset.timerPauseRemaining;
      } else { 
        var t = this.getTimeRemaining();
        this.node.dataset.timerPauseRemaining = t.total;
      }
    }

    Class.prototype.resetEndTime = function () {
      this.node.dataset.endtime = new Date(Date.parse(new Date()) + this.timerLengthMinutes * 60 * 1000);
    }

    Class.prototype.updateClock = function () {
      var pastSpan = this.node.querySelector('.past');
      var daysSpan = this.node.querySelector('.days');
      var hoursSpan = this.node.querySelector('.hours');
      var minutesSpan = this.node.querySelector('.minutes');
      var secondsSpan = this.node.querySelector('.seconds');

      var t = this.getTimeRemaining();

      if (t.past) 
        this.node.style.color = 'red';
      else
        this.node.style.color = "";
      if (daysSpan) daysSpan.innerHTML = t.days;
      if (pastSpan) pastSpan.innerHTML = t.past ? '-' : '';
      hoursSpan.innerHTML = ('0' + t.hours).slice(-2);
      minutesSpan.innerHTML = ('0' + t.minutes).slice(-2);
      secondsSpan.innerHTML = ('0' + t.seconds).slice(-2);

      return t;
    }

    Class.prototype.getTimeRemaining = function () {
      var endtime = this.node.dataset.endtime;
      var t = Date.parse(endtime) - Date.parse(new Date());
      var past = t < 0;
      var s = past ? t * -1 : t;
      var seconds = Math.floor((s / 1000) % 60);
      var minutes = Math.floor((s / 1000 / 60) % 60);
      var hours = Math.floor((s / (1000 * 60 * 60)) % 24);
      var days = Math.floor(s / (1000 * 60 * 60 * 24));
      return {
        'totalSecs': Math.floor(t / 1000),
        'total': t,
        'past': past,
        'days': days,
        'hours': hours,
        'minutes': minutes,
        'seconds': seconds
      };
    }

    /* Constructor */
    function Class(parentNode, options = {}) {
      var className = options.className || 'overlayTimer';

      var node = makeNode(className, options.x, options.y);
      this.node = node;
      this.timerLengthMinutes = options.timerLengthMinutes;

      node.querySelectorAll(".expando").forEach(target => {
        // Hide expando target 
        var expandoTarget = node.querySelector("." + target.dataset.expandoTarget);
        var contractButton = target.querySelector(".contract");
        var expandButton = target.querySelector(".expand");

        function setOpenState(bool) {
          expandoTarget.style.display = bool ? "" : "none";
          contractButton.style.display = bool ? "" : "none";
          expandButton.style.display = bool ? "none" : "";
        }

        setOpenState(false);

        target.querySelector(".contract").addEventListener("click", () => setOpenState(false));
        target.querySelector(".expand").addEventListener("click", () => setOpenState(true));
      });

      insertNode(node, parentNode, this.ClassName, options.onDrag);

      node.querySelector('.timerCancel').addEventListener("click", evt => {
        var clock = evt.target.parentNode.parentNode;
        if (clock.dataset.timerId)
          clearInterval(clock.dataset.timerId);
        clock.parentNode.removeChild(clock);
      });

      // Prevent the volume slider dragging the timer
      node.querySelector('#timerVolume').addEventListener("mousedown", evt => evt.stopPropagation());
      node.querySelector('#timerVolume').value = options.volumePcnt || 100;

      // Call out for volume change if desired
      if (options.onVolumeChange) 
        node.querySelector('#timerVolume').addEventListener("change", options.onVolumeChange);

      var getVolumePcnt = () => node.querySelector('#timerVolume').value;

      node.querySelector('.timerBell').addEventListener("click", () => Audio.playBeep(getVolumePcnt()));
      node.querySelector('.timerRepeat').addEventListener("click", evt => this.resetEndTime());
      node.querySelector('.timerPause').addEventListener("click", evt => this.pauseToggle());

      var onExpiry = () => Audio.playRandomSound(options.minPlayForSecs, options.maxPlayForSecs, options.usePlayfulSounds, getVolumePcnt());
      var onSecondsBoundary = () => Audio.playBeep(getVolumePcnt());

      initializeClockTimer(this, onExpiry, options.triggerSecondsBoundary, onSecondsBoundary);
    }

    return Class;
  })();

  function getLastXY() {
    return new Promise(resolve => chrome.storage.local.get(['lastX', 'lastY'], resolve));
  }

  function startTimer(timerLengthMinutes = 15, volumePcnt) {
    Promise.all([getLastXY(), Options.getSettings()]).then(([lastXY, options]) => {
      lastXY = Object.assign({lastX: 800, lastY: 10}, lastXY);
      console.log("Start timer", timerLengthMinutes, lastXY, options);

      var x = Math.min(lastXY.lastX, window.innerWidth - 200);
      var y = Math.min(lastXY.lastY, 10);

      var savePositionOnDrag = (x,y) => chrome.storage.local.set({'lastX': x, 'lastY': y});
      var saveVolumeOnChange = evt => chrome.storage.local.set({'lastVolumePcnt': evt.target.value});

      var clockDiv = new ClockDiv(document.body,  
                                  {timerLengthMinutes: timerLengthMinutes, 
                                   usePlayfulSounds: options.usePlayfulSounds,
                                   minPlayForSecs: options.minPlayForSecs,
                                   maxPlayForSecs: options.maxPlayForSecs,
                                   volumePcnt: volumePcnt,
                                   triggerSecondsBoundary: options.usePeriodicBeeps && options.periodicBeepSeconds,
                                   x: x, y: y, 
                                   onVolumeChange: saveVolumeOnChange,
                                   onDrag: savePositionOnDrag  });
    });
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Message received", request);
    if (request.command == 'ping') 
      sendResponse({'message': 'pong'});
    else if (request.command == 'start') {
      console.log("Starting timer", request);
      startTimer(request.length, request.volumePcnt);
      sendResponse({'message': 'started'});
    }
  });

  global.ClockDiv = ClockDiv;
  global.startTimer = startTimer;
})(window);
