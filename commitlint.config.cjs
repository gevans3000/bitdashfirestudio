module.exports = {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'subject-task-format': ({subject}) => [
          /^Task \d+:/.test(subject),
          'subject must start with "Task <number>:"'
        ],
      },
    },
  ],
  rules: {
    'subject-case': [0],
    'subject-task-format': [2, 'always'],
  },
};
