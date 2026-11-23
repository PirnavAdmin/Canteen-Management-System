/**
 * Real-time Order Synchronization Hub
 * Broadcasts status updates locally via CustomEvent and across browser tabs via BroadcastChannel.
 */

const CHANNEL_NAME = 'cms_orders_broadcast_channel';

export const notifyOrderStatusUpdated = (order) => {
  if (!order) return;
  try {
    window.dispatchEvent(new CustomEvent('cms:order_status_updated', { detail: order }));
  } catch {}

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage({ type: 'order_status_updated', order });
      setTimeout(() => {
        try { channel.close(); } catch {}
      }, 300);
    }
  } catch {}
};

export const notifyOrderCreated = (order) => {
  try {
    window.dispatchEvent(new CustomEvent('cms:order_created', { detail: order }));
  } catch {}

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      channel.postMessage({ type: 'order_created', order });
      setTimeout(() => {
        try { channel.close(); } catch {}
      }, 300);
    }
  } catch {}
};

export const subscribeToOrderSync = (onOrderUpdate, onOrderCreate) => {
  const handleLocalUpdate = (e) => onOrderUpdate?.(e?.detail);
  const handleLocalCreate = (e) => onOrderCreate?.(e?.detail);

  window.addEventListener('cms:order_status_updated', handleLocalUpdate);
  window.addEventListener('cms:order_created', handleLocalCreate);

  let channel = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event.data?.type === 'order_status_updated') {
          onOrderUpdate?.(event.data.order);
        } else if (event.data?.type === 'order_created') {
          onOrderCreate?.(event.data.order);
        }
      };
    }
  } catch {}

  return () => {
    window.removeEventListener('cms:order_status_updated', handleLocalUpdate);
    window.removeEventListener('cms:order_created', handleLocalCreate);
    if (channel) {
      try { channel.close(); } catch {}
    }
  };
};
