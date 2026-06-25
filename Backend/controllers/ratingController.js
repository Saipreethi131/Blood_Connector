import Rating from '../models/Rating.js';
import BloodRequest from '../models/BloodRequest.js';

const MIN_RATINGS_TO_SHOW = 3;

/**
 * @desc    Submit a 1-5 star rating after a completed donation interaction
 * @route   POST /api/ratings
 * @access  Private (donor or hospital)
 */
export const submitRating = async (req, res) => {
  try {
    const { requestId, stars, comment } = req.body;
    const fromUserId = req.user._id;
    const fromRole = req.user.role;

    if (!['donor', 'hospital'].includes(fromRole)) {
      return res.status(403).json({ status: 'fail', message: 'Only donors and hospitals can submit ratings' });
    }
    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ status: 'fail', message: 'stars must be between 1 and 5' });
    }

    const request = await BloodRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ status: 'fail', message: 'Blood request not found' });
    }

    let toUser, toRole;
    if (fromRole === 'hospital') {
      // Hospital rates the donor — must own the request, which must be Fulfilled.
      // Use `fulfilledBy` (set when the hospital marks the request Fulfilled) rather
      // than re-scanning responses for "Accepted" status: a hospital can mark a
      // request Fulfilled without ever explicitly clicking Accept on a response,
      // in which case fulfilledBy is still set (from the first responder) but no
      // response.status would be "Accepted" — that used to make rating impossible.
      if (request.hospital.toString() !== fromUserId.toString()) {
        return res.status(403).json({ status: 'fail', message: 'You can only rate donors on your own requests' });
      }
      if (request.status !== 'Fulfilled' || !request.fulfilledBy?.donorId) {
        return res.status(400).json({ status: 'fail', message: 'This request has not been fulfilled by a donor yet' });
      }
      toUser = request.fulfilledBy.donorId;
      toRole = 'donor';
    } else {
      // Donor rates the hospital — must have an Accepted response on this request
      const myResponse = request.responses.find((r) => r.donorId.toString() === fromUserId.toString());
      if (!myResponse || myResponse.status !== 'Accepted') {
        return res.status(403).json({ status: 'fail', message: 'You can only rate hospitals after being accepted on a request' });
      }
      toUser = request.hospital;
      toRole = 'hospital';
    }

    const rating = await Rating.create({
      request: request._id, fromUser: fromUserId, fromRole, toUser, toRole, stars, comment: comment || ''
    });

    res.status(201).json({ status: 'success', message: 'Rating submitted', data: { rating } });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ status: 'fail', message: 'You have already rated this interaction' });
    }
    console.error('Submit Rating Error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Returns { avg, count } for a user, or null if fewer than MIN_RATINGS_TO_SHOW ratings exist
export const getUserRatingSummary = async (userId) => {
  const [result] = await Rating.aggregate([
    { $match: { toUser: userId } },
    { $group: { _id: null, avg: { $avg: '$stars' }, count: { $sum: 1 } } },
  ]);
  if (!result || result.count < MIN_RATINGS_TO_SHOW) return null;
  return { avg: Math.round(result.avg * 10) / 10, count: result.count };
};
