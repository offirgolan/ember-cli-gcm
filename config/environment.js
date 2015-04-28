'use strict';

module.exports = function( /* environment, appConfig */ ) {
    return {
        gcmNotificationDefaults: {
            injectionFactories: ['route', 'controller', 'view', 'component']
        }
    };
};
