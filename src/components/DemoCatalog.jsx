import { useState } from 'react';
import {
  Grid,
  Column,
  Tile,
  Tag,
  Button,
  Modal,
  TextInput,
  TextArea,
  MultiSelect,
  Checkbox
} from '@carbon/react';
import { Code, DataBase, ChartLine, Chat, CloudApp, Security, Add } from '@carbon/icons-react';
import './DemoCatalog.scss';

const demos = [
  {
    id: 1,
    title: 'Code Generation Demo',
    description: 'Explore how Bob can generate clean, efficient code across multiple programming languages with intelligent suggestions.',
    icon: Code,
    tags: ['AI', 'Code', 'Automation'],
    status: 'Available'
  },
  {
    id: 2,
    title: 'Data Analysis Demo',
    description: 'See Bob analyze complex datasets, generate insights, and create visualizations to help you make data-driven decisions.',
    icon: DataBase,
    tags: ['Analytics', 'Data', 'Insights'],
    status: 'Available'
  },
  {
    id: 3,
    title: 'Chart Visualization Demo',
    description: 'Discover how Bob creates interactive charts and dashboards using Carbon Charts for compelling data storytelling.',
    icon: ChartLine,
    tags: ['Visualization', 'Charts', 'Dashboard'],
    status: 'Available'
  },
  {
    id: 4,
    title: 'AI Chat Integration',
    description: 'Experience conversational AI with Bob\'s chat interface, powered by Carbon AI Chat components for seamless interactions.',
    icon: Chat,
    tags: ['AI', 'Chat', 'Conversation'],
    status: 'New'
  },
  {
    id: 5,
    title: 'Cloud Deployment Demo',
    description: 'Learn how Bob streamlines cloud deployments with automated workflows and infrastructure management.',
    icon: CloudApp,
    tags: ['Cloud', 'DevOps', 'Automation'],
    status: 'Available'
  },
  {
    id: 6,
    title: 'Security Analysis Demo',
    description: 'See how Bob identifies security vulnerabilities and suggests best practices to keep your applications secure.',
    icon: Security,
    tags: ['Security', 'Analysis', 'Best Practices'],
    status: 'Coming Soon'
  }
];

const topicOptions = [
  { id: 'ai', label: 'AI' },
  { id: 'code', label: 'Code' },
  { id: 'automation', label: 'Automation' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'data', label: 'Data' },
  { id: 'insights', label: 'Insights' },
  { id: 'visualization', label: 'Visualization' },
  { id: 'charts', label: 'Charts' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'chat', label: 'Chat' },
  { id: 'conversation', label: 'Conversation' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'devops', label: 'DevOps' },
  { id: 'security', label: 'Security' },
  { id: 'best-practices', label: 'Best Practices' }
];

const audienceOptions = [
  { id: 'developers', label: 'Developers' },
  { id: 'data-scientists', label: 'Data Scientists' },
  { id: 'business-analysts', label: 'Business Analysts' },
  { id: 'devops-engineers', label: 'DevOps Engineers' },
  { id: 'security-professionals', label: 'Security Professionals' },
  { id: 'executives', label: 'Executives' }
];

const industryOptions = [
  { id: 'finance', label: 'Finance' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'retail', label: 'Retail' },
  { id: 'manufacturing', label: 'Manufacturing' },
  { id: 'technology', label: 'Technology' },
  { id: 'telecommunications', label: 'Telecommunications' },
  { id: 'energy', label: 'Energy' },
  { id: 'government', label: 'Government' }
];

function DemoCatalog() {
  const [demoList, setDemoList] = useState(demos);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    topics: [],
    audience: [],
    gitSource: '',
    boxSource: '',
    industries: []
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    const newDemo = {
      id: demoList.length + 1,
      title: formData.title,
      description: formData.description,
      icon: Code, // Default icon
      tags: formData.topics.map(t => t.label),
      status: 'New',
      audience: formData.audience.map(a => a.label),
      sources: {
        git: formData.gitSource,
        box: formData.boxSource
      },
      industries: formData.industries.map(i => i.label)
    };

    setDemoList([...demoList, newDemo]);
    setIsModalOpen(false);
    setFormData({
      title: '',
      description: '',
      topics: [],
      audience: [],
      gitSource: '',
      boxSource: '',
      industries: []
    });
  };

  return (
    <div className="demo-catalog">
      <Grid>
        <Column sm={4} md={8} lg={16}>
          <div className="catalog-header">
            <h2 className="catalog-title">Available Demos</h2>
            <Button
              kind="primary"
              renderIcon={Add}
              onClick={() => setIsModalOpen(true)}
            >
              Add Use Case
            </Button>
          </div>
        </Column>
      </Grid>

      <Grid>
        {demoList.map((demo) => {
          const IconComponent = demo.icon;
          return (
            <Column key={demo.id} sm={4} md={4} lg={5} className="demo-card-column">
              <Tile className="demo-card">
                <div className="demo-card-header">
                  <IconComponent size={32} className="demo-icon" />
                  <Tag type={demo.status === 'New' ? 'blue' : demo.status === 'Coming Soon' ? 'gray' : 'green'}>
                    {demo.status}
                  </Tag>
                </div>
                <h3 className="demo-title">{demo.title}</h3>
                <p className="demo-description">{demo.description}</p>
                <div className="demo-tags">
                  {demo.tags.map((tag, index) => (
                    <Tag key={index} type="outline" size="sm">
                      {tag}
                    </Tag>
                  ))}
                </div>
              </Tile>
            </Column>
          );
        })}
      </Grid>

      <Modal
        open={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        onRequestSubmit={handleSubmit}
        modalHeading="Add New Use Case"
        primaryButtonText="Add Use Case"
        secondaryButtonText="Cancel"
        size="lg"
      >
        <div className="use-case-form">
          <TextInput
            id="demo-title"
            labelText="Demo Title"
            placeholder="Enter demo title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            required
          />

          <TextArea
            id="demo-description"
            labelText="Description"
            placeholder="Enter demo description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            required
          />

          <MultiSelect
            id="demo-topics"
            titleText="Topics"
            label="Select topics"
            items={topicOptions}
            itemToString={(item) => (item ? item.label : '')}
            selectedItems={formData.topics}
            onChange={({ selectedItems }) => handleInputChange('topics', selectedItems)}
          />

          <MultiSelect
            id="demo-audience"
            titleText="Audience"
            label="Select target audience"
            items={audienceOptions}
            itemToString={(item) => (item ? item.label : '')}
            selectedItems={formData.audience}
            onChange={({ selectedItems }) => handleInputChange('audience', selectedItems)}
          />

          <TextInput
            id="git-source"
            labelText="Git Source"
            placeholder="Enter Git repository URL"
            value={formData.gitSource}
            onChange={(e) => handleInputChange('gitSource', e.target.value)}
          />

          <TextInput
            id="box-source"
            labelText="Box Source"
            placeholder="Enter Box folder URL"
            value={formData.boxSource}
            onChange={(e) => handleInputChange('boxSource', e.target.value)}
          />

          <MultiSelect
            id="demo-industries"
            titleText="Industries"
            label="Select industries"
            items={industryOptions}
            itemToString={(item) => (item ? item.label : '')}
            selectedItems={formData.industries}
            onChange={({ selectedItems }) => handleInputChange('industries', selectedItems)}
          />
        </div>
      </Modal>
    </div>
  );
}

export default DemoCatalog;

// Made with Bob
