import Ember from 'ember';

const {
    computed,
    getWithDefault,
    merge,
    get: get,
        set: set,
        A: emberArray,
        keys: objectKeys,
        on
} = Ember;

export default Ember.Service.extend(Ember.TargetActionSupport, {

    // Actions

    _registerServiceWorker: on('init', function() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js').then(this._initializeState.bind(this));
        } else {
            console.warn('Service workers aren\'t supported in this browser.');
        }
    }),

    // _unregister: on('willDestroy', function() {
    //     this.unsubscribe();
    // }),

    _initializeState: function() {
        var self = this;

        // Are Notifications supported in the service worker?
        if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
            console.warn('Notifications aren\'t supported.');
            return;
        }

        // Check the current Notification permission.
        // If its denied, it's a permanent block until the
        // user changes the permission
        if (Notification.permission === 'denied') {
            console.warn('The user has blocked notifications.');
            return;
        }

        // Check if push messaging is supported
        if (!('PushManager' in window)) {
            console.warn('Push messaging isn\'t supported.');
            return;
        }


        // We need the service worker registration to check for a subscription
        navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
            // Do we already have a push message subscription?
            serviceWorkerRegistration.pushManager.getSubscription()
                .then(function(subscription) {
                    // TODO: send action
                    // self.send('on-initilize-success', subscription);

                })
                .catch(function(err) {
                    // TODO: send action
                    console.warn('Error during getSubscription()', err);
                });
        });
    },

    subscribe: function() {
        navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
            serviceWorkerRegistration.pushManager.subscribe()
                .then(function(subscription) {
                    // The subscription was successful


                    // TODO: Send the subscription.subscriptionId and
                    // subscription.endpoint to your server
                    // and save it to send a push message at a later date
                    //return sendSubscriptionToServer(subscription);
                    //
                    // TODO: send action
                    return;
                })
                .catch(function(e) {
                    if (Notification.permission === 'denied') {
                        // The user denied the notification permission which
                        // means we failed to subscribe and the user will need
                        // to manually change the notification permission to
                        // subscribe to push messages
                        console.warn('Permission for Notifications was denied');
                    } else {
                        // A problem occurred with the subscription; common reasons
                        // include network errors, and lacking gcm_sender_id and/or
                        // gcm_user_visible_only in the manifest.
                        console.error('Unable to subscribe to push.', e);
                    }
                });
        });
    },

    unsubscribe: function() {
        navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
            // To unsubscribe from push messaging, you need get the
            // subscription object, which you can call unsubscribe() on.
            serviceWorkerRegistration.pushManager.getSubscription().then(
                function(pushSubscription) {
                    // Check we have a subscription to unsubscribe
                    if (!pushSubscription) {
                        // No subscription object, so set the state
                        // to allow the user to subscribe to push
                        return;
                    }

                    var subscriptionId = pushSubscription.subscriptionId;
                    // TODO: Make a request to your server to remove
                    // the subscriptionId from your data store so you
                    // don't attempt to send them push messages anymore

                    // We have a subscription, so call unsubscribe on it
                    pushSubscription.unsubscribe().then(function(successful) {
                        //Do something
                    }).catch(function(e) {
                        // We failed to unsubscribe, this can lead to
                        // an unusual state, so may be best to remove
                        // the users data from your data store and
                        // inform the user that you have done so

                        console.log('Unsubscription error: ', e);
                    });
                }).catch(function(e) {
                console.error('Error thrown while unsubscribing from push messaging.', e);
            });
        });
    }

});
