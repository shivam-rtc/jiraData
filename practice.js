const express = require('express');
const cors = require('cors');
require('dotenv').config();
const JiraClient = require('jira-client');
const { Parser } = require('json2csv');

// Initialize express app
const app = express();

// Middleware
app.use(cors({
  origin: '*',  // Be more specific in production
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure Jira client
const jira = new JiraClient({
  protocol: 'https',
  host: process.env.JIRA_HOST,
  username: process.env.JIRA_USERNAME,
  password: process.env.JIRA_API_TOKEN,
  apiVersion: '2',
  strictSSL: true
});

// Endpoint to fetch Zephyr test cases
app.get('/api/testcases', async (req, res) => {
  try {
   
    const jqlQuery = 'issuetype = "Test" ORDER BY created DESC';
    
    const testCases = await jira.searchJira(jqlQuery,{
        
            maxResults: 1000,
            fields: [
              'key',
              'summary',
              'description',
              'status',
              'priority',
              'created',
              'updated',
              'assignee',
              'project',
              'customfield_10006', // Adjust this ID based on your Zephyr execution status field
              'customfield_10007'  // Adjust this ID for any other custom fields you need
            ]
          
    });
    // Transform test cases data
    // const formattedTestCases = testCases.issues.map(issue => ({
    //   testCaseId: issue.key,
    //   summary: issue.fields.summary,
    //   description: issue.fields.description,
    //   status: issue.fields.status.name,
    //   priority: issue.fields.priority?.name,
    //   created: issue.fields.created,
    //   updated: issue.fields.updated,
    //   assignee: issue.fields.assignee?.displayName,
    //   project: issue.fields.project.name
    // }));

    const formattedTestCases = testCases.issues.map(issue => ({
        testCaseId: issue.key,
        summary: issue.fields.summary,
        description: issue.fields.description,
        status: issue.fields.status.name,
        executionStatus: issue.fields.customfield_10006?.value || 'Not Executed', // Adjust field ID
        priority: issue.fields.priority?.name,
        created: issue.fields.created,
        updated: issue.fields.updated,
        assignee: issue.fields.assignee?.displayName,
        project: issue.fields.project.name
      }));

    // Handle different response formats
    const format = req.query.format || 'json';
    
    if (format === 'csv') {
      const fields = ['testCaseId', 'summary', 'status', 'priority', 'created', 'updated', 'assignee', 'project'];
      const parser = new Parser({ fields });
      const csv = parser.parse(formattedTestCases);
      
      res.header('Content-Type', 'text/csv');
      res.attachment('test-cases.csv');
      return res.send(csv);
    }

    res.json(formattedTestCases);
  } catch (error) {
    console.error('Error fetching test cases:', error);
    res.status(500).json({ error: 'Failed to fetch test cases' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 