/**
 * PublicationCard Component
 * 
 * Reusable card component for displaying publication preview.
 * Uses Carbon ClickableTile for interactive card behavior.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClickableTile, Tag } from '@carbon/react';
import { Document, ArrowRight } from '@carbon/icons-react';
import './PublicationCard.scss';

/**
 * PublicationCard component
 * @param {Object} props - Component props
 * @param {Object} props.publication - Publication data
 * @param {string} props.publication.id - Publication ID
 * @param {string} props.publication.title - Publication title
 * @param {string} props.publication.description - Publication description
 * @param {Array<string>} props.publication.topics - Publication topics
 * @param {string} props.publication.icon_url - Publication icon URL (optional)
 * @returns {React.ReactElement} Publication card
 */
const PublicationCard = ({ publication }) => {
  const navigate = useNavigate();

  /**
   * Handle card click - navigate to publication detail
   */
  const handleClick = () => {
    navigate(`/publications/${publication.id}`);
  };

  /**
   * Truncate description to specified length
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  const truncateText = (text, maxLength = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <ClickableTile
      className="publication-card"
      onClick={handleClick}
      aria-label={`View details for ${publication.title}`}
    >
      <div className="publication-card__header">
        <div className="publication-card__icon">
          {publication.icon_url ? (
            <img 
              src={publication.icon_url} 
              alt="" 
              className="publication-card__icon-image"
            />
          ) : (
            <Document size={32} />
          )}
        </div>
        <ArrowRight size={20} className="publication-card__arrow" />
      </div>

      <h3 className="publication-card__title">{publication.title}</h3>
      
      <p className="publication-card__description">
        {truncateText(publication.description)}
      </p>

      {publication.topics && publication.topics.length > 0 && (
        <div className="publication-card__topics">
          {publication.topics.slice(0, 3).map((topic, index) => (
            <Tag key={index} type="outline" size="sm">
              {topic}
            </Tag>
          ))}
          {publication.topics.length > 3 && (
            <Tag type="outline" size="sm">
              +{publication.topics.length - 3}
            </Tag>
          )}
        </div>
      )}
    </ClickableTile>
  );
};

export default PublicationCard;

// Made with Bob