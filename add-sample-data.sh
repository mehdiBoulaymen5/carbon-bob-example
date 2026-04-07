#!/bin/bash

echo "Adding sample publications to the database..."

# Get access token
echo "Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "Failed to login. Please make sure the server is running."
    exit 1
fi

echo "✓ Logged in successfully"
echo ""

# Create sample publications
echo "Creating sample publications..."

# Publication 1
curl -s -X POST http://localhost:3000/api/admin/publications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "title": "AI-Powered Code Generator",
    "description": "Demonstrate how Bob can generate production-ready code from natural language descriptions. Includes examples of React components, API endpoints, and database schemas.",
    "topics": ["AI", "Code Generation", "Automation"],
    "audience": ["Developers", "Tech Leads"],
    "industries": ["Technology", "Software Development"],
    "gitSource": "https://github.com/example/ai-code-gen",
    "boxSource": null,
    "icon": "Code",
    "status": "published",
    "metadata": {}
  }' > /dev/null

echo "✓ Created: AI-Powered Code Generator"

# Publication 2
curl -s -X POST http://localhost:3000/api/admin/publications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "title": "Data Analysis Dashboard",
    "description": "Interactive dashboard built with Bob showing real-time data visualization, analytics, and reporting capabilities. Perfect for business intelligence applications.",
    "topics": ["Data Analysis", "Visualization", "BI"],
    "audience": ["Data Analysts", "Business Users"],
    "industries": ["Finance", "Healthcare", "Retail"],
    "gitSource": "https://github.com/example/data-dashboard",
    "boxSource": null,
    "icon": "Dashboard",
    "status": "published",
    "metadata": {}
  }' > /dev/null

echo "✓ Created: Data Analysis Dashboard"

# Publication 3
curl -s -X POST http://localhost:3000/api/admin/publications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "title": "Chatbot Integration Demo",
    "description": "Full-featured chatbot implementation using Bob AI capabilities. Includes natural language processing, context awareness, and multi-turn conversations.",
    "topics": ["AI", "Chatbot", "NLP"],
    "audience": ["Developers", "Product Managers"],
    "industries": ["Customer Service", "E-commerce"],
    "gitSource": "https://github.com/example/chatbot-demo",
    "boxSource": null,
    "icon": "Chat",
    "status": "published",
    "metadata": {}
  }' > /dev/null

echo "✓ Created: Chatbot Integration Demo"

# Publication 4
curl -s -X POST http://localhost:3000/api/admin/publications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "title": "Document Processing Pipeline",
    "description": "Automated document processing system that extracts, analyzes, and categorizes information from various document formats using Bob AI.",
    "topics": ["Document Processing", "OCR", "Automation"],
    "audience": ["Enterprise Users", "Developers"],
    "industries": ["Legal", "Finance", "Healthcare"],
    "gitSource": "https://github.com/example/doc-processing",
    "boxSource": null,
    "icon": "Document",
    "status": "published",
    "metadata": {}
  }' > /dev/null

echo "✓ Created: Document Processing Pipeline"

# Publication 5
curl -s -X POST http://localhost:3000/api/admin/publications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "title": "API Testing Framework",
    "description": "Comprehensive API testing framework built with Bob. Includes automated test generation, performance testing, and detailed reporting.",
    "topics": ["Testing", "API", "Quality Assurance"],
    "audience": ["QA Engineers", "Developers"],
    "industries": ["Technology", "Software Development"],
    "gitSource": "https://github.com/example/api-testing",
    "boxSource": null,
    "icon": "TestTool",
    "status": "published",
    "metadata": {}
  }' > /dev/null

echo "✓ Created: API Testing Framework"

# Publication 6
curl -s -X POST http://localhost:3000/api/admin/publications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "title": "E-commerce Recommendation Engine",
    "description": "AI-powered recommendation system for e-commerce platforms. Uses machine learning to provide personalized product suggestions based on user behavior.",
    "topics": ["AI", "E-commerce", "Machine Learning"],
    "audience": ["Product Managers", "Data Scientists"],
    "industries": ["E-commerce", "Retail"],
    "gitSource": "https://github.com/example/recommendation-engine",
    "boxSource": null,
    "icon": "ShoppingCart",
    "status": "published",
    "metadata": {}
  }' > /dev/null

echo "✓ Created: E-commerce Recommendation Engine"

echo ""
echo "=========================================="
echo "✓ Successfully created 6 sample publications!"
echo "=========================================="
echo ""
echo "Refresh your browser to see the publications:"
echo "  Frontend: http://localhost:5173/"
echo "  Admin:    http://localhost:5173/admin/dashboard"
echo ""

# Made with Bob
