import { ErrorModal } from '@/src/components/commons/notifications/error-modal';
import React, { createContext, ReactNode, useContext, useState } from 'react';

interface Notification {
  type: 'error' | 'success' | 'info';
  title?: string;
  message: string;
}

interface NotificationContextType {
  showError: (message: string, title?: string) => void;
  showSuccess: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<Notification | null>(null);

  const showError = (message: string, title: string = 'Error') => {
    setNotification({ type: 'error', title, message });
  };

  const showSuccess = (message: string, title: string = 'Éxito') => {
    setNotification({ type: 'success', title, message });
  };

  const showInfo = (message: string, title: string = 'Información') => {
    setNotification({ type: 'info', title, message });
  };

  const handleClose = () => {
    setNotification(null);
  };

  return (
    <NotificationContext.Provider value={{ showError, showSuccess, showInfo }}>
      {children}
      {notification?.type === 'error' && (
        <ErrorModal
          visible={!!notification}
          title={notification.title}
          message={notification.message}
          onClose={handleClose}
        />
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};