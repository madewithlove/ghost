import React from 'react';
import TopLevelGroup from '../../top-level-group';
import useSettingGroup from '../../../hooks/use-setting-group';
import {IconLabel, Link, Select, SettingGroupContent, TextField, withErrorBoundary} from '@tryghost/admin-x-design-system';
import {getSettingValues, useEditSettings} from '@tryghost/admin-x-framework/api/settings';
import {useHandleError} from '@tryghost/admin-x-framework/hooks';

const BULK_EMAIL_OPTIONS = [
    {label: 'Postmark', value: 'postmark'},
    {label: 'Mailgun', value: 'mailgun'}
];

const MAILGUN_REGIONS = [
    {label: '🇺🇸 US', value: 'https://api.mailgun.net/v3'},
    {label: '🇪🇺 EU', value: 'https://api.eu.mailgun.net/v3'}
];

const BulkEmail: React.FC<{ keywords: string[] }> = ({keywords}) => {
    const {
        localSettings,
        isEditing,
        saveState,
        handleSave,
        handleCancel,
        updateSetting,
        handleEditingChange
    } = useSettingGroup();
    const {mutateAsync: editSettings} = useEditSettings();
    const handleError = useHandleError();

    const [emailProvider, mailgunRegion, mailgunDomain, mailgunApiKey, postmarkApiToken] = getSettingValues(localSettings, [
        'bulk_email_provider', 'mailgun_base_url', 'mailgun_domain', 'mailgun_api_key', 'postmark_api_token'
    ]) as string[];

    const isMailgunSetup = emailProvider === 'mailgun' && mailgunDomain && mailgunApiKey;
    const isPostmarkSetup = emailProvider === 'postmark' && postmarkApiToken;
    const selectedProviderLabel = BULK_EMAIL_OPTIONS.find(option => option.value === emailProvider)?.label || '';

    const data = (isMailgunSetup || isPostmarkSetup) ? [
        {
            key: 'status',
            value: (
                <div className="grid w-full grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
                    <div className="flex flex-col">
                        <h6 className="block text-xs font-semibold tracking-normal dark:text-white">Status</h6>
                        <div className="mt-1 flex items-center">
                            <IconLabel icon='check-circle' iconColorClass='text-green'>
                                The email provider is set up
                            </IconLabel>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <h6 className=" block text-xs font-semibold tracking-normal dark:text-white">Provider</h6>
                        <div className="mt-1 flex items-center">
                            {selectedProviderLabel}
                        </div>
                    </div>
                </div>

            )
        }
    ] : [
        {
            heading: 'Status',
            key: 'status',
            value: 'Email provider is not set up'
        }
    ];

    const values = (
        <SettingGroupContent
            columns={1}
            values={data}
        />
    );

    const MailgunApiKeysHint = (
        <>Find your Mailgun API keys <Link href="https://app.mailgun.com/settings/api_security" rel="noopener noreferrer" target="_blank">here</Link></>
    );

    const MailgunSettings = (
        <SettingGroupContent>
            <div className='mt-6 grid grid-cols-[120px_auto] gap-x-3 gap-y-6'>
                <Select
                    options={MAILGUN_REGIONS}
                    selectedOption={MAILGUN_REGIONS.find(option => option.value === mailgunRegion)}
                    title="Mailgun region"
                    onSelect={(option) => {
                        updateSetting('mailgun_base_url', option?.value || null);
                    }}
                />
                <TextField
                    title='Mailgun domain'
                    value={mailgunDomain}
                    onChange={(e) => {
                        updateSetting('mailgun_domain', e.target.value);
                    }}
                />
                <div className='col-span-2'>
                    <TextField
                        hint={MailgunApiKeysHint}
                        title='Mailgun private API key'
                        type='password'
                        value={mailgunApiKey}
                        onChange={(e) => {
                            updateSetting('mailgun_api_key', e.target.value);
                        }}
                    />
                </div>
            </div>
        </SettingGroupContent>
    );

    const PostmarkApiKeysHint = (
        <>Learn where to find your Postmark API Token <Link href="https://postmarkapp.com/developer/api/overview#authentication" rel="noopener noreferrer" target="_blank">here</Link></>
    );

    const PostmarkSettings = (
        <SettingGroupContent>
            <div className='mt-6 grid grid-cols-[120px_auto] gap-x-3 gap-y-6'>
                <div className='col-span-2'>
                    <TextField
                        hint={PostmarkApiKeysHint}
                        title='Postmark API token'
                        type='password'
                        value={postmarkApiToken}
                        onChange={(e) => {
                            updateSetting('postmark_api_token', e.target.value);
                        }}
                    />
                </div>
            </div>
        </SettingGroupContent>
    );

    const inputs = (
        <SettingGroupContent>
            <div className='grid grid-cols-[120px_auto] gap-x-3 gap-y-6'>
                <div className='col-span-2'>
                    <Select
                        options={BULK_EMAIL_OPTIONS}
                        selectedOption={BULK_EMAIL_OPTIONS.find(option => option.value === emailProvider)}
                        title="Email provider"
                        onSelect={(option) => {
                            updateSetting('bulk_email_provider', option?.value || null);
                        }}
                    />
                    {emailProvider === 'mailgun' && MailgunSettings}
                    {emailProvider === 'postmark' && PostmarkSettings}
                </div>
            </div>
        </SettingGroupContent>
    );

    const groupDescription = (
        <>Define a provider for bulk email newsletter delivery. <Link href='https://ghost.org/docs/faq/mailgun-newsletters/' target='_blank'>Why is this required?</Link></>
    );

    return (
        <TopLevelGroup
            description={groupDescription}
            isEditing={isEditing}
            keywords={keywords}
            navid='bulk-email'
            saveState={saveState}
            testId='bulk-email'
            title='Email provider'
            onCancel={handleCancel}
            onEditingChange={handleEditingChange}
            onSave={async () => {
                // this is a special case where we need to set the region to the default if it's not set,
                // since when the Mailgun Region is not changed, the value doesn't get set in the updateSetting
                // resulting in the mailgun base url remaining null
                // this should not fire if the user has changed the region or if the region is already set
                if (emailProvider === 'mailgun' && !mailgunRegion) {
                    try {
                        await editSettings([{key: 'mailgun_base_url', value: MAILGUN_REGIONS[0].value}]);
                    } catch (e) {
                        handleError(e);
                        return;
                    }
                }
                handleSave();
            }}
        >
            {isEditing ? inputs : values}
        </TopLevelGroup>
    );
};

export default withErrorBoundary(BulkEmail, 'BulkEmail');
