class MailAdapterBase {
    constructor() {
        Object.defineProperty(this,
            'requiredFns',
            {
                value: [
                    'fetchLatest',
                    '#fetchAnalytics',
                ],
                writable: false
            });
    }
}

module.exports = MailAdapterBase;
