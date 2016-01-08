var socket = io.connect();

paper.install(window);

var draw, drag;
var path;

var hitOptions = {
  segments: true,
  stroke: true,
  fill: true,
  tolerance: 5
};

socket.on('files', function(data) {
  console.log(data);
});

$(function() {
  $('#uploadForm').on('submit', function(e) {
    e.preventDefault();
    $.ajax({
      url: $(this).attr('action'),
      type: 'POST',
      data: $(this).serialize(),
      beforeSend: function() {
        $('#message').html('Sending File...');
      },
      success: function(data) {
        $('#message').html(data);
      }
    });
  });
});

$(function() {
  paper.setup('mainCanvas');

  var chicago = new Raster('chicago');
  chicago.fitBounds(view.bounds);
  chicago.position = view.center;

  var marth = new Raster('marth');
  marth.position = view.center;

  draw = new Tool();

  draw.onMouseDown = function(event) {
    var color = $('#drawColor').val();

    path = new Path({
      segments: [event.point],
      strokeColor: color
    });
  }

  draw.onMouseDrag = function(event) {
    path.add(event.point);
  }

  draw.onMouseUp = function(event) {
    path.simplify(10);
  }

  drag = new Tool();

  drag.onMouseDown = function(event) {
    var hitResult = project.hitTest(event.point, hitOptions);

    if (!hitResult) {
      return;
    } else if (event.modifiers.shift) {
      hitResult.item.remove();
      return;
    }

    path = hitResult.item;

    if (path == chicago) {
      path = null;
      return;
    }

    project.activeLayer.addChild(hitResult.item);
  }

  drag.onMouseMove = function(event) {
    project.activeLayer.selected = false;

    if (event.item) {
      event.item.selected = true;
    }
  }

  drag.onMouseDrag = function(event) {
    path.position = path.position.add(event.delta);
  }
});
