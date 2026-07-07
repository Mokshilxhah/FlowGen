import toast from 'react-hot-toast';

/**
 * Centralized toast notification system
 * Provides consistent styling and behavior across the app
 */

const defaultOptions = {
  duration: 4000,
  position: 'top-right',
  style: {
    background: 'rgba(15, 23, 42, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#f8fafc',
    borderRadius: '12px',
    padding: '12px 16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },
};

export const showToast = {
  // Success notifications
  success: (message, options = {}) => {
    return toast.success(message, {
      ...defaultOptions,
      ...options,
      icon: '✅',
      style: {
        ...defaultOptions.style,
        borderLeft: '3px solid #10b981',
      },
    });
  },

  // Error notifications
  error: (message, options = {}) => {
    return toast.error(message, {
      ...defaultOptions,
      duration: 5000,
      ...options,
      icon: '❌',
      style: {
        ...defaultOptions.style,
        borderLeft: '3px solid #ef4444',
      },
    });
  },

  // Warning notifications
  warning: (message, options = {}) => {
    return toast(message, {
      ...defaultOptions,
      ...options,
      icon: '⚠️',
      style: {
        ...defaultOptions.style,
        borderLeft: '3px solid #f59e0b',
      },
    });
  },

  // Info notifications
  info: (message, options = {}) => {
    return toast(message, {
      ...defaultOptions,
      ...options,
      icon: 'ℹ️',
      style: {
        ...defaultOptions.style,
        borderLeft: '3px solid #06b6d4',
      },
    });
  },

  // Loading notifications
  loading: (message, options = {}) => {
    return toast.loading(message, {
      ...defaultOptions,
      ...options,
      style: {
        ...defaultOptions.style,
        borderLeft: '3px solid #8b5cf6',
      },
    });
  },

  // Promise-based notifications (auto success/error)
  promise: (promise, messages, options = {}) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading || 'Loading...',
        success: messages.success || 'Success!',
        error: messages.error || 'Something went wrong',
      },
      {
        ...defaultOptions,
        ...options,
      }
    );
  },

  // Dismiss specific toast
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },

  // Dismiss all toasts
  dismissAll: () => {
    toast.dismiss();
  },
};

// Specific use-case helpers
export const toastHelpers = {
  // Network errors
  networkError: () => {
    showToast.error('Network error. Please check your connection.');
  },

  // Server errors
  serverError: () => {
    showToast.error('Server error. Please try again later.');
  },

  // Unauthorized
  unauthorized: () => {
    showToast.error('Session expired. Please login again.');
  },

  // Validation errors
  validationError: (message = 'Please check your input') => {
    showToast.warning(message);
  },

  // Success operations
  created: (item = 'Item') => {
    showToast.success(`${item} created successfully!`);
  },

  updated: (item = 'Item') => {
    showToast.success(`${item} updated successfully!`);
  },

  deleted: (item = 'Item') => {
    showToast.success(`${item} deleted successfully!`);
  },

  // Copy to clipboard
  copied: () => {
    showToast.success('Copied to clipboard!');
  },

  // File operations
  fileUploaded: () => {
    showToast.success('File uploaded successfully!');
  },

  fileUploadError: () => {
    showToast.error('Failed to upload file. Please try again.');
  },

  // Task operations
  taskCreated: () => {
    showToast.success('Task created successfully!');
  },

  taskUpdated: () => {
    showToast.success('Task updated successfully!');
  },

  taskDeleted: () => {
    showToast.success('Task deleted successfully!');
  },

  // Meeting operations
  meetingScheduled: () => {
    showToast.success('Meeting scheduled successfully!');
  },

  meetingCancelled: () => {
    showToast.info('Meeting cancelled.');
  },

  // Message operations
  messageSent: () => {
    showToast.success('Message sent!');
  },

  messageError: () => {
    showToast.error('Failed to send message.');
  },

  // Member operations
  memberInvited: () => {
    showToast.success('Invitation sent successfully!');
  },

  memberRemoved: () => {
    showToast.success('Member removed successfully!');
  },

  // Settings
  settingsSaved: () => {
    showToast.success('Settings saved successfully!');
  },

  // Generic
  comingSoon: () => {
    showToast.info('This feature is coming soon!');
  },
};

export default showToast;
