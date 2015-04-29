import Ember from 'ember';

const {
    computed,
    get: get,
    set: set,
    isNone: isNone
} = Ember;

export default Ember.Controller.extend({
    notificationsEnabled: false,
    subscription: null,

    isSubscribed: computed('subscription', function() {
        return !isNone(get(this, 'subscription'));
    }).readOnly(),

    init: function() {
        this._super.apply(this, arguments);

        var self = this;

        get(this, 'gcmNotifications').register().then(function(subscription) {
            if (isNone(subscription)) {
                self.subscribe();
                return;
            }

            // TODO: Send the subscription.subscriptionId and
            // subscription.endpoint to your server
            // and save it to send a push message at a later date
            // return sendSubscriptionToServer(subscription);
            set(self, 'subscription', subscription);
            set(self, 'notificationsEnabled', true);
            return;

        }, function(message) {
            set(self, 'notificationsEnabled', false);
            console.warn(message);
        });
    },

    onToggleSwitch: Ember.observer('notificationsEnabled', function() {
        if (get(this, 'notificationsEnabled')) {
            this.send('enable-notifications');
        } else {
            this.send('disable-notifications');
        }
    }),

    subscribe: function() {
        var self = this;
        if (get(this, 'isSubscribed')) {
            return;
        }

        get(this, 'gcmNotifications').subscribe().then(function(subscription) {
            // Subscription was successful
            // TODO: Send the subscription.subscriptionId and
            // subscription.endpoint to your server
            // and save it to send a push message at a later date
            // return sendSubscriptionToServer(subscription);
            set(self, 'subscription', subscription);
            set(self, 'notificationsEnabled', true);
            return;
        }).catch(function(e) {
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
            set(self, 'notificationsEnabled', false);
        });
    },

    actions: {
        'enable-notifications': function() {
            var gcmNotifications = get(this, 'gcmNotifications');
            if (!get(gcmNotifications, 'isRegistered')) {
                gcmNotifications.register();
            }
            this.subscribe();
        },

        'disable-notifications': function() {
            get(this, 'gcmNotifications').unsubscribe().then(function(args) {
                // Subscription was successful
                if (args.success) {
                    set(this, 'subscription', null);
                    get(this, 'gcmNotifications').unregister();
                    set(this, 'notificationsEnabled', false);
                }
            }.bind(this));
        },

        'push-notification': function() {
            var title = 'Ember CLI GCM';
            var body = 'Thank you for using this addon!';
            var icon = 'assets/images/ember-cli-gcm.png';
            var tag = 'ember-cli-gcm';

            get(this, 'gcmNotifications').push(title, {
                body: body,
                icon: icon,
                tag: tag
            }).then(function(notification) {
                notification.onclick = function() {
                    // Do something on click
                };
            }, function(message) {
                console.warn(message);
            });

        }
    }
});
