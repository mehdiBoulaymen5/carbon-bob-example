/**
 * Admin Audit Logs Component
 * 
 * Audit log viewing with filtering and search capabilities.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Column,
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
  Pagination,
  DataTableSkeleton,
  InlineNotification,
  Tag,
  DatePicker,
  DatePickerInput,
} from '@carbon/react';
import adminService from '../../services/admin.service';
import EmptyState from '../shared/EmptyState';
import './AdminAuditLogs.scss';

/**
 * Format date to readable string
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * Get action tag type
 * @param {string} action - Action type
 * @returns {string} Tag type
 */
const getActionTagType = (action) => {
  const actionMap = {
    CREATE: 'green',
    UPDATE: 'blue',
    DELETE: 'red',
    LOGIN: 'purple',
  };
  return actionMap[action] || 'gray';
};

/**
 * AdminAuditLogs component
 * @returns {React.ReactElement} Audit logs view
 */
const AdminAuditLogs = () => {
  // State
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalItems, setTotalItems] = useState(0);

  /**
   * Fetch audit logs from API
   */
  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = {};
      if (actionFilter) filters.action = actionFilter;

      const data = await adminService.getAuditLogs(page, pageSize, filters);

      setLogs(data.logs || []);
      setTotalItems(data.pagination?.totalCount || 0);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, actionFilter]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  /**
   * Handle search input change
   * @param {Event} e - Input event
   */
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  /**
   * Handle action filter change
   * @param {string} action - Action filter value
   */
  const handleActionFilter = (action) => {
    setActionFilter(action);
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
   * Filter logs by search query
   */
  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.user_email?.toLowerCase().includes(query) ||
      log.action?.toLowerCase().includes(query) ||
      log.resource_type?.toLowerCase().includes(query) ||
      log.resource_id?.toLowerCase().includes(query)
    );
  });

  // Table headers
  const headers = [
    { key: 'timestamp', header: 'Timestamp' },
    { key: 'user_email', header: 'User' },
    { key: 'action', header: 'Action' },
    { key: 'resource_type', header: 'Resource Type' },
    { key: 'resource_id', header: 'Resource ID' },
    { key: 'success', header: 'Status' },
  ];

  // Transform logs for DataTable
  const rows = filteredLogs.map((log) => ({
    id: log.id,
    timestamp: formatDate(log.timestamp),
    user_email: log.user_email || 'N/A',
    action: log.action,
    resource_type: log.resource_type || 'N/A',
    resource_id: log.resource_id ? log.resource_id.substring(0, 8) + '...' : 'N/A',
    success: log.success ? 'Success' : 'Failed',
    _raw: log,
  }));

  if (loading && logs.length === 0) {
    return (
      <div className="admin-audit-logs">
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
    <div className="admin-audit-logs">
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
              getToolbarProps,
              getTableProps,
              getTableContainerProps,
            }) => (
              <TableContainer
                title="Audit Logs"
                description="System activity and audit trail"
                {...getTableContainerProps()}
              >
                <TableToolbar {...getToolbarProps()}>
                  <TableToolbarContent>
                    <TableToolbarSearch
                      persistent
                      placeholder="Search logs..."
                      onChange={handleSearch}
                    />
                    <TableToolbarMenu>
                      <TableToolbarAction onClick={() => handleActionFilter('')}>
                        All Actions
                      </TableToolbarAction>
                      <TableToolbarAction onClick={() => handleActionFilter('CREATE')}>
                        Create
                      </TableToolbarAction>
                      <TableToolbarAction onClick={() => handleActionFilter('UPDATE')}>
                        Update
                      </TableToolbarAction>
                      <TableToolbarAction onClick={() => handleActionFilter('DELETE')}>
                        Delete
                      </TableToolbarAction>
                      <TableToolbarAction onClick={() => handleActionFilter('LOGIN')}>
                        Login
                      </TableToolbarAction>
                    </TableToolbarMenu>
                  </TableToolbarContent>
                </TableToolbar>

                {rows.length === 0 ? (
                  <EmptyState
                    title="No audit logs found"
                    message={
                      searchQuery || actionFilter
                        ? 'Try adjusting your search or filters'
                        : 'No audit logs available'
                    }
                  />
                ) : (
                  <Table {...getTableProps()}>
                    <TableHead>
                      <TableRow>
                        {headers.map((header, i) => (
                          <TableHeader key={i} {...getHeaderProps({ header })}>
                            {header.header}
                          </TableHeader>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow key={row.id} {...getRowProps({ row })}>
                          {row.cells.map((cell) => {
                            if (cell.info.header === 'action') {
                              return (
                                <TableCell key={cell.id}>
                                  <Tag type={getActionTagType(cell.value)}>
                                    {cell.value}
                                  </Tag>
                                </TableCell>
                              );
                            }
                            if (cell.info.header === 'success') {
                              return (
                                <TableCell key={cell.id}>
                                  <Tag type={cell.value === 'Success' ? 'green' : 'red'}>
                                    {cell.value}
                                  </Tag>
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
            )}
          </DataTable>

          {totalItems > 0 && (
            <Pagination
              backwardText="Previous page"
              forwardText="Next page"
              itemsPerPageText="Items per page:"
              page={page}
              pageSize={pageSize}
              pageSizes={[20, 50, 100]}
              totalItems={totalItems}
              onChange={handlePaginationChange}
            />
          )}
        </Column>
      </Grid>
    </div>
  );
};

export default AdminAuditLogs;

// Made with Bob