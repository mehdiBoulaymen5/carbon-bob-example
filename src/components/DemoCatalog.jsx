import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Column,
  Tile,
  Tag,
  Button,
  ToastNotification
} from '@carbon/react';
import { Code, DataBase, ChartLine, Chat, CloudApp, Security, Analytics, Api, Add } from '@carbon/icons-react';
import { useAuth } from '../contexts/AuthContext';
import AddUseCaseModal from './shared/AddUseCaseModal';
import LoadingState from './shared/LoadingState';
import EmptyState from './shared/EmptyState';
import publicationService from '../services/publication.service';
import './DemoCatalog.scss';

// Icon mapping for dynamic icon rendering
const iconMap = {
  Code,
  DataBase,
  ChartLine,
  Chat,
  CloudApp,
  Security,
  Analytics,
  Api
};

function DemoCatalog() {
  const [useCases, setUseCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  /**
   * Fetch use cases from the database
   */
  const fetchUseCases = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch published use cases from the database
      const response = await publicationService.getPublicPublications(1, 100);
      setUseCases(response.publications || []);
    } catch (err) {
      console.error('Failed to fetch use cases:', err);
      setError(err.message || 'Failed to load use cases. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load use cases on component mount
   */
  useEffect(() => {
    fetchUseCases();
  }, []);

  /**
   * Handle "Add Use Case" button click
   * Opens the modal for creating a new use case
   */
  const handleAddUseCase = () => {
    setModalOpen(true);
  };

  /**
   * Handle modal close
   */
  const handleModalClose = () => {
    setModalOpen(false);
  };

  /**
   * Handle successful use case creation
   */
  const handleSuccess = () => {
    setNotification({
      kind: 'success',
      title: 'Success',
      subtitle: 'Use case created successfully!',
      timeout: 5000
    });
    
    // Refresh the use cases list
    fetchUseCases();
  };

  // Show loading state
  if (loading) {
    return (
      <div className="demo-catalog">
        <Grid>
          <Column sm={4} md={8} lg={16}>
            <div className="catalog-header">
              <h2 className="catalog-title">Full demo catalog</h2>
              <Button
                kind="primary"
                renderIcon={Add}
                onClick={handleAddUseCase}
                size="md"
              >
                Add Use Case
              </Button>
            </div>
          </Column>
        </Grid>
        <LoadingState message="Loading use cases..." />
        <AddUseCaseModal
          open={modalOpen}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="demo-catalog">
        <Grid>
          <Column sm={4} md={8} lg={16}>
            <div className="catalog-header">
              <h2 className="catalog-title">Full demo catalog</h2>
              <Button
                kind="primary"
                renderIcon={Add}
                onClick={handleAddUseCase}
                size="md"
              >
                Add Use Case
              </Button>
            </div>
          </Column>
        </Grid>
        <EmptyState
          title="We couldn’t load the catalog"
          message={error}
          action={{
            label: 'Try Again',
            onClick: fetchUseCases
          }}
          secondaryAction={{
            label: 'Submit a Use Case',
            onClick: handleAddUseCase
          }}
        />
        <AddUseCaseModal
          open={modalOpen}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      </div>
    );
  }

  // Show empty state if no use cases
  if (useCases.length === 0) {
    return (
      <div className="demo-catalog">
        <Grid>
          <Column sm={4} md={8} lg={16}>
            <div className="catalog-header">
              <h2 className="catalog-title">Full demo catalog</h2>
              <Button
                kind="primary"
                renderIcon={Add}
                onClick={handleAddUseCase}
                size="md"
              >
                Add Use Case
              </Button>
            </div>
          </Column>
        </Grid>
        <EmptyState
          title="No published use cases yet"
          message="Start the catalog by sharing the first use case. New submissions appear here immediately once published."
          action={{
            label: 'Add Use Case',
            onClick: handleAddUseCase
          }}
        />
        <AddUseCaseModal
          open={modalOpen}
          onClose={handleModalClose}
          onSuccess={handleSuccess}
        />
      </div>
    );
  }

  return (
    <div className="demo-catalog">
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
          <div className="catalog-header">
            <h2 className="catalog-title">Full demo catalog</h2>
            <Button
              kind="primary"
              renderIcon={Add}
              onClick={handleAddUseCase}
              size="md"
            >
              Add Use Case
            </Button>
          </div>
        </Column>
      </Grid>

      <Grid>
        {useCases.map((useCase) => {
          // Get the icon component from the icon map, default to Code if not found
          const IconComponent = iconMap[useCase.icon] || Code;
          
          return (
            <Column key={useCase.id} sm={4} md={4} lg={5} className="demo-card-column">
              <Tile
                className="demo-card demo-card--clickable"
                onClick={() => navigate(`/publications/${useCase.id}`, { state: { fromCatalog: true } })}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/publications/${useCase.id}`, { state: { fromCatalog: true } });
                  }
                }}
              >
                <div className="demo-card-header">
                  <IconComponent size={32} className="demo-icon" />
                  <Tag type="green">
                    Published
                  </Tag>
                </div>
                <h3 className="demo-title">{useCase.title}</h3>
                <p className="demo-description">{useCase.description}</p>
                <div className="demo-tags">
                  {useCase.topics && useCase.topics.slice(0, 3).map((topic, index) => (
                    <Tag key={index} type="outline" size="sm">
                      {topic}
                    </Tag>
                  ))}
                </div>
              </Tile>
            </Column>
          );
        })}
      </Grid>

      <AddUseCaseModal
        open={modalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

export default DemoCatalog;

// Made with Bob
