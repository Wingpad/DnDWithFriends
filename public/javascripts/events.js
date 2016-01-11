var socket     = io.connect();
var objects    = new Map();

function stringify(o) {
  var obj = o.toObject();
  obj.id = o.get('id');
  if (o.get('background')) {
    obj.background = true;
  }
  return JSON.stringify(obj);
}

function enliven(obj) {
  fabric.util.enlivenObjects([obj], function(objs) {
    var obj = objs[0];
    canvas.add(obj);
    objects.set(obj.get('id'), obj);
    // Special treatment for backgrounds
    if (obj.get('background')) {
      updateBackground(obj);
    } else {
      canvas.renderAll();
    }
  });
}

function removeId(id) {
  // cache the object
  var obj = objects.get(id);
  // delete it from the objs
  objects.delete(id);
  // and remove it
  obj.remove();
  if (obj.get('background')) {
    background = null;
  }
}

function onObjectAdded(o) {
  // Grab the target
  var obj = o.target;
  // If the obj does not have an ID
  if (!obj.get('id')) {
    // Generate an ID
    var id  = uuid.v4();
    // If the ID is in the map (very unlikely)
    while (objects.has(id)) {
      // Generate a new ID
      id = uuid.v4();
    }
    // Set the ID within the object
    obj.set('id', id);
    // Add it to the map
    objects.set(id, obj);
    // Send it off
    socket.emit('added', stringify(obj));
  }
}

function onObjectRemoved(o) {
  var obj = o.target;
  var id = obj.get('id');
  // if the object is present
  if (objects.has(id)) {
    // and clear it from the objects
    objects.delete(id);
    // emit that it was removed
    socket.emit('removed', id);
  }
}

function onObjectModified(o) {
  socket.emit('modified', stringify(o.target));
}

socket.on('added', function(json) {
  var obj = JSON.parse(json);
  enliven(obj);
});
socket.on('removed', function(id) {
  removeId(id);
});
socket.on('clear', function(id) {
  clearAll();
});
socket.on('modified', function(json) {
  var obj = JSON.parse(json);
  removeId(obj.id);
  enliven(obj);
});
