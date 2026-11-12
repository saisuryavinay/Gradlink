/**
 * skillsData.js — GradLink predefined skills catalogue
 *
 * Organised by category for readability. The exported flat array
 * `ALL_SKILLS` is what the autocomplete searches against.
 */

export const SKILLS_BY_CATEGORY = {
  'Programming Languages': [
    'Java', 'Python', 'C', 'C++', 'JavaScript', 'TypeScript',
    'C#', 'PHP', 'Go', 'Rust', 'Kotlin', 'Swift', 'R', 'MATLAB',
    'Scala', 'Perl', 'Ruby', 'Dart', 'Haskell', 'Lua',
  ],
  'Frontend Development': [
    'HTML', 'CSS', 'React.js', 'Angular', 'Vue.js', 'Next.js',
    'Nuxt.js', 'Svelte', 'Bootstrap', 'Tailwind CSS', 'Redux',
    'Webpack', 'Vite', 'SASS/SCSS', 'jQuery', 'Material UI',
    'Ant Design', 'Framer Motion', 'Three.js', 'React Native',
  ],
  'Backend Development': [
    'Node.js', 'Express.js', 'Spring Boot', 'Django', 'Flask',
    'FastAPI', 'Laravel', 'Ruby on Rails', 'ASP.NET', 'REST APIs',
    'GraphQL', 'gRPC', 'Microservices', 'Serverless', 'WebSockets',
    'Nest.js', 'Koa.js', 'Hapi.js', 'Strapi',
  ],
  'Databases': [
    'MySQL', 'MongoDB', 'PostgreSQL', 'Oracle SQL', 'SQL Server',
    'Redis', 'Firebase', 'SQLite', 'Cassandra', 'DynamoDB',
    'Elasticsearch', 'Neo4j', 'CouchDB', 'MariaDB', 'Supabase',
  ],
  'AI & Machine Learning': [
    'Machine Learning', 'Deep Learning', 'Artificial Intelligence',
    'Natural Language Processing', 'NLP', 'Computer Vision',
    'TensorFlow', 'PyTorch', 'Scikit-learn', 'Keras', 'Pandas',
    'NumPy', 'Matplotlib', 'Seaborn', 'OpenCV', 'Generative AI',
    'Large Language Models', 'LLMs', 'Hugging Face', 'LangChain',
    'Reinforcement Learning', 'Data Science', 'Data Analysis',
  ],
  'Cloud & DevOps': [
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes',
    'CI/CD', 'Jenkins', 'GitHub Actions', 'Terraform', 'Ansible',
    'Linux', 'Shell Scripting', 'Nginx', 'Apache',
    'Cloudflare', 'Vercel', 'Netlify', 'Heroku', 'DigitalOcean',
  ],
  'Tools & Technologies': [
    'Git', 'GitHub', 'GitLab', 'Postman', 'VS Code', 'IntelliJ IDEA',
    'Jira', 'Figma', 'Notion', 'Slack', 'Confluence',
    'Selenium', 'Jest', 'Cypress', 'Vitest', 'Mocha', 'Chai',
    'RabbitMQ', 'Apache Kafka', 'Socket.IO',
  ],
  'Core Computer Science': [
    'Data Structures and Algorithms', 'DSA', 'Object-Oriented Programming',
    'OOP', 'DBMS', 'Operating Systems', 'Computer Networks',
    'System Design', 'Design Patterns', 'Compiler Design',
    'Discrete Mathematics', 'Theory of Computation',
    'Software Engineering', 'Agile', 'Scrum',
  ],
  'Cybersecurity': [
    'Network Security', 'Ethical Hacking', 'Penetration Testing',
    'Cryptography', 'OWASP', 'Cybersecurity', 'Firewalls',
    'SIEM', 'Vulnerability Assessment',
  ],
  'Mobile Development': [
    'Android Development', 'iOS Development', 'Flutter',
    'React Native', 'Kotlin', 'Swift', 'Ionic', 'Xamarin',
  ],
  'Professional Skills': [
    'Communication', 'Teamwork', 'Leadership', 'Problem Solving',
    'Time Management', 'Critical Thinking', 'Adaptability',
    'Creativity', 'Presentation Skills', 'Project Management',
    'Analytical Thinking', 'Attention to Detail', 'Self-Motivation',
  ],
};

/** Flat deduplicated list of all skills for fast autocomplete search */
export const ALL_SKILLS = [
  ...new Set(Object.values(SKILLS_BY_CATEGORY).flat()),
];
