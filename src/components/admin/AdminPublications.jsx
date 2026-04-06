/**
 * Admin Publications Component
 *
 * Use case management view with DataTable, search, filters, and CRUD operations.
 * Includes real-time updates via SSE.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Column,
  Button,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  TableToolbarMenu,
  TableToolbarAction,
  TableBatchActions,
  TableBatchAction,
  TableSelectAll,
  TableSelectRow,
  Pagination,
  DataTableSkeleton,
  InlineNotification,
  Tag,
  OverflowMenu,
  OverflowMenuItem,
  ToastNotification,
} from '@carbon/react';
import { Add, TrashCan, Edit } from '@carbon/icons-react';
import publicationService from '../../services/publication.service';
import DeleteConfirmModal from './DeleteConfirmModal';
import EmptyState from '../shared/EmptyState';
import { useSSE } from '../../contexts/SSEContext';
import './AdminPublications.scss';

/**
 * Format date to readable string
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Get status tag kind
 * @param {string} status - Publication status
 * @returns {string} Tag kind
 */
const getStatusKind = (status) => {
  return status === 'published' ? 'green' : 'gray';
};

/**
 * AdminPublications component
 * @returns {React.ReactElement} Use case management view
 */
const AdminPublications = () => {
  const navigate = useNavigate();
  const { subscribe } = useSSE();
  
  // State
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [notification, setNotification] = useState(null);
  
  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkDeleteIds, setBulkDeleteIds] = useState([]);

  /**
   * Fetch use cases from API
   */
  const fetchPublications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await publicationService.getAllPublications(
        page,
        pageSize,
        searchQuery,
        sortBy,
        sortOrder,
        statusFilter
      );
      
      setPublications(data.publications || []);
      setTotalItems(data.pagination?.totalCount || 0);
    } catch (err) {
      console.error('Failed to fetch use cases:', err);
      setError(err.message || 'Failed to load use cases');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchQuery, sortBy, sortOrder, statusFilter]);

  useEffect(() => {
    fetchPublications();
  }, [fetchPublications]);

  // Subscribe to SSE events for real-time updates
  useEffect(() => {
    // Handle publication created event
    const unsubscribeCreated = subscribe('publication:created', (data) => {
      console.log('Admin: Publication created:', data);
      setNotification({
        kind: 'success',
        title: 'Use Case Created',
        subtitle: `"${data.title}" has been created`,
        timeout: 5000
      });
      // Refresh the list
      fetchPublications();
    });

    // Handle publication updated event
    const unsubscribeUpdated = subscribe('publication:updated', (data) => {
      console.log('Admin: Publication updated:', data);
      setNotification({
        kind: 'info',
        title: 'Use Case Updated',
        subtitle: `"${data.title}" has been updated`,
        timeout: 5000
      });
      // Refresh the list
      fetchPublications();
    });

    // Handle publication deleted event
    const unsubscribeDeleted = subscribe('publication:deleted', (data) => {
      console.log('Admin: Publication deleted:', data);
      setNotification({
        kind: 'warning',
        title: 'Use Case Deleted',
        subtitle: `"${data.title}" has been deleted`,
        timeout: 5000
      });
      // Refresh the list
      fetchPublications();
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, [subscribe, fetchPublications]);

  /**
   * Handle search input change
   * @param {Event} e - Input event
   */
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page on search
  };

  /**
   * Handle status filter change
   * @param {string} status - Status filter value
   */
  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  /**
   * Handle pagination change
   * @param {Object} paginationData - Pagination data
   */
  const handlePaginationChange = ({ page: newPage, pageSize: newPageSize }) => {
    setPage(newPage);
    setPageSize(newPageSize);
  };

  /**
   * Handle single use case delete
   * @param {Object} publication - Use case to delete
   */
  const handleDeleteClick = (publication) => {
    setDeleteTarget(publication);
    setBulkDeleteIds([]);
    setDeleteModalOpen(true);
  };

  /**
   * Handle bulk delete
   * @param {Array} selectedRows - Selected row IDs
   */
  const handleBulkDelete = (selectedRows) => {
    setBulkDeleteIds(selectedRows.map(row => row.id));
    setDeleteTarget(null);
    setDeleteModalOpen(true);
  };

  /**
   * Confirm delete operation
   */
  const handleDeleteConfirm = async () => {
    try {
      setDeleteLoading(true);
      
      if (bulkDeleteIds.length > 0) {
        // Bulk delete
        await publicationService.bulkDeletePublications(bulkDeleteIds);
      } else if (deleteTarget) {
        // Single delete
        await publicationService.deletePublication(deleteTarget.id);
      }
      
      // Refresh publications list
      await fetchPublications();
      
      // Close modal
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      setBulkDeleteIds([]);
    } catch (err) {
      console.error('Delete failed:', err);
      setError(err.message || 'Failed to delete use case(s)');
    } finally {
      setDeleteLoading(false);
    }
  };

  /**
   * Handle edit use case
   * @param {string} id - Use case ID
   */
  const handleEdit = (id) => {
    navigate(`/admin/publications/${id}/edit`);
  };

  // Table headers
  const headers = [
    { key: 'title', header: 'Title' },
    { key: 'topics', header: 'Topics' },
    { key: 'status', header: 'Status' },
    { key: 'view_count', header: 'Views' },
    { key: 'created_at', header: 'Created' },
    { key: 'actions', header: 'Actions' },
  ];

  // Transform publications for DataTable
  const rows = publications.map((pub) => ({
    id: pub.id,
    title: pub.title,
    topics: pub.topics?.join(', ') || 'N/A',
    status: pub.status,
    view_count: pub.view_count || 0,
    created_at: formatDate(pub.created_at),
    _raw: pub, // Store raw data for actions
  }));

  if (loading && publications.length === 0) {
    return (
      <div className="admin-publications">
        <Grid>
          <Column sm={4} md={8} lg={16}>
            <DataTableSkeleton
              headers={headers}
              rowCount={10}
              columnCount={headers.length}
            />
          </Column>
        </Grid>
      </div>
    );
  }

  return (
    <div className="admin-publications">
      {notification && (
        <ToastNotification
          kind={notification.kind}
          title={notification.title}
          subtitle={notification.subtitle}
          timeout={notification.timeout}
          onClose={() => setNotification(null)}
          style={{ position: 'fixed', top: '3rem', right: '1rem', zIndex: 9999 }}
        />
      )}

      <Grid>
        <Column sm={4} md={8} lg={16}>
          {error && (
            <InlineNotification
              kind="error"
              title="Error"
              subtitle={error}
              lowContrast
              onCloseButtonClick={() => setError(null)}
              style={{ marginBottom: '1rem' }}
            />
          )}

          <DataTable rows={rows} headers={headers} isSortable>
            {({
              rows,
              headers,
              getHeaderProps,
              getRowProps,
              getSelectionProps,
              getToolbarProps,
              getBatchActionProps,
              onInputChange,
              selectedRows,
              getTableProps,
              getTableContainerProps,
            }) => {
              const batchActionProps = getBatchActionProps();

              return (
                <TableContainer
                  title="Use Cases"
                  description="Manage your use cases"
                  {...getTableContainerProps()}
                >
                  <TableToolbar {...getToolbarProps()}>
                    <TableBatchActions {...batchActionProps}>
                      <TableBatchAction
                        tabIndex={batchActionProps.shouldShowBatchActions ? 0 : -1}
                        renderIcon={TrashCan}
                        onClick={() => handleBulkDelete(selectedRows)}
                      >
                        Delete
                      </TableBatchAction>
                    </TableBatchActions>
                    <TableToolbarContent
                      aria-hidden={batchActionProps.shouldShowBatchActions}
                    >
                      <TableToolbarSearch
                        persistent
                        placeholder="Search use cases..."
                        onChange={handleSearch}
                      />
                      <TableToolbarMenu>
                        <TableToolbarAction onClick={() => handleStatusFilter('')}>
                          All Status
                        </TableToolbarAction>
                        <TableToolbarAction onClick={() => handleStatusFilter('published')}>
                          Published
                        </TableToolbarAction>
                        <TableToolbarAction onClick={() => handleStatusFilter('draft')}>
                          Draft
                        </TableToolbarAction>
                      </TableToolbarMenu>
                      <Button
                        kind="primary"
                        renderIcon={Add}
                        onClick={() => navigate('/admin/publications/new')}
                      >
                        Add Use Case
                      </Button>
                    </TableToolbarContent>
                  </TableToolbar>
                  
                  {rows.length === 0 ? (
                    <EmptyState
                      title="No use cases found"
                      message={
                        searchQuery || statusFilter
                          ? 'Try adjusting your search or filters'
                          : 'Get started by creating your first use case'
                      }
                      actionLabel={!searchQuery && !statusFilter ? 'Add Use Case' : undefined}
                      onAction={!searchQuery && !statusFilter ? () => navigate('/admin/publications/new') : undefined}
                    />
                  ) : (
                    <Table {...getTableProps()}>
                      <TableHead>
                        <TableRow>
                          <TableSelectAll {...getSelectionProps()} />
                          {headers.map((header, i) => (
                            <TableHeader
                              key={i}
                              {...getHeaderProps({ header })}
                            >
                              {header.header}
                            </TableHeader>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rows.map((row, i) => (
                          <TableRow key={row.id} {...getRowProps({ row })}>
                            <TableSelectRow {...getSelectionProps({ row })} />
                            {row.cells.map((cell) => {
                              if (cell.info.header === 'status') {
                                return (
                                  <TableCell key={cell.id}>
                                    <Tag type={getStatusKind(cell.value)}>
                                      {cell.value}
                                    </Tag>
                                  </TableCell>
                                );
                              }
                              if (cell.info.header === 'actions') {
                                return (
                                  <TableCell key={cell.id}>
                                    <OverflowMenu size="sm" flipped>
                                      <OverflowMenuItem
                                        itemText="Edit"
                                        onClick={() => handleEdit(row.id)}
                                      />
                                      <OverflowMenuItem
                                        itemText="Delete"
                                        isDelete
                                        onClick={() => {
                                          const publication = publications.find((pub) => pub.id === row.id);
                                          if (publication) {
                                            handleDeleteClick(publication);
                                          }
                                        }}
                                      />
                                    </OverflowMenu>
                                  </TableCell>
                                );
                              }
                              return <TableCell key={cell.id}>{cell.value}</TableCell>;
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TableContainer>
              );
            }}
          </DataTable>

          {totalItems > 0 && (
            <Pagination
              backwardText="Previous page"
              forwardText="Next page"
              itemsPerPageText="Items per page:"
              page={page}
              pageSize={pageSize}
              pageSizes={[10, 20, 30, 40, 50]}
              totalItems={totalItems}
              onChange={handlePaginationChange}
            />
          )}
        </Column>
      </Grid>

      <DeleteConfirmModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteTarget(null);
          setBulkDeleteIds([]);
        }}
        onConfirm={handleDeleteConfirm}
        title={bulkDeleteIds.length > 0 ? 'Delete Use Cases' : 'Delete Use Case'}
        itemName={deleteTarget?.title}
        loading={deleteLoading}
        isBulk={bulkDeleteIds.length > 0}
        count={bulkDeleteIds.length}
      />
    </div>
  );
};

export default AdminPublications;

// Made with Bob