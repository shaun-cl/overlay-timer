(function () {
  console.log("Timer loaded");
  // The geese mp3 is in the public domain, http://soundbible.com/952-Canadian-Geese.html
  var geeseUrl = chrome.runtime.getURL("geese.mp3");
  var timerClassName = 'overlayTimer';

  function playSound(soundUrl) {
    var newNode = document.createElement("div");
    newNode.id = 'hiddenSoundPlayer';
    newNode.innerHTML = '<audio autoplay hidden> <source src="' + soundUrl + '" type="audio/mpeg"> </audio>';
    var oldNode = document.getElementById(newNode.id);
    if (oldNode)
      oldNode.parentNode.removeChild(oldNode);
    document.body.appendChild(newNode);
  }

  function makeElementDraggable(draggableElement, onDrag) {
    draggableElement.addEventListener("mousedown", e => {
      var startX = e.clientX, startY = e.clientY;

      function mouseMoveListener(e) {
        var offsetX = startX - e.clientX;
        var offsetY = startY - e.clientY;
        startX = e.clientX;
        startY = e.clientY;

        // set the element's new position:
        draggableElement.style.left = (draggableElement.offsetLeft - offsetX) + "px";
        draggableElement.style.top = (draggableElement.offsetTop - offsetY) + "px";
      }

      function mouseUpListener() {
        if (onDrag)
          onDrag(parseInt(draggableElement.style.left), parseInt(draggableElement.style.top));
        document.removeEventListener("mousemove", mouseMoveListener);
        document.removeEventListener("mouseup", mouseUpListener);
      }

      document.addEventListener("mousemove", mouseMoveListener);
      document.addEventListener("mouseup", mouseUpListener);
      e.preventDefault();
    });
  }

  function makeClockOverlayDiv(appendTo, x, y, onDrag) {
    var node = document.createElement("div");
    appendTo = appendTo || document.body;
    node.className = timerClassName;
    node.style.position = 'fixed';
    node.style.fontSize = '130%';
    node.style.fontWeight = 'bold';
    node.style.left = x + 'px'; 
    node.style.top = y + 'px'; 
    node.style.borderStyle = 'solid';
    node.style.borderWidth = '2px';
    node.style.borderColor = 'black';
    node.style.backgroundColor = 'white';
    node.style.padding = '10px';
    node.innerHTML = '<div style="display: inline-block; width: 6.5em">' + 
            '<div style="display: inline-block; width: 0.5em"><span class="past"></span></div>' +
            '<div style="display: inline-block"><span class="hours"></span></div> : ' + 
            '<div style="display: inline-block"><span class="minutes"></span></div> : ' + 
            '<div style="display: inline-block"><span class="seconds"></span></div>' + 
            '</div> ' + 
            '<div style="display: inline-block" class="timerRepeat">&#128257;</div>' + 
            '<div style="display: inline-block" class="timerCancel">&#10060;</div>';

    // Technically higher than the max signed positive integer but seems to work somehow
    node.style.zIndex = '2147483647';

    // Remove old nodes attached to this parent 
    deleteChildClocks(appendTo);

    //document.body.insertBefore(node, document.body.firstChild);
    appendTo.appendChild(node);
    makeElementDraggable(node, onDrag);
    return node;
  }

  function deleteChildClocks(parentNode) {
    Array.from(parentNode.children)
      .filter(n => n.classList.contains(timerClassName))
      .forEach(n => { n.parentNode.removeChild(n); if (n.dataset.timerId) clearInterval(n.dataset.timerId); });
  }

  function nodeStillInDom(node) {
    var lastChecked;
    while (node.parentNode) 
      node = node.parentNode;
    return node === document;
  }

  // Clock code from https://www.sitepoint.com/build-javascript-countdown-timer-no-dependencies/
  function getTimeRemaining(endtime) {
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

  function initializeClock(node, timerLengthMinutes) {
    var clock = node;
    var pastSpan = clock.querySelector('.past');
    var daysSpan = clock.querySelector('.days');
    var hoursSpan = clock.querySelector('.hours');
    var minutesSpan = clock.querySelector('.minutes');
    var secondsSpan = clock.querySelector('.seconds');
    var endtime = new Date(Date.parse(new Date()) + timerLengthMinutes * 60 * 1000);

    var timeinterval;
    var lastRemaining;

    function resetEndTime() {
      node.dataset.endtime = new Date(Date.parse(new Date()) + timerLengthMinutes * 60 * 1000);
    }

    resetEndTime();

    node.querySelector('.timerCancel').addEventListener("click", evt => {
      var clock = evt.target.parentNode;
      if (clock.dataset.timerId)
        clearInterval(clock.dataset.timerId);
      clock.parentNode.removeChild(clock);
    });

    node.querySelector('.timerRepeat').addEventListener("click", evt => {
      resetEndTime();
    });

    function updateClock() {
      var t = getTimeRemaining(node.dataset.endtime);

      if (t.past) clock.style.color = 'red';
      if (daysSpan) daysSpan.innerHTML = t.days;
      if (pastSpan) pastSpan.innerHTML = t.past ? '-' : '';
      hoursSpan.innerHTML = ('0' + t.hours).slice(-2);
      minutesSpan.innerHTML = ('0' + t.minutes).slice(-2);
      secondsSpan.innerHTML = ('0' + t.seconds).slice(-2);

      if (!nodeStillInDom(clock)) {
        clearInterval(timeinterval);
        delete clock.dataset.timerId;
        return;
      }

      if (t.total <= 0 && lastRemaining.total >= 0) {
        playSound(geeseUrl);
      }
      lastRemaining = t;
    }

    updateClock();
    timeinterval = setInterval(updateClock, 1000);
    clock.dataset.timerId = timeinterval;
  }

  function keepElementOnFullScreen(el) {
    var oldFullScreenElement = null;
    var moveEl = el;

    function keepOnScreen(event) {
      if (document.fullscreenElement) {
        console.log("Gone full screen", document.fullscreenElement);
        // Move the element in to the full screen element
        if (nodeStillInDom(moveEl)) {
          moveEl.parentNode.removeChild(moveEl);
          document.fullscreenElement.appendChild(moveEl);
        }
        oldFullScreenElement = document.fullscreenElement;
      } else {
        console.log("Left full screen", document.fullscreenElement);
        document.body.appendChild(moveEl);                
      }
    } 

    if (keepElementOnFullScreen.oldHandler)
      document.removeEventListener("fullscreenchange", keepElementOnFullScreen.oldHandler);
    keepElementOnFullScreen.oldHandler = keepOnScreen;
    document.addEventListener("fullscreenchange", keepOnScreen);
  }

  function startTimer(startTimerMinutes) {
    chrome.storage.local.get(['lastX', 'lastY'], results => {
      var timerLengthMinutes = startTimerMinutes || 15;

      var x = results.lastX === undefined ? 800 : results.lastX;
      var y = results.lastY === undefined ? 10 : results.lastY;

      var clockDiv = makeClockOverlayDiv(document.body, x, y,
                                         (x,y) => { chrome.storage.local.set({'lastX': x, 'lastY': y}) });
      keepElementOnFullScreen(clockDiv);
      initializeClock(clockDiv, timerLengthMinutes);
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
})();

