import OpenAI from 'openai';
import { WebSocketServer } from "ws"
import { object, string, z } from "zod"
import dotenv from "dotenv"

dotenv.config()

const wss = new WebSocketServer({ port: 8080 });


const openrouter = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1"
});


const ProjectAnalysisSchema = z.object({
  project: z.object({
    name: z.string(),
    description: z.string()
  }),
  features: z.array(z.string()),
  overall_structure: z.object({
    architecture: z.string(),
    file_structure: z.object({
      root: z.array(z.string())
    }),
    user_flow: z.string()
  }),
  frontend: z.object({
    technologies: z.array(z.string()),
    components: z.record(z.object({
      description: z.string(),
      interactions: z.string().nullable(),
      layout: z.string().nullable()
    })),
    requirements: z.array(z.string())
  }),
  backend: z.object({
    needed: z.boolean(),
    description: z.string(),
    optional_extensions: z.array(z.string()).nullable()
  }),
  deployment_notes: z.string(),
  references: z.array(z.string())
});

const FrontendSchema = z.object({
  components: z.array(z.object({
    name: z.string(),
    code: z.string(),
    description: z.string(),
    dependencies: z.array(z.string())
  })),
  styling: z.object({
    framework: z.string(),
    custom_css: z.string(),
    responsive_design: z.string()
  }),
  state_management: z.object({
    approach: z.string(),
    implementation: z.string()
  }),
  setup_instructions: z.array(z.string())
});

const BackendSchema = z.object({
  api_endpoints: z.array(z.object({
    method: z.string(),
    path: z.string(),
    description: z.string(),
    code: z.string()
  })),
  database: z.object({
    type: z.string(),
    schema: z.string(),
    connection_code: z.string()
  }),
  authentication: z.object({
    method: z.string(),
    implementation: z.string()
  }),
  server_setup: z.string(),
  deployment_config: z.string()
});

const DocumentationSchema = z.object({
  readme: z.object({
    title: z.string(),
    description: z.string(),
    installation: z.array(z.string()),
    usage: z.string(),
    api_documentation: z.string(),
    contributing: z.string()
  }),
  setup_guide: z.object({
    prerequisites: z.array(z.string()),
    environment_setup: z.array(z.string()),
    configuration: z.string(),
    troubleshooting: z.array(z.object({
      issue: z.string(),
      solution: z.string()
    }))
  }),
  code_documentation: z.array(z.object({
    file: z.string(),
    description: z.string(),
    functions: z.array(z.object({
      name: z.string(),
      purpose: z.string(),
      parameters: z.string(),
      returns: z.string()
    }))
  })),
  deployment_guide: z.string()
});


function extractJSON(text: string): any {
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[0]);
        } catch (e) {
            
            let cleaned = jsonMatch[0]
                .replace(/```json/g, '')
                .replace(/```/g, '')
                .replace(/\n\s*\/\/.*$/gm, '') 
                .trim();
            
            return JSON.parse(cleaned);
        }
    }
    throw new Error("No valid JSON found in response");
}

function createFallbackAnalysis(userMessage: string): any {
    return {
        project: {
            name: "Generated Project",
            description: userMessage || "Project generated from user request"
        },
        features: ["Basic functionality", "User interface", "Core features"],
        overall_structure: {
            architecture: "Standard web application architecture",
            file_structure: {
                root: ["src/", "public/", "package.json", "README.md"]
            },
            user_flow: "User interacts with frontend, which communicates with backend"
        },
        frontend: {
            technologies: ["React", "HTML", "CSS", "JavaScript"],
            components: {
                "App": {
                    description: "Main application component",
                    interactions: "Root component that renders other components",
                    layout: "Standard application layout"
                }
            },
            requirements: ["Modern web browser", "Node.js for development"]
        },
        backend: {
            needed: true,
            description: "RESTful API server with database integration",
            optional_extensions: ["Authentication", "Real-time features", "File upload"]
        },
        deployment_notes: "Can be deployed to various cloud platforms",
        references: ["React documentation", "Node.js guides", "Best practices"]
    };
}

