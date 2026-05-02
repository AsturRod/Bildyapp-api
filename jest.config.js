export default {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/controllers/**/*.js',
    'src/routes/**/*.js',
    'src/middleware/**/*.js',
    'src/services/**/*.js',
    'src/validators/**/*.js',
  ],
};