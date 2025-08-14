import { TimeAgo } from './timeAgo.js';

export const formattedNotifications = (notifications) => {
  let responses = [];
  notifications.map((notification) => {
    let result = {};
    let title = '';
    let time = TimeAgo(notification.timestamp);

    if (notification.notification_type === 'meetup') {
      title = 'Meetup Reminder';
      result.details = notification.details;
    } else if (notification.notification_type === 'listing-approved') {
      title = 'Listing Approved';
    } else if (notification.notification_type === 'warning') {
      title = 'Warning User';
    } else if (notification.notification_type === 'suspendede') {
      title = 'Suspended User';
    } else if (notification.notification_type === 'listing-under-review') {
      title = 'Listing Under Review';
    } else if (notification.notification_type === 'order') {
      title = 'Item Order';
    } else if (notification.notification_type === 'meetup-reported') {
      title = 'Reported Meetup';
    } else if (notification.notification_type === 'review') {
      title = 'Order Review';
    } else if (notification.notification_type === 'cancel') {
      title = 'Cancelled Order';
    }

    result.type = notification.notification_type;
    result.title = title;
    result.time = time;
    result.message = notification.content;

    responses.push(result);
  });

  return responses;
};
