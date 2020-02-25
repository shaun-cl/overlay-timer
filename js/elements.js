; var Elements = (function (Elements) {
  console.log("Loading elements.js", window.Elements, Elements);

  Elements.makeElementDraggable = function (draggableElement, onDrag) {
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

  function nodeStillInDom(node) {
    var lastChecked;
    while (node.parentNode) 
      node = node.parentNode;
    return node === document;
  } 

  Elements.nodeStillInDom = nodeStillInDom;

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

  Elements.keepElementOnFullScreen = keepElementOnFullScreen;

  return Elements
})(Elements || {});
