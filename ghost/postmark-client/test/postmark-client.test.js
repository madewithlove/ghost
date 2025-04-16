const assert = require('assert');
const sinon = require('sinon');
const {ServerClient} = require('postmark');
const PostmarkClient = require('../lib/PostmarkClient');

describe('PostmarkClient', function () {
    let config, settings, client;

    beforeEach(function () {
        config = {
            get: sinon.stub()
        };
        settings = {
            get: sinon.stub()
        };
        client = new PostmarkClient({config, settings});
    });

    afterEach(function () {
        sinon.restore();
    });

    describe('Configuration', function () {
        it('uses config values when available', function () {
            config.get.withArgs('bulkEmail').returns({
                postmark: {
                    apiToken: 'config-token',
                    streamId: 'config-stream'
                }
            });

            const instance = client.getInstance();
            assert(instance instanceof ServerClient);
        });

        it('falls back to settings when config not available', function () {
            config.get.withArgs('bulkEmail').returns({});
            settings.get.withArgs('postmark_api_token').returns('settings-token');
            settings.get.withArgs('postmark_stream_id').returns('settings-stream');

            const instance = client.getInstance();
            assert(instance instanceof ServerClient);
        });

        it('uses default stream ID when not configured', function () {
            config.get.withArgs('bulkEmail').returns({
                postmark: {
                    apiToken: 'token'
                }
            });

            const instance = client.getInstance();
            assert(instance instanceof ServerClient);
        });

        it('returns null when not configured', function () {
            config.get.withArgs('bulkEmail').returns({});
            settings.get.withArgs('postmark_api_token').returns(null);

            const instance = client.getInstance();
            assert.equal(instance, null);
        });
    });

    describe('Email Sending', function () {
        let postmarkInstance;

        beforeEach(function () {
            config.get.withArgs('bulkEmail').returns({
                postmark: {
                    apiToken: 'test-token',
                    streamId: 'broadcast'
                }
            });
            postmarkInstance = {
                sendEmailBatch: sinon.stub().resolves([{ErrorCode: 0}])
            };
            sinon.stub(client, 'getInstance').returns(postmarkInstance);
        });

        it('sends email with correct data', async function () {
            const message = {
                subject: 'Test Subject',
                html: 'Test <b>HTML</b>',
                plaintext: 'Test Text',
                from: 'from@example.com',
                replyTo: 'reply@example.com',
                id: '123',
                track_opens: true
            };

            const recipientData = {
                'test@example.com': {
                    name: 'Test User',
                    unsubscribe_url: 'https://example.com/unsub',
                    list_unsubscribe: 'https://example.com/unsub'
                }
            };

            await client.send(message, recipientData);

            const [emailMessages] = postmarkInstance.sendEmailBatch.firstCall.args;
            assert.equal(emailMessages.length, 1);
            assert.equal(emailMessages[0].To, 'test@example.com');
            assert.equal(emailMessages[0].From, 'from@example.com');
            assert.equal(emailMessages[0].ReplyTo, 'reply@example.com');
            assert.equal(emailMessages[0].Subject, 'Test Subject');
            assert.equal(emailMessages[0].HtmlBody, 'Test <b>HTML</b>');
            assert.equal(emailMessages[0].TextBody, 'Test Text');
            assert.equal(emailMessages[0].TrackOpens, true);
            assert.equal(emailMessages[0].MessageStream, 'broadcast');
            assert.equal(emailMessages[0].Tag, 'ghost-email|123');
            assert.deepEqual(emailMessages[0].Metadata, {'email-id': '123'});
        });

        it('replaces recipient variables', async function () {
            const message = {
                subject: 'Hello %recipient.name%',
                html: 'Click here: %recipient.unsubscribe_url%',
                plaintext: 'Click here: %recipient.unsubscribe_url%',
                from: 'from@example.com'
            };

            const recipientData = {
                'test@example.com': {
                    name: 'John',
                    unsubscribe_url: 'https://example.com/unsub'
                }
            };

            await client.send(message, recipientData);

            const [emailMessages] = postmarkInstance.sendEmailBatch.firstCall.args;
            assert.equal(emailMessages[0].Subject, 'Hello John');
            assert.equal(emailMessages[0].HtmlBody, 'Click here: https://example.com/unsub');
            assert.equal(emailMessages[0].TextBody, 'Click here: https://example.com/unsub');
        });

        it('handles batch size limits', async function () {
            const recipientData = {};
            for (let i = 0; i < 501; i++) {
                recipientData[`test${i}@example.com`] = {};
            }

            await assert.rejects(() => client.send({}, recipientData), {
                name: 'IncorrectUsageError',
                message: 'Postmark only supports sending to 500 recipients at a time'
            });
        });
    });

    describe('Analytics Provider', function () {
        beforeEach(function () {
            sinon.stub(client, 'getInstance').returns({});
        });

        it('returns a Postmark analytics provider', function () {
            const provider = client.getAnalyticsProvider();
            assert.equal(provider.constructor.name, 'EmailAnalyticsProviderPostmark');
        });
    });
});
