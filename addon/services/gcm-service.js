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
    initializer: null,

    init: function() {
        this._registerServiceWorker();
        this._super.apply(this, arguments);
    },

    reInitialize: function() {
        this._registerServiceWorker();
        return get(this, 'initializer');
    },

    _serviceWorkerAvailable: computed(function() {
        return 'serviceWorker' in navigator;
    }).readOnly(),

    _registerServiceWorker: function() {
        var promise = null;
        if (get(this, '_serviceWorkerAvailable')) {
            promise = navigator.serviceWorker.register('service-worker.js').then(this._initializeState.bind(this));
        } else {
            promise = new Promise(function(resolve, reject) {
                reject('Service workers aren\'t supported in this browser.');
            });
        }

        set(this, 'initializer', promise);
    },


    _initializeState: function() {
        // Are Notifications supported in the service worker?
        if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
            return new Promise(function(resolve, reject) {
                reject('Notifications aren\'t supported.');
            });
        }

        // Check the current Notification permission.
        // If its denied, it's a permanent block until the
        // user changes the permission
        if (Notification.permission === 'denied') {
            return new Promise(function(resolve, reject) {
                reject('The user has blocked notifications.');
            });
        }

        // Check if push messaging is supported
        if (!('PushManager' in window)) {
            return new Promise(function(resolve, reject) {
                reject('Push messaging isn\'t supported.');
            });
        }

        // We need the service worker registration to check for a subscription
        return navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
            // Do we already have a push message subscription?
            return serviceWorkerRegistration.pushManager.getSubscription();
        });
    },

    subscribe: function() {
        if (!get(this, '_serviceWorkerAvailable')) {
            return new Promise(function(resolve, reject) {
                reject('Service workers aren\'t supported in this browser.');
            });
        }

        return Ember.get(this, 'initializer').then(function() {
            return navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
                return serviceWorkerRegistration.pushManager.subscribe();
            });
        });
    },

    unsubscribe: function() {
        if (!get(this, '_serviceWorkerAvailable')) {
            return new Promise(function(resolve, reject) {
                reject('Service workers aren\'t supported in this browser.');
            });
        }

        return Ember.get(this, 'initializer').then(function() {
            return navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
                // To unsubscribe from push messaging, you need get the
                // subscription object, which you can call unsubscribe() on.
                return serviceWorkerRegistration.pushManager.getSubscription()
                    .then(function(subscription) {
                        // Check we have a subscription to unsubscribe
                        if (!subscription) {
                            // No subscription object, so set the state
                            // to allow the user to subscribe to push
                            return new Promise(function(resolve, reject) {
                                reject('No subscription found.');
                            });
                        }

                        // TODO: Make a request to your server to remove
                        // the subscriptionId from your data store so you
                        // don't attempt to send them push messages anymore

                        // We have a subscription, so call unsubscribe on it
                        return subscription.unsubscribe();
                        // .catch(function(e) {
                        //     // We failed to unsubscribe, this can lead to
                        //     // an unusual state, so may be best to remove
                        //     // the users data from your data store and
                        //     // inform the user that you have done so

                        //     console.log('Unsubscription error: ', e);
                        // });
                    });
            });
        });
    },

    requestPermission: function() {
        if (Notification) {
            return new Promise(function(resolve, reject) {
                Notification.requestPermission(function(status) {
                    if (status !== 'granted') {
                        reject(status);
                    }
                    resolve(status);
                });
            });
        } else {
            return new Promise(function(resolve, reject) {
                reject('Notifications aren\'t supported.');
            });
        }
    },

    push: function(title = '', options = {}) {
        return this.requestPermission().then(function() {
            return new Notification(title, options);
        });
    }

});
