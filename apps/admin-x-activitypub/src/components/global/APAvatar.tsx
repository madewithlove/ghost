import NiceModal from '@ebay/nice-modal-react';
import React, {useEffect, useState} from 'react';
import ViewProfileModal from '../modals/ViewProfileModal';
import clsx from 'clsx';
import getUsername from '../../utils/get-username';
import {ActorProperties} from '@tryghost/admin-x-framework/api/activitypub';
import {Icon} from '@tryghost/admin-x-design-system';
import {Skeleton} from '@tryghost/shade';
import {useFeatureFlags} from '@src/lib/feature-flags';
import {useNavigate} from '@tryghost/admin-x-framework';

type AvatarSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'notification';

interface APAvatarProps {
    author: {
        icon: {
            url: string;
        };
        name: string;
        handle?: string;
    } | undefined;
    size?: AvatarSize;
    isLoading?: boolean;
    onClick?: () => void;
    disabled?: boolean;
}

const APAvatar: React.FC<APAvatarProps> = ({author, size, isLoading = false, onClick, disabled = false}) => {
    let iconSize = 18;
    let containerClass = `shrink-0 items-center justify-center rounded-full overflow-hidden relative z-10 flex bg-gray-100 dark:bg-gray-900 ${size === 'lg' || disabled ? '' : 'hover:opacity-80 cursor-pointer'}`;
    let imageClass = 'z-10 object-cover';
    const [iconUrl, setIconUrl] = useState(author?.icon?.url);
    const {isEnabled} = useFeatureFlags();
    const navigate = useNavigate();

    useEffect(() => {
        setIconUrl(author?.icon?.url);
    }, [author?.icon?.url]);

    switch (size) {
    case '2xs':
        iconSize = 10;
        containerClass = clsx('h-4 w-4', containerClass);
        imageClass = clsx('h-4 w-4', imageClass);
        break;
    case 'xs':
        iconSize = 12;
        containerClass = clsx('h-6 w-6', containerClass);
        imageClass = clsx('h-6 w-6', imageClass);
        break;
    case 'notification':
        iconSize = 12;
        containerClass = clsx('h-9 w-9', containerClass);
        imageClass = clsx('h-9 w-9', imageClass);
        break;
    case 'sm':
        containerClass = clsx('h-10 w-10', containerClass);
        imageClass = clsx('h-10 w-10', imageClass);
        break;
    case 'md':
        containerClass = clsx('h-[60px] w-[60px]', containerClass);
        imageClass = clsx('h-[60px] w-[60px]', imageClass);
        break;
    case 'lg':
        containerClass = clsx('h-22 w-22', containerClass);
        imageClass = clsx('h-22 w-22', imageClass);
        break;
    default:
        containerClass = clsx('h-10 w-10', containerClass);
        imageClass = clsx('h-10 w-10', imageClass);
        break;
    }

    if (!author || isLoading) {
        return <Skeleton className={imageClass} containerClassName={containerClass} />;
    }

    if (!iconUrl) {
        containerClass = clsx(containerClass, 'bg-gray-100 dark:bg-gray-900');
    }

    const handle = author?.handle || getUsername(author as ActorProperties);

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isEnabled('ap-routes')) {
            navigate(`/profile-rr/${handle}`);
        } else {
            NiceModal.show(ViewProfileModal, {handle});
            onClick?.();
        }
    };

    const title = `${author?.name} ${handle}`;

    if (iconUrl) {
        return (
            <div
                className={containerClass}
                title={title}
                onClick={size === 'lg' || disabled ? undefined : handleClick}
            >
                <img
                    className={imageClass}
                    src={iconUrl}
                    onError={() => setIconUrl(undefined)}
                />
            </div>
        );
    }

    return (
        <div
            className={containerClass}
            title={title}
            onClick={disabled ? undefined : handleClick}
        >
            <Icon
                colorClass='text-gray-600'
                name='user'
                size={iconSize}
            />
        </div>
    );
};

export default APAvatar;
