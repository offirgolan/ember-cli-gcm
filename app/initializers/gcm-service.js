import GCMService from 'ember-cli-gcm/services/gcm-service';
import config from '../config/environment';

export function initialize(_container, application) {
  const { gcmNotificationDefaults } = config;
  const { injectionFactories }   = gcmNotificationDefaults;

  application.register('config:gcm-notifications', gcmNotificationDefaults, { instantiate: false });
  application.register('service:gcm-notifications', GCMService, { singleton: true });
  application.inject('service:gcm-notifications', 'gcmNotificationDefaults', 'config:gcm-notifications');

  injectionFactories.forEach((factory) => {
    application.inject(factory, 'gcmNotifications', 'service:gcm-notifications');
  });
}

export default {
  name       : 'gcm-service',
  initialize : initialize
};