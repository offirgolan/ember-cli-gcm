this.addEventListener('install', function(event) {});

this.addEventListener('activate', function(event) {});

this.addEventListener('fetch', function(event) {});

self.addEventListener('notificationclick', function(event) {
  // Make sure to close the notification (android doesnt seem to do this)
  event.notification.close();

  // This looks to see if the current is already open and
  // focuses if it is
  event.waitUntil(
    clients.matchAll({
      type: "window"
    })
    .then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url == '/' && 'focus' in client)
          return client.focus();
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
this.addEventListener('push', function(event) {
  var title = 'Ember CLI GCM';
  var body = 'Thank you for using this addon!';
  var icon = 'assets/images/ember-cli-gcm.png';
  var tag = 'ember-cli-gcm';

  event.waitUntil(
    this.registration.showNotification(title, {
      body: body,
      icon: icon,
      tag: tag
    })
  );
});