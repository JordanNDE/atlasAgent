module.exports = {
  apps: [
    {
      name: 'atlas-agent',
      script: 'pnpm',
      args: 'start --character="characters/atlas2.character.json"',
      cwd: '/root/projects/agents/atlasAgents'
    }
  ]
}
