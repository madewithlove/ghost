import {StorageBase} from 'ghost-storage-base';
import {SchedulingBase} from '@tryghost/adapter-base-scheduling';
import {SSOBase} from '@tryghost/adapter-base-sso';
import {CacheBase} from '@tryghost/adapter-base-cache';
import {RedirectsStoreBase} from '@tryghost/adapter-base-redirects';
import {RouteSettingsStoreBase} from '@tryghost/adapter-base-route-settings';

import type {BaseClassMap} from './adapter-manager';
import type {AdapterConstructor} from './types';

// The email adapter base is still plain JavaScript, and allowJs is off for
// ghost/core, so it is required rather than imported. Converting it to
// TypeScript is the tidier end state and belongs with the upstream PR
// (TryGhost/Ghost#28247), not with a version sync.
const EmailProviderBase = require('../../adapters/email/EmailProviderBase') as AdapterConstructor;

/**
 * The base class every adapter of a given type must extend. Also read by
 * bin/validate-adapters.js, which checks adapter implementations at build time -
 * keep this the only place the mapping is declared.
 */
export const baseClasses = {
    storage: StorageBase,
    scheduling: SchedulingBase,
    sso: SSOBase,
    cache: CacheBase,
    redirects: RedirectsStoreBase,
    'route-settings': RouteSettingsStoreBase,
    email: EmailProviderBase
} satisfies BaseClassMap;
