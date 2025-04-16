const assert = require('assert').strict;
const sinon = require('sinon');
const EmailAnalyticsProviderPostmark = require('../lib/EmailAnalyticsProviderPostmark');

describe('EmailAnalyticsProviderPostmark', function () {
    let config, client, provider;

    beforeEach(function () {
        config = {
            get: sinon.stub().returns(undefined)
        };
        client = {
            getMessageOpens: sinon.stub(),
            getInstance: sinon.stub().returns(client),
            fetchEvents: sinon.stub()
        };
        provider = new EmailAnalyticsProviderPostmark({client, config});
    });

    afterEach(function () {
        sinon.restore();
    });


    describe('fetchLatest', function () {
        const LATEST_TIMESTAMP = new Date('2025-01-01T12:00:00Z');
        const END_EXAMPLE = new Date('2025-01-01T14:00:00Z');

        it('fetches events from Postmark', async function () {
            const events = [{
                Type: 'Delivery',
                ReceivedAt: '2025-01-01T12:00:00Z',
                Recipient: 'test@example.com',

                MessageID: 'msg123'
            }];

            client.fetchEvents.callsFake(async (options, handler) => {
                await handler(events);
                return events;
            });

            const batchHandler = sinon.stub().resolves();
            await provider.fetchLatest(batchHandler, {begin: LATEST_TIMESTAMP});

            assert(client.fetchEvents.calledOnce);
            const options = client.fetchEvents.firstCall.args[0];
            assert.equal(options.limit, 300);
            assert.equal(options.event, 'delivered OR opened OR failed OR unsubscribed OR complained');

            assert.equal(options.begin, String(Math.floor(LATEST_TIMESTAMP.getTime() / 1000)));
            assert.equal(options.ascending, 'yes');

            assert(batchHandler.calledOnce);
            assert.deepEqual(batchHandler.firstCall.args[0], events);
        });

        it('handles pagination', async function () {
            const events1 = [{
                Type: 'Delivery',
                ReceivedAt: '2025-01-01T12:00:00Z',
                Recipient: 'test1@example.com',

                MessageID: 'msg1'
            }];
            const events2 = [{
                Type: 'Delivery',
                ReceivedAt: '2025-01-01T13:00:00Z',
                Recipient: 'test2@example.com',

                MessageID: 'msg2'
            }];

            client.fetchEvents.callsFake(async (options, handler) => {
                await handler(events1);
                await handler(events2);
                return events2;
            });

            const batchHandler = sinon.stub().resolves();
            await provider.fetchLatest(batchHandler, {begin: LATEST_TIMESTAMP});

            assert(client.fetchEvents.calledOnce);
            const options = client.fetchEvents.firstCall.args[0];
            assert.equal(options.limit, 300);
            assert.equal(options.event, 'delivered OR opened OR failed OR unsubscribed OR complained');

            assert.equal(options.begin, String(Math.floor(LATEST_TIMESTAMP.getTime() / 1000)));
            assert.equal(options.ascending, 'yes');
        });

        it('handles end timestamp', async function () {
            const events = [{
                Type: 'Delivery',
                ReceivedAt: '2025-01-01T12:00:00Z',
                Recipient: 'test@example.com',

                MessageID: 'msg123'
            }];

            client.fetchEvents.callsFake(async (options, handler) => {
                await handler(events);
                return events;
            });

            const batchHandler = sinon.stub().resolves();
            await provider.fetchLatest(batchHandler, {begin: LATEST_TIMESTAMP, end: END_EXAMPLE});

            const options = client.fetchEvents.firstCall.args[0];
            assert.equal(options.end, String(Math.floor(END_EXAMPLE.getTime() / 1000)));
        });

        it('stops fetching when maxEvents is reached', async function () {
            const events = [{
                Type: 'Delivery',
                ReceivedAt: '2025-01-01T12:00:00Z',
                Recipient: 'test@example.com',

                MessageID: 'msg123'
            }];

            client.fetchEvents.callsFake(async (options, handler) => {
                await handler(events);
                return events;
            });

            const batchHandler = sinon.stub().resolves();
            await provider.fetchLatest(batchHandler, {begin: LATEST_TIMESTAMP, maxEvents: 1});

            assert.equal(client.fetchEvents.callCount, 1);
            const options = client.fetchEvents.firstCall.args[0];
            assert.equal(options.limit, 300);
            assert.equal(options.event, 'delivered OR opened OR failed OR unsubscribed OR complained');

            assert.equal(options.begin, String(Math.floor(LATEST_TIMESTAMP.getTime() / 1000)));
            assert.equal(options.ascending, 'yes');
        });
    });
});
