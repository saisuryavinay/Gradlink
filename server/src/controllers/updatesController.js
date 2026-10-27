import PlacementUpdate from '../models/PlacementUpdate.js';
import Event from '../models/Event.js';

// --- Placement Updates ---

export const createUpdate = async (req, res, next) => {
  try {
    const { title, body, link, pinned, expiresAt } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'Title is required.' });

    const update = await PlacementUpdate.create({
      title: title.trim(),
      body: body?.trim() || '',
      link: link?.trim() || '',
      pinned: !!pinned,
      published: true, // Admin-created updates publish immediately
      publishedAt: new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      author: req.user._id,
    });

    res.status(201).json({ message: 'Update created.', update });
  } catch (error) {
    next(error);
  }
};

export const getUpdates = async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const query = isAdmin ? {} : { published: true };

    const updates = await PlacementUpdate.find(query)
      .populate('author', 'name')
      .sort({ pinned: -1, createdAt: -1 });

    res.json({ updates });
  } catch (error) {
    next(error);
  }
};

export const updatePlacementUpdate = async (req, res, next) => {
  try {
    const { title, body, link, pinned } = req.body;
    const update = await PlacementUpdate.findByIdAndUpdate(
      req.params.id,
      { title, body, link, pinned },
      { new: true, runValidators: false }
    );
    if (!update) return res.status(404).json({ message: 'Update not found.' });
    res.json({ message: 'Update saved.', update });
  } catch (error) {
    next(error);
  }
};

export const deletePlacementUpdate = async (req, res, next) => {
  try {
    await PlacementUpdate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Update deleted.' });
  } catch (error) {
    next(error);
  }
};

export const publishUpdate = async (req, res, next) => {
  try {
    const update = await PlacementUpdate.findByIdAndUpdate(
      req.params.id,
      { published: true, publishedAt: new Date() },
      { new: true }
    );
    if (!update) return res.status(404).json({ message: 'Update not found.' });
    res.json({ message: 'Update published.', update });
  } catch (error) {
    next(error);
  }
};

// --- Events ---

export const createEvent = async (req, res, next) => {
  try {
    const { title, description, eventType, startDate, endDate, time, venue, registrationLink } = req.body;
    if (!title?.trim()) return res.status(400).json({ message: 'Title is required.' });
    if (!startDate) return res.status(400).json({ message: 'Start date is required.' });

    const event = await Event.create({
      title: title.trim(),
      description: description?.trim(),
      eventType: eventType || 'seminar',
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      time: time?.trim(),
      venue: venue?.trim(),
      registrationLink: registrationLink?.trim(),
      published: true,
      author: req.user._id,
    });

    res.status(201).json({ message: 'Event created.', event });
  } catch (error) {
    next(error);
  }
};

export const getEvents = async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const query = isAdmin ? {} : { published: true };

    const events = await Event.find(query)
      .populate('author', 'name')
      .sort({ startDate: 1 });

    res.json({ events });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: false });
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    res.json({ message: 'Event updated.', event });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted.' });
  } catch (error) {
    next(error);
  }
};

export const publishEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, { published: true }, { new: true });
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    res.json({ message: 'Event published.', event });
  } catch (error) {
    next(error);
  }
};
