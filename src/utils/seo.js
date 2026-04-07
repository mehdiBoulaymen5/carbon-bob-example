/**
 * SEO Utility Functions
 * 
 * Helper functions for managing page titles and meta tags.
 */

/**
 * Update page title
 * @param {string} title - Page title
 * @param {string} suffix - Optional suffix (default: "Bob Demo Catalog")
 */
export const updatePageTitle = (title, suffix = 'Bob Demo Catalog') => {
  document.title = title ? `${title} | ${suffix}` : suffix;
};

/**
 * Update meta description
 * @param {string} description - Meta description content
 */
export const updateMetaDescription = (description) => {
  let metaDescription = document.querySelector('meta[name="description"]');
  
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.name = 'description';
    document.head.appendChild(metaDescription);
  }
  
  metaDescription.content = description;
};

/**
 * Update meta keywords
 * @param {Array<string>} keywords - Array of keywords
 */
export const updateMetaKeywords = (keywords) => {
  if (!keywords || keywords.length === 0) return;
  
  let metaKeywords = document.querySelector('meta[name="keywords"]');
  
  if (!metaKeywords) {
    metaKeywords = document.createElement('meta');
    metaKeywords.name = 'keywords';
    document.head.appendChild(metaKeywords);
  }
  
  metaKeywords.content = keywords.join(', ');
};

/**
 * Update Open Graph meta tags
 * @param {Object} ogData - Open Graph data
 * @param {string} ogData.title - OG title
 * @param {string} ogData.description - OG description
 * @param {string} ogData.image - OG image URL
 * @param {string} ogData.url - OG URL
 */
export const updateOpenGraphTags = (ogData) => {
  const ogTags = {
    'og:title': ogData.title,
    'og:description': ogData.description,
    'og:image': ogData.image,
    'og:url': ogData.url,
    'og:type': 'website'
  };

  Object.entries(ogTags).forEach(([property, content]) => {
    if (!content) return;
    
    let metaTag = document.querySelector(`meta[property="${property}"]`);
    
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('property', property);
      document.head.appendChild(metaTag);
    }
    
    metaTag.content = content;
  });
};

/**
 * Set page SEO metadata
 * @param {Object} seoData - SEO data object
 * @param {string} seoData.title - Page title
 * @param {string} seoData.description - Page description
 * @param {Array<string>} seoData.keywords - Page keywords
 * @param {string} seoData.image - OG image URL
 * @param {string} seoData.url - Page URL
 */
export const setPageSEO = (seoData) => {
  if (seoData.title) {
    updatePageTitle(seoData.title);
  }
  
  if (seoData.description) {
    updateMetaDescription(seoData.description);
  }
  
  if (seoData.keywords) {
    updateMetaKeywords(seoData.keywords);
  }
  
  if (seoData.title || seoData.description || seoData.image || seoData.url) {
    updateOpenGraphTags({
      title: seoData.title,
      description: seoData.description,
      image: seoData.image,
      url: seoData.url
    });
  }
};

/**
 * Reset page SEO to defaults
 */
export const resetPageSEO = () => {
  updatePageTitle('');
  updateMetaDescription('Explore our collection of IBM Bob demonstrations and examples');
  updateMetaKeywords(['IBM', 'Bob', 'Demo', 'Catalog', 'AI', 'Demonstrations']);
};

// Made with Bob