/**
 * Publication Controller
 * Handles CRUD operations for publications (both admin and public)
 */

const { logAudit, getIpAddress, getUserAgent } = require('../utils/audit');
const publicationRepository = require('../repositories/publication.repository');
const userRepository = require('../repositories/user.repository');
const response = require('../utils/response');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { PAGINATION, PUBLICATION_STATUS, AUDIT_ACTIONS, ERROR_CODES, USER_ROLES } = require('../config/constants');
const { isFileStorage } = require('../config/storage');
const sseController = require('./sse.controller');

/**
 * Get all publications (Admin)
 * GET /api/admin/publications
 */
const getAllPublications = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = PAGINATION.DEFAULT_LIMIT,
    sort = 'created_at',
    order = 'DESC',
    search = '',
    status = ''
  } = req.query;
  
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    orderBy: { [sort]: order.toUpperCase() }
  };
  
  // Add search condition
  if (search) {
    options.search = search;
  }
  
  // Add status filter
  if (status) {
    options.where = { status };
  }
  
  const result = await publicationRepository.paginate(options);
  
  return response.paginated(res, result.items, result.pagination);
});

/**
 * Create publication (Admin)
 * POST /api/admin/publications
 */
const createPublication = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    topics,
    audience,
    industries,
    owners,
    gitSource,
    boxSource,
    icon,
    status,
    metadata = {}
  } = req.body;
  
  const userId = req.user.id;
  
  // Set published_at if status is published
  const publishedAt = status === PUBLICATION_STATUS.PUBLISHED ? new Date() : null;
  
  const publicationData = {
    title,
    description,
    topics,
    audience,
    industries,
    owners,
    git_source: gitSource || null,
    box_source: boxSource || null,
    icon,
    status,
    metadata: JSON.stringify(metadata),
    created_by: userId,
    updated_by: userId,
    published_at: publishedAt
  };
  
  const publication = await publicationRepository.create(publicationData);
  
  // Log audit
  await logAudit({
    userId: req.user.id,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.CREATE,
    resourceType: 'publication',
    resourceId: publication.id,
    changes: { publication },
    ipAddress: getIpAddress(req),
    userAgent: getUserAgent(req),
    success: true
  });
  
  // Send SSE event for publication created
  sseController.sendEvent('publication:created', {
    id: publication.id,
    title: publication.title,
    status: publication.status
  });
  
  return response.created(res, publication, 'Publication created successfully');
});

/**
 * Update publication (Admin)
 * PUT /api/admin/publications/:id
 */
const updatePublication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  // Get existing publication
  const existingPublication = await publicationRepository.findById(id);
  
  if (!existingPublication) {
    throw new AppError('Publication not found', 404, ERROR_CODES.NOT_FOUND);
  }
  
  // Build update data
  const updateData = {};
  const allowedFields = [
    'title', 'description', 'topics', 'audience', 'industries', 'owners',
    'git_source', 'box_source', 'icon', 'status', 'metadata'
  ];
  
  const fieldMapping = {
    gitSource: 'git_source',
    boxSource: 'box_source'
  };
  
  for (const [key, value] of Object.entries(req.body)) {
    const dbField = fieldMapping[key] || key;
    if (allowedFields.includes(dbField) && value !== undefined) {
      updateData[dbField] = dbField === 'metadata' ? JSON.stringify(value) : value;
    }
  }
  
  if (Object.keys(updateData).length === 0) {
    throw new AppError('No valid fields to update', 400, ERROR_CODES.VALIDATION_ERROR);
  }
  
  // Add updated_by
  updateData.updated_by = userId;
  
  // Set published_at if status changed to published
  if (req.body.status === PUBLICATION_STATUS.PUBLISHED && 
      existingPublication.status !== PUBLICATION_STATUS.PUBLISHED) {
    updateData.published_at = new Date();
  }
  
  const updatedPublication = await publicationRepository.updateById(id, updateData);
  
  // Log audit with changes
  await logAudit({
    userId: req.user.id,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.UPDATE,
    resourceType: 'publication',
    resourceId: id,
    changes: {
      before: existingPublication,
      after: updatedPublication
    },
    ipAddress: getIpAddress(req),
    userAgent: getUserAgent(req),
    success: true
  });
  
  // Send SSE event for publication updated
  sseController.sendEvent('publication:updated', {
    id: updatedPublication.id,
    title: updatedPublication.title,
    status: updatedPublication.status
  });
  
  return response.success(res, updatedPublication, 'Publication updated successfully');
});

/**
 * Delete publication (Admin)
 * DELETE /api/admin/publications/:id
 */
const deletePublication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Check if publication exists
  const publication = await publicationRepository.findById(id);
  
  if (!publication) {
    throw new AppError('Publication not found', 404, ERROR_CODES.NOT_FOUND);
  }
  
  // Delete publication
  await publicationRepository.deleteById(id);
  
  // Log audit
  await logAudit({
    userId: req.user.id,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.DELETE,
    resourceType: 'publication',
    resourceId: id,
    changes: { deletedPublication: publication },
    ipAddress: getIpAddress(req),
    userAgent: getUserAgent(req),
    success: true
  });
  
  // Send SSE event for publication deleted
  sseController.sendEvent('publication:deleted', {
    id: id,
    title: publication.title
  });
  
  return response.success(res, publication, 'Publication deleted successfully');
});

