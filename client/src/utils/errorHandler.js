import toast from 'react-hot-toast';

export function handleApiError(error, defaultMessage = 'Something went wrong') {
  const status = error?.response?.status;
  const errorMsg = error?.response?.data?.error || error?.message || defaultMessage;

  let displayMsg = defaultMessage;
  let displayDesc = '';

  // Network errors
  if (!error?.response) {
    displayMsg = 'Network Error';
    displayDesc = 'Unable to connect to server. Check your internet connection.';
  }
  // Specific HTTP errors
  else if (status === 401) {
    displayMsg = 'Unauthorized';
    displayDesc = 'Your session has expired. Please log in again.';
  } else if (status === 403) {
    displayMsg = 'Access Denied';
    displayDesc = 'You do not have permission to perform this action.';
  } else if (status === 404) {
    displayMsg = 'Not Found';
    displayDesc = errorMsg || 'The requested resource was not found.';
  } else if (status === 409) {
    displayMsg = 'Conflict';
    displayDesc = errorMsg || 'This action conflicts with existing data.';
  } else if (status === 422 || status === 400) {
    displayMsg = 'Validation Error';
    displayDesc = errorMsg || 'Please check your input and try again.';
  } else if (status >= 500) {
    displayMsg = 'Server Error';
    displayDesc = 'The server encountered an error. Please try again later.';
  } else {
    displayMsg = 'Error';
    displayDesc = errorMsg;
  }

  toast.error(displayMsg, {
    description: displayDesc || undefined,
    duration: 4000,
  });

  console.error('[API Error]', { status, message: errorMsg, error });
}

export function handleSuccess(message = 'Success', description = '') {
  toast.success(message, {
    description: description || undefined,
    duration: 3000,
  });
}

export function handleWarning(message = 'Warning', description = '') {
  toast((t) => (
    <div>
      <div className="font-semibold">{message}</div>
      {description && <div className="text-sm mt-1">{description}</div>}
    </div>
  ), {
    icon: '⚠️',
    duration: 3500,
  });
}

export function handleLoading(message = 'Loading...') {
  return toast.loading(message);
}

export function dismissToast(toastId) {
  if (toastId) toast.dismiss(toastId);
}
