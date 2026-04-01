import { Grid, Column, Tile, Tag } from '@carbon/react';
import { Code, DataBase, ChartLine, Chat, CloudApp, Security } from '@carbon/icons-react';
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

function DemoCatalog() {
  return (
    <div className="demo-catalog">
      <Grid>
        <Column sm={4} md={8} lg={16}>
          <h2 className="catalog-title">Available Demos</h2>
        </Column>
      </Grid>

      <Grid>
        {demos.map((demo) => {
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
    </div>
  );
}

export default DemoCatalog;

// Made with Bob
