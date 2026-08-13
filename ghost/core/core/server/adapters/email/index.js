// adapter-manager is TypeScript as of v6.57.1 and exports the singleton as a
// default export, so the interop wrapper has to be unwrapped here.
const adapterManager = require('../../services/adapter-manager').default;

/**
 * Get an email adapter instance
 *
 * @param {string} [feature] - Optional feature name for feature-specific adapter (e.g., 'transactional', 'bulk')
 * @returns {Object} Email adapter instance
 */
function getEmailAdapter(feature) {
    let adapterName = 'email';

    if (feature) {
        adapterName += `:${feature}`;
    }

    return adapterManager.getAdapter(adapterName);
}

module.exports = {
    getEmailAdapter
};
