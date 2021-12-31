
// Create initial document then fire callback
function createDoc(callback) {
    var connection = backend.connect();
    var doc = connection.get("examples", "counter");
    doc.fetch(function (err) {
      if (err) throw err;
      if (doc.type === null) {
        doc.create({ numClicks: 0 }, callback);
        return;
      }
      callback();
    });
  }