/**
 * Get published publications (Public)
 * GET /api/publications
 */
const getPublishedPublications = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = PAGINATION.DEFAULT_LIMIT,
    search = '',
    topics = '',
    industries = ''
  } = req.query;
  
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    where: { status: PUBLICATION_STATUS.PUBLISHED },
    orderBy: { published_at: 'DESC' }
  };
  
  // Add search condition
  if (search) {
    options.search = search;
  }
  
  // Add topics filter
  if (topics) {
    const topicsArray = topics.split(',').map(t => t.trim());
    options.arrayOverlap = { topics: topicsArray };
  }
  
  // Add industries filter
  if (industries) {
    const industriesArray = industries.split(',').map(i => i.trim());
    if (!options.arrayOverlap) options.arrayOverlap = {};
    options.arrayOverlap.industries = industriesArray;
  }
  
  const result = await publicationRepository.paginate(options);
  
  return response.paginated(res, result.items, result.pagination);
});

/**
 * Get single published publication (Public)
 * GET /api/publications/:id
 */
const getPublicationById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Get publication
  const publication = await publicationRepository.findById(id);
  
  if (!publication || publication.status !== PUBLICATION_STATUS.PUBLISHED) {
    throw new AppError('Publication not found', 404, ERROR_CODES.NOT_FOUND);
  }
  
  // Increment view count
  await publicationRepository.incrementViewCount(id);
  publication.view_count += 1;
  
  // Get related publications (same topics)
  const relatedPublications = await publicationRepository.findRelated(id, 5);
  
  return response.success(res, {
    publication,
    related: relatedPublications
  });
});

/**
 * Get single publication by ID (Admin)
 * GET /api/admin/publications/:id
 */
const getPublicationByIdAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Get publication (admin can see any status)
  const publication = await publicationRepository.findById(id);
  
  if (!publication) {
    throw new AppError('Publication not found', 404, ERROR_CODES.NOT_FOUND);
  }
  
  return response.success(res, publication);
});

/**
 * Create use case (Public - auto-published)
 * POST /api/usecases
 */
const createUseCase = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    topics,
    audience,
    industries,
    owners,
    gitSource,
    boxSource,
    icon,
    metadata = {}
  } = req.body;
  
  // Use cases are always published immediately (no admin approval required)
  const status = PUBLICATION_STATUS.PUBLISHED;
  const publishedAt = new Date();
  
  // For public submissions, use authenticated user when present, otherwise a fallback admin/system user
  let userId = null;
  if (req.user && req.user.id) {
    userId = req.user.id;
  } else {
    const systemUser = await userRepository.findByEmail('system@example.com');

    if (systemUser) {
      userId = systemUser.id;
    } else {
      const adminUsers = await userRepository.findByRole(USER_ROLES.ADMIN, {
        limit: 1,
        offset: 0,
        orderBy: { created_at: 'ASC' }
      });

      if (adminUsers.length > 0) {
        userId = adminUsers[0].id;
      } else if (isFileStorage()) {
        const fallbackAdmin = await userRepository.findByEmail(process.env.DEMO_ADMIN_EMAIL || 'admin@example.com');

        if (fallbackAdmin) {
          userId = fallbackAdmin.id;
        }
      }

      if (!userId) {
        throw new AppError('System configuration error: No admin user found', 500, ERROR_CODES.INTERNAL_ERROR);
      }
    }
  }
  
  const publicationData = {
    title,
    description,
    topics,
    audience,
    industries,
    owners,
    git_source: gitSource || null,
    box_source: boxSource || null,
    icon,
    status,
    metadata: JSON.stringify(metadata),
    created_by: userId,
    updated_by: userId,
    published_at: publishedAt
  };
  
  const publication = await publicationRepository.create(publicationData);
  
  // Log audit (use system email if no authenticated user)
  const auditEmail = req.user ? req.user.email : 'public@system';
  await logAudit({
    userId: userId,
    userEmail: auditEmail,
    action: AUDIT_ACTIONS.CREATE,
    resourceType: 'publication',
    resourceId: publication.id,
    changes: { publication },
    ipAddress: getIpAddress(req),
    userAgent: getUserAgent(req),
    success: true
  });
  
  // Send SSE event for use case created
  sseController.sendEvent('publication:created', {
    id: publication.id,
    title: publication.title,
    status: publication.status,
    type: 'usecase'
  });
  
  return response.created(res, publication, 'Use case created successfully');
});

module.exports = {
  getAllPublications,
  createPublication,
  updatePublication,
  deletePublication,
  getPublishedPublications,
  getPublicationById,
  getPublicationByIdAdmin,
  createUseCase
};

// Made with Bob
