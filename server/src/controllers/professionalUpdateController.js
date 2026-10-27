import ProfessionalUpdate from '../models/ProfessionalUpdate.js';

// POST /api/professional-updates — alumni creates
export const createUpdate = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required.' });
    }

    const update = await ProfessionalUpdate.create({
      author: req.user._id,
      title: title.trim(),
      description: description.trim(),
    });

    res.status(201).json({ message: 'Update submitted for review.', update });
  } catch (error) {
    next(error);
  }
};

// GET /api/professional-updates
export const getUpdates = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const isAdmin = req.user?.role === 'admin';
    const isAlumni = req.user?.role === 'alumni';

    let query = {};

    if (isAdmin) {
      if (status) query.status = status;
    } else if (isAlumni) {
      // Alumni sees all their own updates + all approved updates
      query.$or = [{ author: req.user._id }, { status: 'approved' }];
    } else {
      // Students see only approved
      query.status = 'approved';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await ProfessionalUpdate.countDocuments(query);
    const updates = await ProfessionalUpdate.find(query)
      .populate('author', 'name avatar currentCompany currentRole department')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({ updates, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    next(error);
  }
};

// GET /api/professional-updates/mine — alumni's own updates
export const getMyUpdates = async (req, res, next) => {
  try {
    const updates = await ProfessionalUpdate.find({ author: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ updates });
  } catch (error) {
    next(error);
  }
};

// PUT /api/professional-updates/:id — alumni edits (returns to pending)
export const editUpdate = async (req, res, next) => {
  try {
    const update = await ProfessionalUpdate.findOne({ _id: req.params.id, author: req.user._id });
    if (!update) return res.status(404).json({ message: 'Update not found.' });

    if (['rejected'].includes(update.status)) {
      return res.status(400).json({ message: 'You cannot edit a rejected update.' });
    }

    update.title = req.body.title?.trim() || update.title;
    update.description = req.body.description?.trim() || update.description;
    // Editing an approved update returns it to pending
    if (update.status === 'approved') {
      update.status = 'pending';
      update.approvedAt = undefined;
    }
    await update.save();

    res.json({ message: 'Update edited. It will be reviewed again before publication.', update });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/professional-updates/:id
export const deleteUpdate = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, author: req.user._id };

    const update = await ProfessionalUpdate.findOneAndDelete(query);
    if (!update) return res.status(404).json({ message: 'Update not found.' });

    res.json({ message: 'Update deleted.' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/professional-updates/:id/review — admin approves/rejects
export const reviewUpdate = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected.' });
    }

    const update = await ProfessionalUpdate.findByIdAndUpdate(
      req.params.id,
      {
        status,
        adminNote,
        approvedAt: status === 'approved' ? new Date() : undefined,
        rejectedAt: status === 'rejected' ? new Date() : undefined,
      },
      { new: true }
    );

    if (!update) return res.status(404).json({ message: 'Update not found.' });

    res.json({ message: `Update ${status}.`, update });
  } catch (error) {
    next(error);
  }
};
