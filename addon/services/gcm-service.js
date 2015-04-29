import Ember from 'ember';

const {
    computed,
    get: get,
    set: set,
    isNone: isNone
} = Ember;

export default Ember.Service.extend(Ember.TargetActionSupport, {
    serviceWorker: null,
    isRegistered: computed('_serviceWorkerRegistration', function() {
        return !isNone(get(this, '_serviceWorkerRegistration'));
    }).readOnly(),

    // Private
    _serviceWorkerRegistration: null,
    _serviceWorkerAvailable: computed(function() {
        return 'serviceWorker' in navigator;
    }).readOnly(),

    // Private
    _registerServiceWorker: function() {
        if (get(this, '_serviceWorkerAvailable')) {
            return navigator.serviceWorker.register('service-worker.js').then(this._initializeState.bind(this));
        } else {
            return new Promise(function(resolve, reject) {
                reject('Service workers aren\'t supported in this browser.');
            });
        }
    },


    _initializeState: function(serviceWorkerRegistration) {
        var self = this;
        set(this, '_serviceWorkerRegistration', serviceWorkerRegistration);
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

    // Public
    subscribe: function() {
        if (!get(this, '_serviceWorkerAvailable')) {
            return new Promise(function(resolve, reject) {
                reject('Service workers aren\'t supported in this browser.');
            });
        }

        return get(this, 'serviceWorker').then(function() {
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

        return get(this, 'serviceWorker').then(function() {
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
                        return subscription.unsubscribe().then(function(success) {
                            return {
                                subscription: subscription,
                                success: success
                            };
                        });
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

    register: function() {
        if (!get(this, 'isRegistered')) {
            var serviceWorker = this._registerServiceWorker();
            set(this, 'serviceWorker', serviceWorker);
        }
        return get(this, 'serviceWorker');
    },

    unregister: function() {
        var serviceWorkerRegistration = get(this, '_serviceWorkerRegistration');

        if (!isNone(serviceWorkerRegistration)) {
            return serviceWorkerRegistration.unregister().then(function(success) {
                if (success) {
                    set(this, '_serviceWorkerRegistration', null);
                }

                return success;
            }.bind(this));
        } else {
            return new Promise(function(resolve, reject) {
                reject('No service worker to unregister.');
            });
        }
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
