import { AppAlertChoiceSheet } from '@/src/components/commons/app-alert/choice-sheet';
import { AppAlertConfirmDialog } from '@/src/components/commons/app-alert/confirm-modal';
import { AppAlertErrorModal } from '@/src/components/commons/app-alert/error-modal';
import { AppAlertToast } from '@/src/components/commons/app-alert/toast';
import React, { createContext, ReactNode, useContext, useState } from 'react';

interface AppAlertNotification {
  type: 'error' | 'success' | 'info';
  title?: string;
  message: string;
}

interface AppAlertContextType {
  showError: (message: string, title?: string) => void;
  showSuccess: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  showConfirm: (title: string, message: string, confirmText?: string, cancelText?: string) => Promise<boolean>;
  showActionSheet: (title: string | undefined, message: string | undefined, options: { key: string; label: string }[]) => Promise<string | null>;
}

const AppAlertContext = createContext<AppAlertContextType | undefined>(undefined);

export const AppAlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<AppAlertNotification | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastContent, setToastContent] = useState<{ message: string; type?: 'success' | 'info' | 'error' } | null>(null);

  const [confirmState, setConfirmState] = useState<{
    visible: boolean;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    resolver?: (value: boolean) => void;
  } | null>(null);

  const [choiceState, setChoiceState] = useState<{
    visible: boolean;
    title?: string;
    message?: string;
    options: { key: string; label: string }[];
    resolver?: (key: string | null) => void;
  } | null>(null);

  const showError = (message: string, title: string = 'Error') => {
    // Keep the error modal behavior (blocking) for errors
    setNotification({ type: 'error', title, message });
  };

  const showSuccess = (message: string, title: string = 'Éxito') => {
    setToastContent({ message, type: 'success' });
    setToastOpen(true);
  };

  const showInfo = (message: string, title: string = 'Información') => {
    setToastContent({ message, type: 'info' });
    setToastOpen(true);
  };

  const showConfirm = (title: string, message: string, confirmText = 'Confirmar', cancelText = 'Cancelar') => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ visible: true, title, message, confirmText, cancelText, resolver: resolve });
    });
  };

  const showActionSheet = (title: string | undefined, message: string | undefined, options: { key: string; label: string }[]) => {
    return new Promise<string | null>((resolve) => {
      setChoiceState({ visible: true, title, message, options, resolver: resolve });
    });
  };

  const handleClose = () => {
    setNotification(null);
  };

  const handleToastClose = () => {
    setToastOpen(false);
    setToastContent(null);
  };

  const handleConfirm = (confirmed: boolean) => {
    if (!confirmState) return;
    confirmState.resolver?.(confirmed);
    setConfirmState(null);
  };

  const handleChoiceSelect = (key: string | null) => {
    if (!choiceState) return;
    choiceState.resolver?.(key);
    setChoiceState(null);
  };

  return (
    <AppAlertContext.Provider value={{ showError, showSuccess, showInfo, showConfirm, showActionSheet }}>
      {children}
      {notification?.type === 'error' && (
        <AppAlertErrorModal
          visible={!!notification}
          title={notification.title}
          message={notification.message}
          onClose={handleClose}
        />
      )}

      {toastContent && (
        <AppAlertToast visible={toastOpen} message={toastContent.message} type={toastContent.type} onClose={handleToastClose} />
      )}

      {confirmState && (
        <AppAlertConfirmDialog
          visible={!!confirmState}
          title={confirmState.title}
          message={confirmState.message}
          confirmText={confirmState.confirmText}
          cancelText={confirmState.cancelText}
          onConfirm={() => handleConfirm(true)}
          onCancel={() => handleConfirm(false)}
        />
      )}

      {choiceState && (
        <AppAlertChoiceSheet
          visible={!!choiceState}
          title={choiceState.title}
          message={choiceState.message}
          options={choiceState.options}
          onSelect={(key) => handleChoiceSelect(key)}
          onClose={() => handleChoiceSelect(null)}
        />
      )}
    </AppAlertContext.Provider>
  );
};

export const useAppAlert = (): AppAlertContextType => {
  const context = useContext(AppAlertContext);
  if (!context) {
    throw new Error('useAppAlert must be used within AppAlertProvider');
  }
  return context;
};