wss.on("connection", function connection(ws) {
    console.log("connected");
   
    ws.on("message", async function message(data) {
        try {
            const messageStr = data.toString();
            console.log("Received:", messageStr);
            
            // Step 1: Coordinator Agent
            ws.send(JSON.stringify({
                type: 'status',
                message: 'Analyzing project requirements...'
            }));
            
            const analysis = await CoordinatorAgent(messageStr);
            
            ws.send(JSON.stringify({
                type: 'analysis_complete',
                content: analysis
            }));
            
            let frontendResult = null;
            let backendResult = null;
            
            // Step 2: Frontend Agent with streaming
            if (analysis.frontend && analysis.frontend.technologies.length > 0) {
                ws.send(JSON.stringify({
                    type: 'status',
                    message: 'Generating frontend code...'
                }));
                
                frontendResult = await FrontendAgentStreaming(analysis, ws);
            }
            
            // Step 3: Backend Agent with streaming
            if (analysis.backend && analysis.backend.needed) {
                ws.send(JSON.stringify({
                    type: 'status',
                    message: 'Generating backend code...'
                }));
                
                backendResult = await BackendAgentStreaming(analysis, ws);
            }
            
            // Step 4: Documentation Agent
            ws.send(JSON.stringify({
                type: 'status',
                message: 'Generating documentation...'
            }));
            
            const documentationResult = await DocumentationAgentStreaming(analysis, frontendResult, backendResult, ws);
            
            ws.send(JSON.stringify({
                type: 'all_complete',
                message: 'Project generation completed!',
                summary: {
                    analysis,
                    frontend: frontendResult,
                    backend: backendResult,
                    documentation: documentationResult
                }
            }));
           
        } catch (error:any) {
            console.error("Error:", error);
            ws.send(JSON.stringify({
                type: 'error',
                message: error.message
            }));
        }
    });

    // Coordinator Agent with better error handling
    async function CoordinatorAgent(messages: string): Promise<any> {
        try {
            const systemPrompt = `You are a senior project coordinator. Analyze user requests and create comprehensive project breakdowns.

            CRITICAL: You MUST respond with ONLY valid JSON in this EXACT format:

            {
              "project": {
                "name": "Project Name Here",
                "description": "Detailed project description"
              },
              "features": ["feature1", "feature2", "feature3"],
              "overall_structure": {
                "architecture": "Architecture description",
                "file_structure": {
                  "root": ["file1.js", "folder1/", "file2.html"]
                },
                "user_flow": "How users interact with the application"
              },
              "frontend": {
                "technologies": ["React", "CSS", "JavaScript"],
                "components": {
                  "ComponentName": {
                    "description": "What this component does",
                    "interactions": "How it interacts with other components",
                    "layout": "Layout description"
                  }
                },
                "requirements": ["requirement1", "requirement2"]
              },
              "backend": {
                "needed": true,
                "description": "Backend description",
                "optional_extensions": ["extension1", "extension2"]
              },
              "deployment_notes": "Deployment information",
              "references": ["reference1", "reference2"]
            }

            NO other text. NO markdown. NO explanations. ONLY the JSON object.`;

            const response = await openrouter.chat.completions.create({
                model: "x-ai/grok-4-fast:free",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: messages }
                ],
                temperature: 0.3,
                max_tokens: 2000
            });
            
            const content = response.choices[0]?.message?.content?.trim();
            
            if (!content) {
                console.warn("Empty response from coordinator, using fallback");
                return createFallbackAnalysis(messages);
            }
            
            console.log("Raw coordinator response:", content);
            
            try {
                // Try to extract and parse JSON
                const jsonData = extractJSON(content);
                
                // Validate against schema
                const validatedData = ProjectAnalysisSchema.parse(jsonData);
                return validatedData;
                
            } catch (parseError) {
                console.warn("JSON parsing failed, using fallback:", parseError);
                return createFallbackAnalysis(messages);
            }
            
        } catch (error) {
            console.error("Coordinator Agent Error:", error);
            // Return fallback instead of throwing
            return createFallbackAnalysis(messages);
        }
    }

    // Frontend Agent with streaming and better error handling
    async function FrontendAgentStreaming(analysis: any, ws: any) {
        try {
            const frontendPrompt = `Based on this project analysis, create complete frontend implementation:

            Project: ${analysis.project.name}
            Description: ${analysis.project.description}
            Frontend Technologies: ${analysis.frontend.technologies.join(', ')}

            You MUST respond with valid JSON in this format:
            {
              "components": [
                {
                  "name": "ComponentName",
                  "code": "Complete React component code here",
                  "description": "What this component does",
                  "dependencies": ["dependency1", "dependency2"]
                }
              ],
              "styling": {
                "framework": "CSS framework used",
                "custom_css": "Custom CSS code",
                "responsive_design": "Responsive design approach"
              },
              "state_management": {
                "approach": "State management approach",
                "implementation": "Implementation details"
              },
              "setup_instructions": ["step1", "step2", "step3"]
            }

            Generate complete, working React components with proper structure. NO markdown, only JSON.`;

            const stream = await openrouter.chat.completions.create({
                model: "x-ai/grok-4-fast:free",
                messages: [
                    {
                        role: "system",
                        content: `You are a senior frontend developer. Generate production-ready React code.
                        Respond with ONLY valid JSON. No markdown, no explanations, just the JSON object.`
                    },
                    { role: "user", content: frontendPrompt }
                ],
                stream: true,
                temperature: 0.3
            });

            let fullContent = '';
            
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    fullContent += content;
                    
                    // Send streaming update
                    ws.send(JSON.stringify({
                        type: 'frontend_stream',
                        content: content,
                        accumulated: fullContent
                    }));
                }
            }
            
            // Parse final result
            try {
                const jsonData = extractJSON(fullContent.trim());
                const validatedResult = FrontendSchema.parse(jsonData);
                
                ws.send(JSON.stringify({
                    type: 'frontend_complete',
                    content: validatedResult
                }));
                
                return validatedResult;
            } catch (parseError) {
                console.warn("Frontend parsing failed, using fallback");
                // Enhanced fallback with basic React component
                const fallbackResult = {
                    components: [{
                        name: "App",
                        code: `import React, { useState } from 'react';
                        import './App.css';

                        function App() {
                          const [count, setCount] = useState(0);

                          return (
                            <div className="App">
                              <header className="App-header">
                                <h1>${analysis.project.name}</h1>
                                <p>${analysis.project.description}</p>
                                <button onClick={() => setCount(count + 1)}>
                                  Count: {count}
                                </button>
                              </header>
                            </div>
                          );
                        }

                        export default App;`,
                                                description: "Main application component",
                                                dependencies: ["react"]
                                            }],
                                            styling: {
                                                framework: "CSS",
                                                custom_css: `.App { text-align: center; padding: 20px; }
                        .App-header { background-color: #282c34; color: white; padding: 20px; border-radius: 8px; }`,
                        responsive_design: "Mobile-first responsive design"
                    },
                    state_management: {
                        approach: "React useState",
                        implementation: "Using React hooks for local state management"
                    },
                    setup_instructions: ["npm install", "npm start"]
                };
                
                ws.send(JSON.stringify({
                    type: 'frontend_complete',
                    content: fallbackResult
                }));
                
                return fallbackResult;
            }
            
        } catch (error) {
            console.error("Frontend Agent Error:", error);
            throw error;
        }
    }

    // Backend Agent with streaming and better error handling
    async function BackendAgentStreaming(analysis: any, ws: any) {
        try {
            const backendPrompt = `Based on this project analysis, create complete backend implementation:

              Project: ${analysis.project.name}
              Description: ${analysis.project.description}
              Backend Description: ${analysis.backend.description}

              You MUST respond with valid JSON in this format:
              {
                "api_endpoints": [
                  {
                    "method": "GET",
                    "path": "/api/endpoint",
                    "description": "Endpoint description",
                    "code": "Complete Express.js route code"
                  }
                ],
                "database": {
                  "type": "Database type",
                  "schema": "Database schema definition",
                  "connection_code": "Database connection code"
                },
                "authentication": {
                  "method": "Authentication method",
                  "implementation": "Auth implementation code"
                },
                "server_setup": "Complete server setup code",
                "deployment_config": "Deployment configuration"
              }

              Generate complete Node.js/Express code. NO markdown, only JSON.`;

            const stream = await openrouter.chat.completions.create({
                model: "x-ai/grok-4-fast:free",
                messages: [
                    {
                        role: "system",
                        content: `You are a senior backend developer. Generate production-ready Node.js code.
                        Respond with ONLY valid JSON. No markdown, no explanations.`
                    },
                    { role: "user", content: backendPrompt }
                ],
                stream: true,
                temperature: 0.3
            });

            let fullContent = '';
            
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    fullContent += content;
                    
                    ws.send(JSON.stringify({
                        type: 'backend_stream',
                        content: content,
                        accumulated: fullContent
                    }));
                }
            }
            
            try {
                const jsonData = extractJSON(fullContent.trim());
                const validatedResult = BackendSchema.parse(jsonData);
                
                ws.send(JSON.stringify({
                    type: 'backend_complete',
                    content: validatedResult
                }));
                
                return validatedResult;
            } catch (parseError) {
                console.warn("Backend parsing failed, using fallback");
                const fallbackResult = {
                    api_endpoints: [{
                        method: "GET",
                        path: "/api/health",
                        description: "Health check endpoint",
                        code: `app.get('/api/health', (req, res) => {
                          res.json({ status: 'OK', message: 'Server is running' });
                      });`
                    }],
                    database: {
                        type: "MongoDB",
                        schema: "Basic schema for the application",
                        connection_code: `const mongoose = require('mongoose');
                          mongoose.connect('mongodb://localhost:27017/database');`
                    },
                    authentication: {
                        method: "JWT",
                        implementation: "Basic JWT authentication setup"
                    },
                    server_setup: `const express = require('express');
                      const app = express();
                      const PORT = process.env.PORT || 3000;

                      app.use(express.json());

                      app.listen(PORT, () => {
                        console.log(\`Server running on port \${PORT}\`);
                      });`,
                      deployment_config: "Configure environment variables and deploy to cloud platform"
                };
                
                ws.send(JSON.stringify({
                    type: 'backend_complete',
                    content: fallbackResult
                }));
                
                return fallbackResult;
            }
            
        } catch (error) {
            console.error("Backend Agent Error:", error);
            throw error;
        }
    }

    // Documentation Agent with streaming
    async function DocumentationAgentStreaming(analysis: any, frontendResult: any, backendResult: any, ws: any) {
        try {
            const docPrompt = `Generate comprehensive documentation for this project:

            PROJECT: ${analysis.project.name}
            DESCRIPTION: ${analysis.project.description}

            Create documentation in this JSON format:
            {
              "readme": {
                "title": "Project title",
                "description": "Project description",
                "installation": ["installation steps"],
                "usage": "How to use the project",
                "api_documentation": "API documentation",
                "contributing": "Contributing guidelines"
              },
              "setup_guide": {
                "prerequisites": ["prerequisite1", "prerequisite2"],
                "environment_setup": ["setup step 1", "setup step 2"],
                "configuration": "Configuration details",
                "troubleshooting": [{"issue": "Common issue", "solution": "Solution"}]
              },
              "code_documentation": [
                {
                  "file": "filename.js",
                  "description": "File description",
                  "functions": [{"name": "functionName", "purpose": "What it does", "parameters": "Parameters", "returns": "Return value"}]
                }
              ],
              "deployment_guide": "Deployment instructions"
            }

            NO markdown, only JSON.`;

            const stream = await openrouter.chat.completions.create({
                model: "x-ai/grok-4-fast:free",
                messages: [
                    {
                        role: "system",
                        content: `You are a technical documentation specialist. Create comprehensive documentation.
                        Respond with ONLY valid JSON.`
                    },
                    { role: "user", content: docPrompt }
                ],
                stream: true,
                temperature: 0.3
            });

            let fullContent = '';
            
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    fullContent += content;
                    
                    ws.send(JSON.stringify({
                        type: 'documentation_stream',
                        content: content,
                        accumulated: fullContent
                    }));
                }
            }
            
            try {
                const jsonData = extractJSON(fullContent.trim());
                const validatedResult = DocumentationSchema.parse(jsonData);
                
                ws.send(JSON.stringify({
                    type: 'documentation_complete',
                    content: validatedResult
                }));
                
                return validatedResult;
            } catch (parseError) {
                console.warn("Documentation parsing failed, using fallback");
                const fallbackResult = {
                    readme: {
                        title: analysis.project.name,
                        description: analysis.project.description,
                        installation: ["npm install", "npm start"],
                        usage: "Follow the setup instructions and start the development server",
                        api_documentation: "API endpoints are documented in the code",
                        contributing: "Please follow standard GitHub contribution guidelines"
                    },
                    setup_guide: {
                        prerequisites: ["Node.js", "npm", "Git"],
                        environment_setup: ["Clone the repository", "Install dependencies", "Configure environment variables"],
                        configuration: "Set up your environment variables and database connections",
                        troubleshooting: [
                            {issue: "Port already in use", solution: "Change the port in your configuration"},
                            {issue: "Module not found", solution: "Run npm install to install dependencies"}
                        ]
                    },
                    code_documentation: [
                        {
                            file: "app.js",
                            description: "Main application file",
                            functions: [
                                {
                                    name: "main",
                                    purpose: "Initialize and start the application",
                                    parameters: "None",
                                    returns: "Application instance"
                                }
                            ]
                        }
                    ],
                    deployment_guide: "Deploy to your preferred cloud platform (Vercel, Netlify, Heroku, etc.)"
                };
                
                ws.send(JSON.stringify({
                    type: 'documentation_complete',
                    content: fallbackResult
                }));
                
                return fallbackResult;
            }
            
        } catch (error) {
            console.error("Documentation Agent Error:", error);
            throw error;
        }
    }
});