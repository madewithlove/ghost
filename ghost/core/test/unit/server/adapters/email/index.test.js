const emailAdapter = require('../../../../../core/server/adapters/email');
const EmailProviderBase = require('../../../../../core/server/adapters/email/EmailProviderBase');
const assert = require('node:assert/strict');

/**
 * These exercise the real adapter-manager wiring rather than a stub. Unit tests
 * of the adapter classes and a passing tsc build both stayed green while
 * `getEmailAdapter` was broken by adapter-manager becoming an ES default export,
 * and Ghost only failed at boot. This is the cheapest place to catch that.
 */
describe('Email adapter resolution', function () {
    it('resolves the configured adapter through the adapter manager', function () {
        const adapter = emailAdapter.getEmailAdapter();

        assert.ok(adapter, 'an adapter instance is returned');
        assert.ok(adapter instanceof EmailProviderBase, 'it extends the email adapter base class');
    });

    it('exposes the functions the adapter manager validates', function () {
        const adapter = emailAdapter.getEmailAdapter();

        assert.ok(Array.isArray(adapter.requiredFns));
        for (const fn of adapter.requiredFns) {
            assert.equal(typeof adapter[fn], 'function', `${fn} is implemented`);
        }
    });
});
