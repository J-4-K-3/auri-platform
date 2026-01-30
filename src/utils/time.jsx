import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export const timeAgo = (date) => dayjs(date).fromNow();

export const formatTime = (date) => dayjs(date).format('h:mm A');

export const formatDate = (date) => dayjs(date).format('MMM D, YYYY');

