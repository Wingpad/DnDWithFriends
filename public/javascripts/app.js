var socket = io.connect();

paper.install(window);

var draw, drag;
var path;
var itemCount = 0;

var hitOptions = {
  segments: true,
  stroke: true,
  fill: true,
  tolerance: 5
};

function insertSprite() {
  var $row = $('#images').find('input:checked').parents('tr');
  var filename = $row.find('div').html();

  $('body').append(
    $('<img>').attr({
      'src': 'uploads/' + filename,
      'id': filename + itemCount,
      'style': 'display: none'
    })
  );

  var sprite = new Raster(filename + itemCount);
  sprite.position = view.center;

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
    } else if ((path = hitResult.item) == chicago) {
      path = null;
    } else if (event.modifiers.shift) {
      path.remove();
    } else {
      project.activeLayer.addChild(path);
    }
  }

  drag.onMouseMove = function(event) {
    project.activeLayer.selected = false;

    if (event.item) {
      event.item.selected = true;
    }
  }

  drag.onMouseDrag = function(event) {
    if (path) {
      path.position = path.position.add(event.delta);
    }
  }
});
