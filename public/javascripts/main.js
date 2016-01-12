var itemCount = 0;
var background;
var canvas;

var draw, drag;
var path;

var hitOptions = {
  segments: true,
  stroke: true,
  fill: true,
  tolerance: 5
};

function streamYoutube(emit, id) {
  var videoId = id || $('#videoId').val();
  var $player = $('#player');
  $player.attr('src', 'stream/' + videoId);
  $player.trigger('play');
  if (emit) {
    socket.emit('play', videoId);
  }
}

function clearAll() {
  background = null;
  canvas.clear().renderAll();
}

function fitToCanvas(obj) {
  var factor = Math.min(canvas.getWidth()/obj.getWidth(), canvas.getHeight()/obj.getHeight());

  if (factor < 1) {
    obj.centeredScaling = true;
    obj.setScaleX(factor);
    obj.setScaleY(factor);
  }

//  obj.center();
  obj.setCoords();

  canvas.renderAll();
}

function updateBackground(obj) {
  if (obj) {
    if (background) {
      background.remove();
    }

    background = obj;
  } else if (background) {
    obj = background;
  } else {
    return;
  }

  obj.selectable = false;

  obj.setHeight(window.innerHeight);
  obj.setWidth(window.innerWidth);
  obj.center();
  obj.sendToBack();

  canvas.renderAll();
}

function resizeCanvas() {
  canvas.setHeight(window.innerHeight);
  canvas.setWidth(window.innerWidth);
  canvas.renderAll();
  updateBackground();
}

function setDrawingMode(enabled) {
  canvas.isDrawingMode = enabled;
}

function insertSprite() {
  var $row = $('#images').find('input:checked').parents('tr');
  var filename = $row.find('div').html();

  fabric.Image.fromURL('uploads/' + filename, function(oImg) {
    var background = $('#background').is(':checked');

    if (background) {
      oImg.set('background', true);
    }

    canvas.add(oImg);

    if(background) {
      updateBackground(oImg);
    } else {
      fitToCanvas(oImg);
    }
  });

  itemCount++;

  $('#spriteModal').modal('hide');
}

socket.on('files', function(data) {
  $('#images').html('');

  $.each(data, function(i, file) {
    $('#images').append(
      $('<tr>').append(
        $('<td>').append($('<img>').attr('src', 'uploads/' + file).attr('class', 'preview'))
      ).append(
        $('<td>').append($('<div>').html(file))
      ).append(
        $('<td>').append($('<input>').attr({'type': 'checkbox', 'id': 'checkbox' + i}))
      )
    );
  });

  var $inputs = $('#images').find('input');
  $inputs.on('click', function(e) {
    var id = $(e.target).attr('id');

    $inputs.map(function(i, obj) {
      var $obj = $(obj);

      if (id != $obj.attr('id')) {
        $obj.removeAttr('checked');
      }
    });
  });
});

$(function() {
  canvas = new fabric.Canvas('mainCanvas');
  window.addEventListener('resize', resizeCanvas, false);

  canvas.on('object:added', onObjectAdded);
  canvas.on('object:removed', onObjectRemoved);
  canvas.on('object:modified', onObjectModified);

  // resize on init
  resizeCanvas();

  $('#uploadForm').submit(function(e) {
    $(this).ajaxSubmit({
      error: function(xhr) {
        $('#message').html('Error: ' + xhr.status);
      },
      success: function(response) {
        $('#message').html(response);
        socket.emit('ls');
      }
    });

    return false;
  });

  $('#spriteModal').on('shown.bs.modal', function() {
    socket.emit('ls');
  });

  $('#drawColor').change(function() {
    canvas.freeDrawingBrush.color = this.value;
  });

  $('#draggable').draggable();

  $(document).keyup(function(e) {
    if (e.keyCode == 46 || e.keyCode == 8) {
      if (e.which === 8 && !$(e.target).is("input, textarea")) {
        e.preventDefault();
      }

      if(canvas.getActiveGroup()) {
        canvas.getActiveGroup().forEachObject(function(o){ canvas.remove(o) });
        canvas.discardActiveGroup().renderAll();
      } else {
        canvas.remove(canvas.getActiveObject());
      }
    }

    return false;
  });

  $('#clear').on('click', function(e) {
    socket.emit('clear');
  });
});
