import BloodRequest from '../models/BloodRequest.js';

/**
 * @desc    Get all open (Pending) blood requests — public feed for donors
 * @route   GET /api/requests
 * @access  Private
 */
export const getAllRequests = async (req, res) => {
  try {
    const { bloodGroup, city } = req.query;

    const query = { status: 'Pending' };
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (city) query.address = { $regex: city, $options: 'i' };

    const requests = await BloodRequest.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { requests, count: requests.length }
    });
  } catch (error) {
    console.error('Get All Requests Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * @desc    Get a single blood request by ID
 * @route   GET /api/requests/:id
 * @access  Private
 */
export const getRequestById = async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id).populate(
      'responses.donor',
      'name email phone'
    );

    if (!request) {
      return res.status(404).json({ status: 'fail', message: 'Blood request not found' });
    }

    res.status(200).json({ status: 'success', data: { request } });
  } catch (error) {
    console.error('Get Request By ID Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};
