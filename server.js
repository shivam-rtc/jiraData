// const express = require('express');
// const cors = require('cors');
// require('dotenv').config();
// const JiraClient = require('jira-client');
// const { Parser } = require('json2csv');
// const fetch = require('node-fetch');
// const jwt = require('jsonwebtoken');

// // Initialize express app
// const app = express();

// // Middleware
// app.use(cors({
//   origin: '*',  // Be more specific in production
//   methods: ['GET', 'POST'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Configure Jira client
// const jira = new JiraClient({
//   protocol: 'https',
//   host: process.env.JIRA_HOST,
//   username: process.env.JIRA_USERNAME,
//   password: process.env.JIRA_API_TOKEN,
//   apiVersion: '2',
//   strictSSL: true
// });

// console.log("jira",jira);


// // Endpoint to fetch Zephyr test cases
// app.get('/api/zephyr-testcases', async (req, res) => {
//   try {
//     const response = await fetch(
//       'https://prod-play.zephyr4jiracloud.com/connect/backend/rest/tests/2.0/testcase/search',
//       {
//         method: 'GET',
//         headers: {
//           'Accept': 'application/json',
//           'Authorization': `JWT ${process.env.ZEPHYR_JWT_TOKEN}`,
//           'Jira-Project-Id': '10000',
//           'X-Squad-Request': 'true',
//           'Referer': 'https://prod-play.zephyr4jiracloud.com/'
//         },
//         // Convert params object to URL search params
//         query: new URLSearchParams({
//           fields: [
//             'id',
//             'key',
//             'projectId',
//             'name',
//             'labels',
//             'folderId',
//             'status(name)',
//             'priority(name)',
//             'lastTestResultStatus(name)',
//           ].join(','),
//           query: 'testCase.projectId IN (10000, 10001) ORDER BY testCase.name ASC',
//           startAt: '0',
//           maxResults: '50',
//           archived: 'false'
//         }).toString()
//       }
//     );

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.log('Zephyr API Error:', {
//         status: response.status,
//         statusText: response.statusText,
//         error: errorText,
//         url: response.url
//       });
//       throw new Error(`Failed to fetch test cases: ${response.status}`);
//     }

//     const data = await response.json();
//     console.log('Test cases found:', data);

//     // Transform the data
//     const formattedTestCases = data.values.map(testCase => ({
//       id: testCase.id,
//       key: testCase.key,
//       name: testCase.name,
//       status: testCase.status?.name || 'Not Started',
//       priority: testCase.priority?.name || 'Not Set',
//       lastTestResult: testCase.lastTestResultStatus?.name || 'No Result',
//       createdBy: testCase.createdBy,
//       createdOn: testCase.createdOn,
//       updatedBy: testCase.updatedBy,
//       updatedOn: testCase.updatedOn,
//       owner: testCase.owner,
//       labels: testCase.labels || [],
//       estimatedTime: testCase.estimatedTime,
//       averageTime: testCase.averageTime
//     }));

//     // Handle response format
//     const format = req.query.format || 'json';
    
//     if (format === 'csv') {
//       const fields = [
//         'id', 
//         'key', 
//         'name', 
//         'status', 
//         'priority',
//         'lastTestResult',
//         'createdBy', 
//         'createdOn', 
//         'updatedBy', 
//         'updatedOn', 
//         'owner',
//         'labels',
//         'estimatedTime',
//         'averageTime'
//       ];
//       const parser = new Parser({ fields });
//       const csv = parser.parse(formattedTestCases);
      
//       res.header('Content-Type', 'text/csv');
//       res.attachment('zephyr-test-cases.csv');
//       return res.send(csv);
//     }

//     res.json(formattedTestCases);

//   } catch (error) {
//     console.error('Error fetching test cases:', error);
//     res.status(500).json({ 
//       error: 'Failed to fetch test cases',
//       details: error.message 
//     });
//   }
// });


// // Add this diagnostic endpoint to help identify custom fields
// app.get('/api/field-config', async (req, res) => {
//   try {
//     const baseUrl = `https://${process.env.JIRA_HOST}`;
//     const authToken = Buffer.from(
//       `${process.env.JIRA_USERNAME}:${process.env.JIRA_API_TOKEN}`
//     ).toString('base64');

//     // Get all field configurations
//     const fieldsResponse = await fetch(`${baseUrl}/rest/api/3/field`, {
//       method: 'GET',
//       headers: {
//         'Authorization': `Basic ${authToken}`,
//         'Accept': 'application/json'
//       }
//     });

//     if (!fieldsResponse.ok) {
//       throw new Error(`Failed to fetch fields: ${fieldsResponse.status}`);
//     }

//     const fields = await fieldsResponse.json();
    
//     // Filter for test-related fields
//     const testFields = fields.filter(field => 
//       field.name.toLowerCase().includes('test') ||
//       field.name.toLowerCase().includes('zephyr') ||
//       field.name.toLowerCase().includes('execution')
//     );

//     res.json(testFields);
//   } catch (error) {
//     console.error('Field config error:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// // Add diagnostic endpoint
// app.get('/api/zephyr-debug', async (req, res) => {
//   try {
//     const baseUrl = `https://${process.env.JIRA_HOST}/rest/zapi/latest`;
//     const authToken = Buffer.from(
//       `${process.env.JIRA_USERNAME}:${process.env.JIRA_API_TOKEN}`
//     ).toString('base64');

//     // Test basic endpoints
//     const endpoints = [
//       '/cycle',
//       '/execution',
//       '/zql/executeSearch'
//     ];

//     const results = {};

//     for (const endpoint of endpoints) {
//       const url = `${baseUrl}${endpoint}`;
//       console.log(`Testing endpoint: ${url}`);
      
//       const response = await fetch(url, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Basic ${authToken}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       results[endpoint] = {
//         status: response.status,
//         statusText: response.statusText,
//         headers: Object.fromEntries(response.headers),
//         data: response.ok ? await response.json() : await response.text()
//       };
//     }

//     res.json(results);
//   } catch (error) {
//     console.error('Debug endpoint error:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// // Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// }); 