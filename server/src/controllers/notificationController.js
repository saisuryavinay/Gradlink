import Notification from '../models/Notification.js';

// GET /api/notifications
export const getNotifications = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, read: false });

    res.json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notifications/read-all
export const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notifications/:id/read
export const markOneRead = async (req, res, next) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: 'Notification not found.' });
    res.json({ notification: notif });
  } catch (error) {
    next(error);
  }
};
