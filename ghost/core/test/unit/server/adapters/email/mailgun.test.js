const Mailgun = require('../../../../../core/server/adapters/email/Mailgun');
const EmailProviderBase = require('../../../../../core/server/adapters/email/EmailProviderBase');
const MailgunEmailProvider = require('../../../../../core/server/services/email-service/mailgun-email-provider');
const EmailAnalyticsProviderMailgun = require('../../../../../core/server/services/email-analytics/email-analytics-provider-mailgun');
const MailgunClient = require('../../../../../core/server/services/lib/mailgun-client');
const sinon = require('sinon');
const assert = require('node:assert/strict');

/**
 * The adapter holds its providers in native #private fields, so a test cannot
 * reach in and swap them. Stub the provider prototypes instead: the adapter
 * still constructs the real classes, and delegation is observed where it
 * actually happens.
 */
describe('Mailgun Adapter', function () {
    let send;
    let getMaximumRecipients;
    let getTargetDeliveryWindow;
    let fetchLatest;

    const buildAdapter = (overrides = {}) => new Mailgun({
        configService: {get: sinon.stub()},
        settingsCache: {get: sinon.stub()},
        labs: {isSet: sinon.stub()},
        ...overrides
    });

    beforeEach(function () {
        send = sinon.stub(MailgunEmailProvider.prototype, 'send').resolves({id: 'msg-123'});
        getMaximumRecipients = sinon.stub(MailgunEmailProvider.prototype, 'getMaximumRecipients').returns(1000);
        getTargetDeliveryWindow = sinon.stub(MailgunEmailProvider.prototype, 'getTargetDeliveryWindow').returns(3600000);
        fetchLatest = sinon.stub(EmailAnalyticsProviderMailgun.prototype, 'fetchLatest').resolves();
    });

    afterEach(function () {
        sinon.restore();
    });

    it('extends EmailProviderBase', function () {
        assert.ok(buildAdapter() instanceof EmailProviderBase);
    });

    it('delegates send to MailgunEmailProvider', async function () {
        const adapter = buildAdapter({errorHandler: () => {}});

        const data = {
            subject: 'Test',
            html: '<html><body>Test</body></html>',
            recipients: [{email: 'test@example.com', replacements: []}],
            replacementDefinitions: []
        };
        const options = {openTrackingEnabled: true};

        const result = await adapter.send(data, options);

        assert.ok(send.calledOnce);
        assert.ok(send.calledWith(data, options));
        assert.deepEqual(result, {id: 'msg-123'});
    });

    it('delegates getMaximumRecipients to MailgunEmailProvider', function () {
        const result = buildAdapter().getMaximumRecipients();

        assert.ok(getMaximumRecipients.calledOnce);
        assert.equal(result, 1000);
    });

    it('delegates getTargetDeliveryWindow to MailgunEmailProvider', function () {
        const result = buildAdapter().getTargetDeliveryWindow();

        assert.ok(getTargetDeliveryWindow.calledOnce);
        assert.equal(result, 3600000);
    });

    it('delegates fetchLatest to EmailAnalyticsProviderMailgun', async function () {
        const adapter = buildAdapter();

        const batchHandler = sinon.stub();
        const options = {
            maxEvents: 100,
            begin: new Date('2024-01-01'),
            end: new Date('2024-01-31')
        };

        await adapter.fetchLatest(batchHandler, options);

        assert.ok(fetchLatest.calledOnce);
        assert.ok(fetchLatest.calledWith(batchHandler, options));
    });

    it('passes the analytics provider its tags, which it no longer derives itself', async function () {
        // The provider stopped building its own DEFAULT_TAGS in v6.57.1 and now
        // expects the caller to supply them. An adapter that does not leaves
        // this.tags undefined, and the next fetch throws on .join(). Exercise the
        // real fetchLatest against a stubbed client so that regression is caught.
        fetchLatest.restore();
        const fetchEvents = sinon.stub(MailgunClient.prototype, 'fetchEvents').resolves([]);

        await buildAdapter().fetchLatest(sinon.stub(), {
            begin: new Date('2024-01-01'),
            end: new Date('2024-01-31')
        });

        assert.ok(fetchEvents.calledOnce);
        assert.equal(fetchEvents.firstCall.args[0].tags, 'bulk-email');
    });

    it('creates providers with correct dependencies', function () {
        const adapter = buildAdapter({errorHandler: sinon.stub()});

        assert.ok(adapter);
        assert.ok(adapter instanceof EmailProviderBase);
    });
});
