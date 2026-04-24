'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toastStr, setToastStr] = useState('');
  const [show, setShow] = useState(false);

  const toast = useCallback((message) => {
    setToastStr(message);
    setShow(false);
    setTimeout(() => {
      setShow(true);
      setTimeout(() => setShow(false), 2500);
    }, 50);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className={`toast ${show ? 'show' : ''}`}>
        {toastStr}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext).toast;
}
