window.onload = function() {
  // cache DOM elements
  var autoheight = document.getElementById('autoheight');
  var calculate = document.getElementById('calculate');
  var endtime = document.getElementById('endtime');
  var sizeLabel = document.getElementById('sizeLabel');
  var filepicker = document.getElementById('filepicker');
  var fps = document.getElementById('fps');
  var gizmo = document.getElementById('gizmo');
  var outheight = document.getElementById('outheight');
  var outwidth = document.getElementById('outwidth');
  var slider = document.getElementById('slider');
  var slit = document.getElementById('slit');
  var start = document.getElementById('start');
  var starttime = document.getElementById('starttime');
  var video = document.getElementById('video');
  var url = window.URL || window.webkitURL;

  // global variables
  var canvases = [];
  var column = 0;
  var contexts = [];
  var pos = slider.value;
  var started = false;

  // cached loop variables
  var ft, st, et, h, w, w_, vwvp;

  updateGizmo();
  updateSize();

  autoheight.onchange = function(e) {
    outheight.disabled = autoheight.checked;
  };

  calculate.onclick = function(e) {
    // calculate output image width from frame rate
    if (fps.value) {
      outwidth.value = Math.ceil((parseInt(endtime.value) - parseInt(starttime.value)) * parseFloat(fps.value));
      outwidth.onchange();
    } else {
      alert('Please enter the frame rate (FPS) of the video!');
    }
  };

  filepicker.onchange = function(e) {
    // load new video file
    var file = filepicker.files[0];
    if (video.canPlayType(file.type)) {
      video.src = url.createObjectURL(file);
    } else {
      alert("Sorry, the file type " + file.type + " cannot be played in your browser.");
    }
  };

  outwidth.onchange = function(e) {
    // override output image width
    updateSize();
  };

  slider.onmousemove = function(e) {
    // override slit position
    pos = slider.value;
    updateGizmo();
  };

  slit.onmousemove = function(e) {
    // set slit width (in input)
    slitLabel.textContent = slit.value;
    updateGizmo();
    updateSize();
  };

  start.onclick = function(e) {
    // disable options
    autoheight.disabled = fps.disabled = outheight.disabled = outwidth.disabled = start.disabled = true;
    // initialize contexts
    canvases = [];
    contexts = [];
    for (i = 0; i < slit.value; i++) {
      canvases[i] = document.createElement("canvas");
      canvases[i].width = parseInt(outwidth.value);
      if (autoheight.checked) {
        canvases[i].height = video.videoHeight;
      } else {
        canvases[i].height = parseInt(outheight.value);
      }
      contexts[i] = canvases[i].getContext('2d');
      contexts[i].fillStyle = "rgba(0, 0, 0, 0)";
      contexts[i].fillRect(0, 0, canvases[i].width, canvases[i].height);
    }
    // cache loop variables
    ft = 1 / parseFloat(fps.value);
    st = parseFloat(starttime.value);
    et = parseFloat(endtime.value);
    etst_ = 1 / (et - st);
    h = canvases[0].height;
    w = canvases[0].width;
    w_ = 1 / w;
    vwvp = (video.videoWidth - slit.value) * pos;
    // start drawing
    started = true;
    video.currentTime = st;
  };

  video.onloadeddata = function(e) {
    // initialize from video properties
    autoheight.disabled = false;
    slit.setAttribute("max", video.videoWidth);
    endtime.value = video.duration;
    starttime.value = 0;
    column = 0;
    updateGizmo();
    updateSize();
  };

  video.onpaused = function(e) {
    // re-enable options
    autoheight.disabled = fps.disabled = outwidth.disabled = start.disabled = false;
    outheight.disabled = autoheight.checked;
  };

  video.onseeked = function(e) {
    if (started) {
      // render slit-scan frame
      console.log("rendering " + video.currentTime);
      var p = (video.currentTime - st) * etst_;
      while (p >= (column + 0.5) * w_) {
        for (i = 0; i < canvases.length; i++) {
          contexts[i].drawImage(video, vwvp + i, 0, 1, video.videoHeight, column, 0, 1, h);
        }
        column++;
      }
      // proceed to next frame or finish
      if (column < w) {
        video.currentTime += ft;
      }
      else {
        console.log("done");
        video.pause();
        column = 0;
        started = false;
        video.currentTime = 0;
        saveFrames();
      }
    }
  }

  window.onresize = function(e) {
    // handle window resizing
    updateGizmo();
  };

  function saveFrames() {
    var link = document.createElement("a");
    for (i = 0; i < canvases.length; i++) {
      link.download = "frame" + ("0000" + i).slice(-4) + ".png";
      link.href = canvases[i].toDataURL();
      link.click();
    }
  }

  function updateGizmo() {
    // update slit gizmo position
    var gizmoWidth = Math.max(1, slit.value * (video.offsetWidth / video.videoWidth));
    gizmo.style.left = ((video.offsetWidth - gizmoWidth) * pos) + 'px';
    gizmo.style.height = video.offsetHeight + 'px';
    gizmo.style.width = gizmoWidth + 'px';
  }

  function updateSize() {
    // estimate image data size
    var s = slit.value * parseInt(outwidth.value) * 4;
    if (autoheight.checked) {
      s = s * video.videoHeight;
    } else {
      s = s * parseInt(outheight.value);
    }
    sizeLabel.textContent = (s / 1024 / 1024).toFixed(2);
  }
}
