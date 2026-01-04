"use client"
import { QueryClient, QueryClientProvider, } from '@tanstack/react-query'
import { HeroUIProvider } from "@heroui/react"
import { useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { ThemeContext } from './context/theme-context';
import WeightMachineContext, {
    WeightMachineContextType,
    MachineIdResponse,
    WeightDimResponse
} from './context/weight-machine-context';
import { SidebarContext } from './context/layout-context';
import { Panel, PanelSlug, Submenu, ChannelNotificationState, UserNotification, IncomingMessage } from '@/lib/store/common/types';
import { initialPanels } from '@/lib/store/common/store';

// WeightMachineProvider component
const WeightMachineProvider = ({ children }: { children: React.ReactNode }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [printerId, setPrinterId] = useState<string | null>(null);
    const [weightDimData, setWeightDimData] = useState<WeightDimResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showBanner, setShowBanner] = useState(true);


    const getWeightDimData = async () => {
        if (!isConnected) {
            setError('Weight machine is not connected');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:30880/get-weightdim-data');

            if (!response.ok) {
                throw new Error('Failed to get weight dimension data');
            }

            const data: WeightDimResponse = await response.json();

            if (data.Status === 'success') {
                setWeightDimData(data);
            } else {
                throw new Error('Invalid weight dimension data response');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    // Check connection on component mount

    // useEffect(() => {
    //     checkConnection();

    //     // Optional: Set up periodic connection checking
    //     const interval = setInterval(checkConnection, 10000); // Check every 10 seconds

    //     return () => clearInterval(interval);
    // }, []);

    // Auto-fetch weight dimension data when connected with continuous polling
    useEffect(() => {
        let weightDimInterval: NodeJS.Timeout;

        if (isConnected && printerId) {
            // Initial fetch
            getWeightDimData();

            // Set up continuous polling every 3 seconds
            weightDimInterval = setInterval(() => {
                getWeightDimData();
            }, 3000);
        }

        return () => {
            if (weightDimInterval) {
                clearInterval(weightDimInterval);
            }
        };
    }, [isConnected, printerId]);

    const value: WeightMachineContextType = {
        isConnected,
        printerId,
        weightDimData,
        isLoading,
        error,
        // checkConnection,
        getWeightDimData,
        showBanner,
        setShowBanner,
    };

    return (
        <WeightMachineContext.Provider value={value}>
            {children}
        </WeightMachineContext.Provider>
    );
};

// // NotificationProvider component
// const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
//     const [messages, setMessages] = useState<ChannelNotificationState>({});
//     const [websockets, setWebsockets] = useState<Map<string, WebSocket>>(new Map());

//     const subscribeToChannel = useCallback((channel: string, token: string) => {
//         // Check if already subscribed
//         if (websockets.has(channel)) {
//             console.log(`Already subscribed to channel: ${channel}`);
//             return;
//         }

//         // Create WebSocket connection with channel parameter
//         const ws = new WebSocket(`ws://localhost:8004/ws?channels=${channel}`);

//         // When the connection is opened
//         ws.addEventListener('open', function (event) {
//             console.log(`WebSocket connection established for channel: ${channel}`);

//             // Send the token immediately after the connection is opened
//             ws.send(JSON.stringify({ type: 'auth', token: token }));
//         });

//         // When a message is received
//         ws.addEventListener('message', function (event) {
//             console.log('Notification received:', event.data);

//             try {
//                 const incomingMessage: IncomingMessage = JSON.parse(event.data);

//                 // Transform incoming message to UserNotification
//                 const notification: UserNotification = {
//                     id: Date.now(), // Temporary ID
//                     user: 0, // Will be set from backend
//                     sender: incomingMessage.channel,
//                     notification_uuid: incomingMessage.uuid,
//                     channel: incomingMessage.channel,
//                     title: incomingMessage.type,
//                     report_type: incomingMessage.type,
//                     message: incomingMessage.message,
//                     created_at: new Date() as any, // Convert to ZonedDateTime if needed
//                     delivered_at: new Date() as any,
//                     updated_at: null,
//                     status: 'unread',
//                     event: incomingMessage.type,
//                     is_delivered: true,
//                     is_important: false,
//                     files: incomingMessage.filename && incomingMessage.url ? [{
//                         id: Date.now(),
//                         file_name: incomingMessage.filename,
//                         file_size: '0',
//                         file_type: incomingMessage.filename.split('.').pop() || '',
//                         file_url: incomingMessage.url,
//                         created_at: new Date() as any,
//                     }] : [],
//                 };

//                 setMessages((prev) => ({
//                     ...prev,
//                     [channel]: [...(prev[channel] || []), notification],
//                 }));
//             } catch (error) {
//                 console.error('Error parsing notification message:', error);
//             }
//         });

//         // When the connection is closed
//         ws.addEventListener('close', function (event) {
//             console.log(`WebSocket connection closed for channel: ${channel}`);
//             setWebsockets((prev) => {
//                 const newMap = new Map(prev);
//                 newMap.delete(channel);
//                 return newMap;
//             });
//         });

//         // In case of an error
//         ws.addEventListener('error', function (event) {
//             console.error(`WebSocket error on channel ${channel}:`, event);
//         });

//         setWebsockets((prev) => new Map(prev).set(channel, ws));
//     }, [websockets]);

//     const markNotificationAsRead = useCallback((uuid: string) => {
//         setMessages((prev) => {
//             const updated = { ...prev };
//             Object.keys(updated).forEach((channel) => {
//                 updated[channel] = updated[channel].map((notification) =>
//                     notification.notification_uuid === uuid
//                         ? { ...notification, status: 'read' }
//                         : notification
//                 );
//             });
//             return updated;
//         });
//     }, []);

//     const markAllNotificationsAsRead = useCallback((channel: string) => {
//         setMessages((prev) => ({
//             ...prev,
//             [channel]: prev[channel]?.map((notification) => ({
//                 ...notification,
//                 status: 'read',
//             })) || [],
//         }));
//     }, []);

//     const markNotificationActionAsCompleted = useCallback((uuid: string, action: string) => {
//         setMessages((prev) => {
//             const updated = { ...prev };
//             Object.keys(updated).forEach((channel) => {
//                 updated[channel] = updated[channel].map((notification) =>
//                     notification.notification_uuid === uuid
//                         ? { ...notification, event: action, status: 'completed' }
//                         : notification
//                 );
//             });
//             return updated;
//         });
//     }, []);

//     // Cleanup WebSocket connections on unmount
//     useEffect(() => {
//         return () => {
//             websockets.forEach((ws) => {
//                 if (ws.readyState === WebSocket.OPEN) {
//                     ws.close();
//                 }
//             });
//         };
//     }, [websockets]);

//     const value = {
//         messages,
//         subscribeToChannel,
//         markNotificationAsRead,
//         markAllNotificationsAsRead,
//         markNotificationActionAsCompleted,
//     };

//     return (
//         <NotificationContext.Provider value={value}>
//             {children}
//         </NotificationContext.Provider>
//     );
// };

export default function Providers({ children, theme }: { children: React.ReactNode, theme: string }) {
    const queryClient = new QueryClient()
    const [panels, setPanels] = useState<Panel[]>(initialPanels);
    const [selectedPanel, setSelectedPanel] = useState<Panel>(initialPanels[0]);
    const [selectedTheme, setSelectedTheme] = useState<string>(theme);
    const [selectedSubmenu, setSelectedSubmenu] = useState<Submenu | null>(initialPanels[0].selectedSubmenu);
    const [sidebar, setSidebar] = useState<boolean>(false);
    const [screen_size, setScreenSize] = useState<number>(350);
    const [sidebar_floating, setSidebarFloating] = useState<boolean>(false);

    const toggleFloatingSidebar = () => {
        setSidebarFloating((prevSidebar) => !prevSidebar);
    };
    const toggleSidebar = () => {
        setSidebar((prevSidebar) => !prevSidebar);
    };

    const togglePanelVisibility = (slug: PanelSlug) => {
        setPanels((prevPanels) =>
            prevPanels.map((panel) =>
                panel.slug === slug ? { ...panel, shown: !panel.shown } : panel
            )
        );
    };

    const toggleSubmenuSelection = (slug: PanelSlug, submenuSlug: string) => {

        setPanels((prevPanels: Panel[]) =>
            prevPanels.map((panel: Panel) => {
                if (panel.slug === slug) {
                    setSelectedPanel(panel);
                    return {
                        ...panel,
                        submenus: panel.submenus.map((submenu) => {
                            if (submenu.slug === submenuSlug) {
                                setSelectedSubmenu(submenu);
                                return { ...submenu, selected: true }
                            } else {
                                return { ...submenu, selected: false }
                            }
                        }


                        ),
                    }

                } else {
                    return { ...panel, submenus: panel.submenus.map((submenu) => ({ ...submenu, selected: false })) }
                }
            }

            )
        );

    }

    const toggleSubmenuVisibility = (slug: PanelSlug) => {
        setPanels((prevPanels) =>
            prevPanels.map((panel) =>
                panel.slug === slug ? { ...panel, submenuShown: !panel.submenuShown } : panel
            )
        );
    };

    const addPanel = (panel: Panel) => {
        setPanels((prevPanels) => [...prevPanels, panel]);
    };

    const removePanel = (slug: PanelSlug) => {
        setPanels((prevPanels) => prevPanels.filter((panel) => panel.slug !== slug));
    };

    const toggsetSelectedTheme = () => {

        let _theme = selectedTheme === 'light' ? 'dark' : 'light';
        console.log("theme", _theme);
        setSelectedTheme(_theme);
        Cookies.set('theme', _theme, { expires: 7 });
        // add class dark to html tag
        document.documentElement.classList.toggle('dark', _theme === 'dark');
        // remove class dark from html tag
        document.documentElement.classList.toggle('light', _theme === 'light');

    };


    return (
        <ThemeContext.Provider value={{ selectedTheme: selectedTheme, toggsetSelectedTheme: toggsetSelectedTheme }}>
            <HeroUIProvider>
                <QueryClientProvider client={queryClient}>
                    <WeightMachineProvider>
                        <SidebarContext.Provider
                            value={{ panels, selectedPanel, selectedSubmenu, screen_size, setScreenSize, sidebar, sidebar_floating, toggleSidebar, toggleSubmenuSelection, toggleFloatingSidebar, togglePanelVisibility, toggleSubmenuVisibility, addPanel, removePanel }}
                        >
                            {children}
                        </SidebarContext.Provider>
                    </WeightMachineProvider>
                </QueryClientProvider>
            </HeroUIProvider>
        </ThemeContext.Provider>
    )
}