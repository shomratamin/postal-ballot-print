'use client';


import { ChannelNotificationState } from '@/lib/store/common/types';
import { createContext, useContext } from 'react';

export interface NotificationContextType {
    messages: ChannelNotificationState;
    subscribeToChannel: (channel: string, token: string) => void;
    markNotificationAsRead?: (uuid: string) => void;
    markAllNotificationsAsRead?: (channel: string) => void;
    markNotificationActionAsCompleted?: (uuid: string, action: string) => void;
}

export const NotificationContext = createContext<NotificationContextType>({
    messages: {},
    subscribeToChannel: (channel, token) => { },
    markNotificationAsRead: (uuid) => { },
    markAllNotificationsAsRead: (channel) => { },
    markNotificationActionAsCompleted: (uuid, action) => { },
});

export const useNotificationContext = () => useContext(NotificationContext);
