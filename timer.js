(function (global) {
  console.log("Timer loaded");
  var timerClassName = 'overlayTimer';

  var ClockDiv = (function () {
    function makeNode(className, x, y) {
      var hostNode = document.createElement("div");
      clockDivHtml  = '<div class="' + className + '" ' +
                            'style="position: fixed; left: ' + x + 'px; top: ' + y + 'px; z-index: 2147483647 ' +
                                   'font-size: 130%; font-weight: bold; ' + 
                                   'border-style: solid; border-width: 2px; border-color: black; ' + 
                                   'background-color: white; padding: 10px">';
      clockDivHtml += '<div style="display: inline-block; width: 6.5em">' + 
                      '<div style="display: inline-block; width: 0.5em"><span class="past"></span></div>' +
                      '<div style="display: inline-block"><span class="hours"></span></div> : ' + 
                      '<div style="display: inline-block"><span class="minutes"></span></div> : ' + 
                      '<div style="display: inline-block"><span class="seconds"></span></div>' + 
                      '</div> ' + 
                      '<div style="display: inline-block" class="timerRepeat">&#128257;</div>' + 
                      '<div style="display: inline-block" class="timerCancel">&#10060;</div>';
      clockDivHtml += '</div>'

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

    function initializeClockTimer(clockDivObj, onExpired) {
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

        var t = clockDivObj.updateClock();

        if (t.total <= 0 && lastRemaining.total > 0) {
          console.log('Timer expired', t.total, lastRemaining.total, node.dataset.timerId);
          if (onExpired)
            onExpired();
        }
        lastRemaining = t;
      }

      updateClock();
      timerId = setInterval(updateClock, 1000);
      node.dataset.timerId = timerId;
    }

    function Class(parentNode, options) {
      options = options || {};

      var className = options.className || 'overlayTimer';

      var node = makeNode(className, options.x, options.y);
      this.node = node;
      this.timerLengthMinutes = options.minutes;

      insertNode(node, parentNode, this.ClassName, options.onDrag);

      node.querySelector('.timerCancel').addEventListener("click", evt => {
        var clock = evt.target.parentNode;
        if (clock.dataset.timerId)
          clearInterval(clock.dataset.timerId);
        clock.parentNode.removeChild(clock);
      });

      node.querySelector('.timerRepeat').addEventListener("click", evt => {
        this.resetEndTime();
      });

      initializeClockTimer(this, function () { playRandomSound() });
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
        'total': t,
        'past': past,
        'days': days,
        'hours': hours,
        'minutes': minutes,
        'seconds': seconds
      };
    }

    return Class;
  })();

  function startTimer(startTimerMinutes) {
    chrome.storage.local.get(['lastX', 'lastY'], results => {
      console.log("Start timer", startTimerMinutes, results);

      var timerLengthMinutes = startTimerMinutes || 15;

      var x = Math.min(results.lastX === undefined ? 800 : results.lastX, window.innerWidth - 50);
      var y = Math.min(results.lastY === undefined ? 10 : results.lastY, window.innerHeight - 50);

      var clockDiv = new ClockDiv(document.body,  
                                  {minutes: timerLengthMinutes, 
                                   x: x, y: y, 
                                   onDrag: (x,y) => chrome.storage.local.set({'lastX': x, 'lastY': y}) });
    });
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Message received", request);
    if (request.command == 'ping') 
      sendResponse({'message': 'pong'});
    else if (request.command == 'start') {
      console.log("Starting timer");
      startTimer(request.length);
      sendResponse({'message': 'started'});
    }
  });

  global.ClockDiv = ClockDiv;
})(window);
